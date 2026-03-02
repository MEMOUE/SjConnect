package com.duniyabacker.front.service;

import com.duniyabacker.front.dto.request.CreateConversationRequest;
import com.duniyabacker.front.dto.response.*;
import com.duniyabacker.front.entity.User;
import com.duniyabacker.front.entity.auth.Employe;
import com.duniyabacker.front.entity.auth.Entreprise;
import com.duniyabacker.front.entity.auth.Particulier;
import com.duniyabacker.front.entity.chat.Conversation;
import com.duniyabacker.front.entity.chat.Message;
import com.duniyabacker.front.exception.CustomExceptions.*;
import com.duniyabacker.front.repository.ConversationRepository;
import com.duniyabacker.front.repository.EmployeRepository;
import com.duniyabacker.front.repository.EntrepriseRepository;
import com.duniyabacker.front.repository.MessageRepository;
import com.duniyabacker.front.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final EntrepriseRepository entrepriseRepository;
    private final EmployeRepository employeRepository;
    private final SimpMessagingTemplate messagingTemplate;

    // =========================================================================
    // Créer une nouvelle conversation (usage interne / général)
    // =========================================================================
    @Transactional
    public ApiResponse<ConversationResponse> createConversation(
            String username,
            CreateConversationRequest request
    ) {
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));

        List<User> participants = new ArrayList<>();
        participants.add(currentUser);

        for (Long participantId : request.getParticipantIds()) {
            User participant = userRepository.findById(participantId)
                    .orElseThrow(() -> new ResourceNotFoundException("Participant non trouvé: " + participantId));
            if (!participant.getId().equals(currentUser.getId())) {
                participants.add(participant);
            }
        }

        // Pour une conversation privée, vérifier si elle existe déjà
        if (!request.isGroup() && participants.size() == 2) {
            User otherUser = participants.stream()
                    .filter(p -> !p.getId().equals(currentUser.getId()))
                    .findFirst()
                    .orElseThrow();

            var existing = conversationRepository.findPrivateConversation(
                    currentUser.getId(), otherUser.getId());

            if (existing.isPresent()) {
                return ApiResponse.success("Conversation existante",
                        mapToConversationResponse(existing.get(), currentUser.getId()));
            }
        }

        Conversation conversation = Conversation.builder()
                .name(request.getName())
                .isGroup(request.isGroup())
                .createdBy(currentUser)
                .build();

        participants.forEach(conversation::addParticipant);
        conversationRepository.save(conversation);

        log.info("Conversation créée: {} par {}", conversation.getName(), username);
        return ApiResponse.success("Conversation créée avec succès",
                mapToConversationResponse(conversation, currentUser.getId()));
    }

    // =========================================================================
    // B2B — Contacter une entreprise depuis la Marketplace
    // =========================================================================

    /**
     * Crée (ou récupère) une conversation de groupe B2B entre l'utilisateur courant
     * et l'entreprise cible. Tous les employés actifs des deux entreprises sont
     * automatiquement inclus.
     *
     * Appelé via : POST /api/chat/b2b/{entrepriseId}
     */
    @Transactional
    public ApiResponse<ConversationResponse> createOrGetB2BConversation(
            String username,
            Long targetEntrepriseId
    ) {
        // 1. Utilisateur courant
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));

        // 2. Entreprise cible
        Entreprise targetEntreprise = entrepriseRepository.findById(targetEntrepriseId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Entreprise introuvable : " + targetEntrepriseId));

        // 3. Déterminer l'entreprise source de l'utilisateur courant
        Entreprise sourceEntreprise = null;
        User sourceEntrepriseUser   = currentUser; // compte User de l'entreprise source

        if (currentUser instanceof Employe employe) {
            sourceEntreprise     = employe.getEntreprise();
            sourceEntrepriseUser = sourceEntreprise; // l'Entreprise EST un User
        } else if (currentUser instanceof Entreprise ent) {
            sourceEntreprise     = ent;
            sourceEntrepriseUser = ent;
        }

        // 4. Empêcher de contacter sa propre entreprise
        if (sourceEntreprise != null
                && sourceEntreprise.getId().equals(targetEntrepriseId)) {
            throw new BadRequestException(
                    "Vous ne pouvez pas contacter votre propre entreprise.");
        }

        // 5. Vérifier si une conversation B2B existe déjà
        //    On utilise les IDs User des deux comptes Entreprise
        Long sourceEntrepriseUserId = sourceEntrepriseUser.getId();
        Long targetEntrepriseUserId = targetEntreprise.getId();

        Optional<Conversation> existing = conversationRepository.findB2BConversation(
                sourceEntrepriseUserId, targetEntrepriseUserId);

        if (existing.isPresent()) {
            log.info("Conversation B2B existante trouvée : {}", existing.get().getId());
            return ApiResponse.success("Conversation B2B existante",
                    mapToConversationResponse(existing.get(), currentUser.getId()));
        }

        // 6. Collecter les participants (sans doublons)
        Set<Long>  addedIds    = new LinkedHashSet<>();
        List<User> participants = new ArrayList<>();

        // -- Utilisateur courant
        participants.add(currentUser);
        addedIds.add(currentUser.getId());

        // -- Employés actifs de l'entreprise source
        if (sourceEntreprise != null) {
            // Ajouter le compte Entreprise source (s'il n'est pas déjà dedans)
            if (!addedIds.contains(sourceEntrepriseUserId)) {
                participants.add(sourceEntrepriseUser);
                addedIds.add(sourceEntrepriseUserId);
            }

            Entreprise finalSource = sourceEntreprise;
            employeRepository.findByEntreprise(finalSource).stream()
                    .filter(User::isEnabled)                  // invitationAccepted + enabled
                    .filter(e -> !addedIds.contains(e.getId()))
                    .forEach(e -> {
                        participants.add(e);
                        addedIds.add(e.getId());
                    });
        }

        // -- Compte Entreprise cible
        if (!addedIds.contains(targetEntrepriseUserId)) {
            participants.add(targetEntreprise);
            addedIds.add(targetEntrepriseUserId);
        }

        // -- Employés actifs de l'entreprise cible
        employeRepository.findByEntreprise(targetEntreprise).stream()
                .filter(User::isEnabled)
                .filter(e -> !addedIds.contains(e.getId()))
                .forEach(e -> {
                    participants.add(e);
                    addedIds.add(e.getId());
                });

        // 7. Construire le nom de la conversation
        String sourceName = (sourceEntreprise != null)
                ? sourceEntreprise.getNomEntreprise()
                : currentUser.getUsername();
        String convName = "B2B:: " + sourceName + " ↔ " + targetEntreprise.getNomEntreprise();

        // 8. Créer la conversation
        Conversation conversation = Conversation.builder()
                .name(convName)
                .isGroup(true)
                .createdBy(currentUser)
                .build();

        participants.forEach(conversation::addParticipant);
        conversationRepository.save(conversation);

        // 9. Message système d'ouverture
        Message systemMsg = Message.builder()
                .content("💼 Conversation professionnelle ouverte entre "
                        + sourceName + " et " + targetEntreprise.getNomEntreprise())
                .type(Message.MessageType.TEXT)
                .sender(currentUser)
                .conversation(conversation)
                .build();
        messageRepository.save(systemMsg);

        log.info("Conversation B2B créée : {} ({} participants)",
                convName, participants.size());

        return ApiResponse.success("Conversation B2B créée avec succès",
                mapToConversationResponse(conversation, currentUser.getId()));
    }

    // =========================================================================
    // Message privé — depuis le panneau Participants d'un groupe
    // =========================================================================

    /**
     * Crée (ou récupère) une conversation privée 1-to-1 entre deux utilisateurs.
     *
     * Appelé via : POST /api/chat/private/{targetUserId}
     */
    @Transactional
    public ApiResponse<ConversationResponse> createOrGetPrivateConversation(
            String currentUsername,
            Long targetUserId
    ) {
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));

        if (currentUser.getId().equals(targetUserId)) {
            throw new BadRequestException("Vous ne pouvez pas vous envoyer un message.");
        }

        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Utilisateur introuvable : " + targetUserId));

        // Chercher une conversation privée existante
        Optional<Conversation> existing = conversationRepository.findPrivateConversation(
                currentUser.getId(), targetUserId);

        if (existing.isPresent()) {
            return ApiResponse.success("Conversation privée existante",
                    mapToConversationResponse(existing.get(), currentUser.getId()));
        }

        // Créer la conversation privée
        String convName = getUserDisplayName(currentUser)
                + " & " + getUserDisplayName(targetUser);

        Conversation conversation = Conversation.builder()
                .name(convName)
                .isGroup(false)
                .createdBy(currentUser)
                .build();

        conversation.addParticipant(currentUser);
        conversation.addParticipant(targetUser);
        conversationRepository.save(conversation);

        log.info("Conversation privée créée entre {} et {}",
                currentUsername, targetUser.getUsername());

        return ApiResponse.success("Conversation privée créée",
                mapToConversationResponse(conversation, currentUser.getId()));
    }

    // =========================================================================
    // Envoyer un message
    // =========================================================================
    @Transactional
    public ApiResponse<MessageResponse> sendMessage(
            String username,
            Long conversationId,
            String content,
            String messageType,
            String fileUrl,
            String fileName,
            Long parentMessageId
    ) {
        User sender = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));

        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation non trouvée"));

        if (!conversationRepository.isUserParticipant(conversationId, sender.getId())) {
            throw new ForbiddenException("Vous n'êtes pas participant de cette conversation");
        }

        Message.MessageBuilder messageBuilder = Message.builder()
                .content(content)
                .type(Message.MessageType.valueOf(messageType.toUpperCase()))
                .sender(sender)
                .conversation(conversation)
                .fileUrl(fileUrl)
                .fileName(fileName);

        if (parentMessageId != null) {
            messageRepository.findById(parentMessageId)
                    .ifPresent(messageBuilder::parentMessage);
        }

        Message message = messageBuilder.build();
        messageRepository.save(message);

        conversation.setUpdatedAt(LocalDateTime.now());
        conversationRepository.save(conversation);

        MessageResponse response = mapToMessageResponse(message);

        // Notification WebSocket à chaque participant
        conversation.getParticipants().forEach(participant -> {
            if (!participant.getId().equals(sender.getId())) {
                ChatNotification notification = ChatNotification.builder()
                        .type("NEW_MESSAGE")
                        .conversationId(conversationId)
                        .message(response)
                        .userId(sender.getId())
                        .username(sender.getUsername())
                        .timestamp(LocalDateTime.now())
                        .build();

                messagingTemplate.convertAndSendToUser(
                        participant.getUsername(),
                        "/queue/messages",
                        notification
                );
            }
        });

        log.info("Message envoyé dans la conversation {} par {}", conversationId, username);
        return ApiResponse.success("Message envoyé", response);
    }

    // =========================================================================
    // Récupérer les conversations d'un utilisateur
    // =========================================================================
    public Page<ConversationResponse> getConversations(String username, Pageable pageable) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));

        return conversationRepository.findByParticipantId(user.getId(), pageable)
                .map(conv -> mapToConversationResponse(conv, user.getId()));
    }

    // =========================================================================
    // Récupérer les messages d'une conversation
    // =========================================================================
    public Page<MessageResponse> getMessages(
            String username,
            Long conversationId,
            Pageable pageable
    ) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));

        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation non trouvée"));

        if (!conversationRepository.isUserParticipant(conversationId, user.getId())) {
            throw new ForbiddenException("Vous n'êtes pas participant de cette conversation");
        }

        return messageRepository.findByConversationOrderByCreatedAtDesc(conversation, pageable)
                .map(this::mapToMessageResponse);
    }

    // =========================================================================
    // Marquer les messages comme lus
    // =========================================================================
    @Transactional
    public ApiResponse<Void> markAsRead(
            String username,
            Long conversationId,
            List<Long> messageIds
    ) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));

        if (!conversationRepository.isUserParticipant(conversationId, user.getId())) {
            throw new ForbiddenException("Vous n'êtes pas participant de cette conversation");
        }

        if (messageIds == null || messageIds.isEmpty()) {
            messageRepository.markAllAsRead(conversationId, user.getId());
        } else {
            messageIds.forEach(messageId ->
                    messageRepository.findById(messageId).ifPresent(message -> {
                        if (!message.getSender().getId().equals(user.getId())) {
                            message.setRead(true);
                            message.setReadAt(LocalDateTime.now());
                            messageRepository.save(message);
                        }
                    })
            );
        }

        return ApiResponse.success("Messages marqués comme lus");
    }

    // =========================================================================
    // Rechercher des conversations
    // =========================================================================
    public List<ConversationResponse> searchConversations(String username, String searchTerm) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));

        return conversationRepository.searchConversations(user.getId(), searchTerm)
                .stream()
                .map(conv -> mapToConversationResponse(conv, user.getId()))
                .collect(Collectors.toList());
    }

    // =========================================================================
    // Mappers privés
    // =========================================================================

    private ConversationResponse mapToConversationResponse(Conversation conversation,
                                                           Long currentUserId) {
        Message lastMessage  = messageRepository.findLastMessage(conversation.getId());
        long    unreadCount  = messageRepository.countUnreadMessages(
                conversation.getId(), currentUserId);

        List<ParticipantResponse> participants = conversation.getParticipants().stream()
                .map(this::mapToParticipantResponse)
                .collect(Collectors.toList());

        String conversationName = conversation.getName();
        String avatar           = getConversationAvatar(conversation, currentUserId);
        boolean isOnline        = false;

        // Pour les conversations privées : afficher le nom de l'autre participant
        if (!conversation.isGroup() && conversation.getParticipants().size() == 2) {
            User otherUser = conversation.getParticipants().stream()
                    .filter(p -> !p.getId().equals(currentUserId))
                    .findFirst()
                    .orElse(null);

            if (otherUser != null) {
                conversationName = getUserDisplayName(otherUser);
                avatar = getInitials(conversationName);
            }
        }

        return ConversationResponse.builder()
                .id(conversation.getId())
                .name(conversationName)
                .isGroup(conversation.isGroup())
                .avatar(avatar)
                .createdAt(conversation.getCreatedAt())
                .updatedAt(conversation.getUpdatedAt())
                .lastMessage(lastMessage != null ? mapToMessageResponse(lastMessage) : null)
                .unreadCount(unreadCount)
                .participants(participants)
                .isOnline(isOnline)
                .build();
    }

    private MessageResponse mapToMessageResponse(Message message) {
        String senderName   = getUserDisplayName(message.getSender());
        String senderAvatar = getInitials(senderName);

        MessageResponse.MessageResponseBuilder builder = MessageResponse.builder()
                .id(message.getId())
                .content(message.getContent())
                .type(message.getType().name())
                .fileUrl(message.getFileUrl())
                .fileName(message.getFileName())
                .isRead(message.isRead())
                .isEdited(message.isEdited())
                .createdAt(message.getCreatedAt())
                .updatedAt(message.getUpdatedAt())
                .readAt(message.getReadAt())
                .senderId(message.getSender().getId())
                .senderName(senderName)
                .senderAvatar(senderAvatar)
                .conversationId(message.getConversation().getId());

        if (message.getParentMessage() != null) {
            builder.parentMessageId(message.getParentMessage().getId())
                    .parentMessageContent(message.getParentMessage().getContent());
        }

        return builder.build();
    }

    private ParticipantResponse mapToParticipantResponse(User user) {
        String name   = getUserDisplayName(user);
        String avatar = getInitials(name);

        // Détecter le rôle métier et l'entreprise d'appartenance
        String role = user.getRole().name();
        if (user instanceof Employe employe) {
            role = employe.getRolePlateforme() != null
                    ? employe.getRolePlateforme() : "EMPLOYE";
        }

        return ParticipantResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .name(name)
                .avatar(avatar)
                .isOnline(false)
                .role(role)
                .build();
    }

    String getUserDisplayName(User user) {
        if (user instanceof Entreprise entreprise) {
            return entreprise.getNomEntreprise();
        } else if (user instanceof Particulier particulier) {
            return particulier.getPrenom() + " " + particulier.getNom();
        } else if (user instanceof Employe employe) {
            return employe.getPrenom() + " " + employe.getNom();
        }
        return user.getUsername();
    }

    private String getInitials(String name) {
        if (name == null || name.isEmpty()) return "??";
        String[] parts = name.trim().split("\\s+");
        if (parts.length >= 2) {
            return ("" + parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
        }
        return name.substring(0, Math.min(2, name.length())).toUpperCase();
    }

    private String getConversationAvatar(Conversation conversation, Long currentUserId) {
        if (conversation.isGroup()) {
            return getInitials(conversation.getName().replace("B2B:: ", ""));
        }
        User otherUser = conversation.getParticipants().stream()
                .filter(p -> !p.getId().equals(currentUserId))
                .findFirst()
                .orElse(null);

        return (otherUser != null)
                ? getInitials(getUserDisplayName(otherUser))
                : getInitials(conversation.getName());
    }
}