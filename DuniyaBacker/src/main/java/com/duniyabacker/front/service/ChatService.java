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
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Créer une nouvelle conversation
     */
    @Transactional
    public ApiResponse<ConversationResponse> createConversation(
            String username,
            CreateConversationRequest request
    ) {
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));

        // Récupérer les participants
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

            var existingConversation = conversationRepository.findPrivateConversation(
                    currentUser.getId(),
                    otherUser.getId()
            );

            if (existingConversation.isPresent()) {
                return ApiResponse.success(
                        "Conversation existante",
                        mapToConversationResponse(existingConversation.get(), currentUser.getId())
                );
            }
        }

        // Créer la conversation
        Conversation conversation = Conversation.builder()
                .name(request.getName())
                .isGroup(request.isGroup())
                .createdBy(currentUser)
                .build();

        participants.forEach(conversation::addParticipant);

        conversationRepository.save(conversation);

        log.info("Conversation créée: {} par {}", conversation.getName(), username);

        return ApiResponse.success(
                "Conversation créée avec succès",
                mapToConversationResponse(conversation, currentUser.getId())
        );
    }

    /**
     * Envoyer un message
     */
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

        // Vérifier que l'utilisateur est participant
        if (!conversationRepository.isUserParticipant(conversationId, sender.getId())) {
            throw new ForbiddenException("Vous n'êtes pas participant de cette conversation");
        }

        // Créer le message
        Message.MessageBuilder messageBuilder = Message.builder()
                .content(content)
                .type(Message.MessageType.valueOf(messageType.toUpperCase()))
                .sender(sender)
                .conversation(conversation)
                .fileUrl(fileUrl)
                .fileName(fileName);

        // Message parent (si c'est une réponse)
        if (parentMessageId != null) {
            Message parentMessage = messageRepository.findById(parentMessageId)
                    .orElse(null);
            messageBuilder.parentMessage(parentMessage);
        }

        Message message = messageBuilder.build();
        messageRepository.save(message);

        // Mettre à jour la conversation
        conversation.setUpdatedAt(LocalDateTime.now());
        conversationRepository.save(conversation);

        MessageResponse response = mapToMessageResponse(message);

        // Envoyer la notification WebSocket aux participants
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

    /**
     * Récupérer les conversations d'un utilisateur
     */
    public Page<ConversationResponse> getConversations(String username, Pageable pageable) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));

        return conversationRepository.findByParticipantId(user.getId(), pageable)
                .map(conv -> mapToConversationResponse(conv, user.getId()));
    }

    /**
     * Récupérer les messages d'une conversation
     */
    public Page<MessageResponse> getMessages(
            String username,
            Long conversationId,
            Pageable pageable
    ) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));

        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation non trouvée"));

        // Vérifier que l'utilisateur est participant
        if (!conversationRepository.isUserParticipant(conversationId, user.getId())) {
            throw new ForbiddenException("Vous n'êtes pas participant de cette conversation");
        }

        return messageRepository.findByConversationOrderByCreatedAtDesc(conversation, pageable)
                .map(this::mapToMessageResponse);
    }

    /**
     * Marquer les messages comme lus
     */
    @Transactional
    public ApiResponse<Void> markAsRead(String username, Long conversationId, List<Long> messageIds) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));

        if (!conversationRepository.isUserParticipant(conversationId, user.getId())) {
            throw new ForbiddenException("Vous n'êtes pas participant de cette conversation");
        }

        if (messageIds == null || messageIds.isEmpty()) {
            // Marquer tous les messages comme lus
            messageRepository.markAllAsRead(conversationId, user.getId());
        } else {
            // Marquer les messages spécifiés comme lus
            messageIds.forEach(messageId -> {
                messageRepository.findById(messageId).ifPresent(message -> {
                    if (!message.getSender().getId().equals(user.getId())) {
                        message.setRead(true);
                        message.setReadAt(LocalDateTime.now());
                        messageRepository.save(message);
                    }
                });
            });
        }

        return ApiResponse.success("Messages marqués comme lus");
    }

    /**
     * Rechercher des conversations
     */
    public List<ConversationResponse> searchConversations(String username, String searchTerm) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));

        return conversationRepository.searchConversations(user.getId(), searchTerm)
                .stream()
                .map(conv -> mapToConversationResponse(conv, user.getId()))
                .collect(Collectors.toList());
    }

    /**
     * Mapper Conversation vers ConversationResponse
     */
    private ConversationResponse mapToConversationResponse(Conversation conversation, Long currentUserId) {
        Message lastMessage = messageRepository.findLastMessage(conversation.getId());
        long unreadCount = messageRepository.countUnreadMessages(conversation.getId(), currentUserId);

        List<ParticipantResponse> participants = conversation.getParticipants().stream()
                .map(this::mapToParticipantResponse)
                .collect(Collectors.toList());

        // Pour les conversations privées, utiliser le nom de l'autre participant
        String conversationName = conversation.getName();
        String avatar = getConversationAvatar(conversation, currentUserId);
        boolean isOnline = false;

        if (!conversation.isGroup() && conversation.getParticipants().size() == 2) {
            User otherUser = conversation.getParticipants().stream()
                    .filter(p -> !p.getId().equals(currentUserId))
                    .findFirst()
                    .orElse(null);

            if (otherUser != null) {
                conversationName = getUserDisplayName(otherUser);
                avatar = getInitials(conversationName);
                // TODO: Implémenter la logique de statut en ligne
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

    /**
     * Mapper Message vers MessageResponse
     */
    private MessageResponse mapToMessageResponse(Message message) {
        String senderName = getUserDisplayName(message.getSender());
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

    /**
     * Mapper User vers ParticipantResponse
     */
    private ParticipantResponse mapToParticipantResponse(User user) {
        String name = getUserDisplayName(user);
        String avatar = getInitials(name);

        return ParticipantResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .name(name)
                .avatar(avatar)
                .isOnline(false) // TODO: Implémenter la logique de statut
                .role(user.getRole().name())
                .build();
    }

    /**
     * Obtenir le nom d'affichage d'un utilisateur
     */
    private String getUserDisplayName(User user) {
        if (user instanceof Entreprise entreprise) {
            return entreprise.getNomEntreprise();
        } else if (user instanceof Particulier particulier) {
            return particulier.getPrenom() + " " + particulier.getNom();
        } else if (user instanceof Employe employe) {
            return employe.getPrenom() + " " + employe.getNom();
        }
        return user.getUsername();
    }

    /**
     * Obtenir les initiales d'un nom
     */
    private String getInitials(String name) {
        if (name == null || name.isEmpty()) {
            return "??";
        }

        String[] parts = name.trim().split("\\s+");
        if (parts.length >= 2) {
            return (parts[0].charAt(0) + "" + parts[1].charAt(0)).toUpperCase();
        }
        return name.substring(0, Math.min(2, name.length())).toUpperCase();
    }

    /**
     * Obtenir l'avatar de la conversation
     */
    private String getConversationAvatar(Conversation conversation, Long currentUserId) {
        if (conversation.isGroup()) {
            return getInitials(conversation.getName());
        }

        User otherUser = conversation.getParticipants().stream()
                .filter(p -> !p.getId().equals(currentUserId))
                .findFirst()
                .orElse(null);

        if (otherUser != null) {
            return getInitials(getUserDisplayName(otherUser));
        }

        return getInitials(conversation.getName());
    }
}