package com.duniyabacker.front.controller;

import com.duniyabacker.front.dto.request.CallInviteRequest;
import com.duniyabacker.front.dto.request.CallStartedRequest;
import com.duniyabacker.front.dto.request.CreateConversationRequest;
import com.duniyabacker.front.dto.response.ApiResponse;
import com.duniyabacker.front.dto.response.ConversationResponse;
import com.duniyabacker.front.dto.response.MessageResponse;
import com.duniyabacker.front.service.ChatService;
import com.duniyabacker.front.service.FileStorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Messagerie", description = "API pour la messagerie interne en temps réel")
public class ChatController {

    private final ChatService chatService;
    private final FileStorageService fileStorageService;

    // =========================================================================
    // Conversations classiques
    // =========================================================================

    @Operation(summary = "Créer une conversation",
            description = "Créer une nouvelle conversation privée ou de groupe")
    @PostMapping("/conversations")
    public ResponseEntity<ApiResponse<ConversationResponse>> createConversation(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreateConversationRequest request
    ) {
        return ResponseEntity.ok(
                chatService.createConversation(userDetails.getUsername(), request));
    }

    @Operation(summary = "Liste des conversations",
            description = "Obtenir toutes les conversations de l'utilisateur connecté")
    @GetMapping("/conversations")
    public ResponseEntity<Page<ConversationResponse>> getConversations(
            @AuthenticationPrincipal UserDetails userDetails,
            @PageableDefault(size = 20, sort = "updatedAt") Pageable pageable
    ) {
        return ResponseEntity.ok(
                chatService.getConversations(userDetails.getUsername(), pageable));
    }

    @Operation(summary = "Rechercher des conversations",
            description = "Rechercher des conversations par nom")
    @GetMapping("/conversations/search")
    public ResponseEntity<List<ConversationResponse>> searchConversations(
            @AuthenticationPrincipal UserDetails userDetails,
            @Parameter(description = "Terme de recherche") @RequestParam String q
    ) {
        return ResponseEntity.ok(
                chatService.searchConversations(userDetails.getUsername(), q));
    }

    // =========================================================================
    // Gestion de groupe
    // =========================================================================

    @Operation(summary = "Modifier une conversation",
            description = "Mettre à jour le nom d'une conversation (groupe)")
    @PutMapping("/conversations/{conversationId}")
    public ResponseEntity<ApiResponse<ConversationResponse>> updateConversation(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long conversationId,
            @RequestBody Map<String, String> body
    ) {
        String newName = body.get("name");
        return ResponseEntity.ok(
                chatService.updateConversation(
                        userDetails.getUsername(), conversationId, newName));
    }

    @Operation(summary = "Ajouter des participants",
            description = "Ajouter des participants à une conversation de groupe")
    @PostMapping("/conversations/{conversationId}/participants")
    public ResponseEntity<ApiResponse<ConversationResponse>> addParticipants(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long conversationId,
            @RequestBody AddParticipantsBody body
    ) {
        log.info("Ajout participants à la conversation {} : ids={}",
                conversationId, body.getParticipantIds());

        return ResponseEntity.ok(
                chatService.addParticipants(
                        userDetails.getUsername(), conversationId,
                        body.getParticipantIds()));
    }

    @Operation(summary = "Retirer un participant",
            description = "Retirer un participant d'une conversation de groupe")
    @DeleteMapping("/conversations/{conversationId}/participants/{userId}")
    public ResponseEntity<ApiResponse<Void>> removeParticipant(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long conversationId,
            @PathVariable Long userId
    ) {
        log.info("Retrait participant {} de la conversation {}",
                userId, conversationId);

        return ResponseEntity.ok(
                chatService.removeParticipant(
                        userDetails.getUsername(), conversationId, userId));
    }

    @Operation(summary = "Quitter un groupe",
            description = "L'utilisateur quitte une conversation de groupe")
    @PostMapping("/conversations/{conversationId}/leave")
    public ResponseEntity<ApiResponse<Void>> leaveConversation(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long conversationId
    ) {
        return ResponseEntity.ok(
                chatService.leaveConversation(
                        userDetails.getUsername(), conversationId));
    }

    @Operation(summary = "Supprimer une conversation",
            description = "Supprimer une conversation et tous ses messages")
    @DeleteMapping("/conversations/{conversationId}")
    public ResponseEntity<ApiResponse<Void>> deleteConversation(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long conversationId
    ) {
        return ResponseEntity.ok(
                chatService.deleteConversation(
                        userDetails.getUsername(), conversationId));
    }

    // =========================================================================
    // Messages
    // =========================================================================

    @Operation(summary = "Messages d'une conversation",
            description = "Obtenir les messages d'une conversation spécifique")
    @GetMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<Page<MessageResponse>> getMessages(
            @AuthenticationPrincipal UserDetails userDetails,
            @Parameter(description = "ID de la conversation") @PathVariable Long conversationId,
            @PageableDefault(size = 50, sort = "createdAt") Pageable pageable
    ) {
        return ResponseEntity.ok(chatService.getMessages(
                userDetails.getUsername(), conversationId, pageable));
    }

    @Operation(summary = "Envoyer un message",
            description = "Envoyer un nouveau message dans une conversation")
    @PostMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<ApiResponse<MessageResponse>> sendMessage(
            @AuthenticationPrincipal UserDetails userDetails,
            @Parameter(description = "ID de la conversation") @PathVariable Long conversationId,
            @Parameter(description = "Contenu du message")   @RequestParam String content,
            @Parameter(description = "Type de message")      @RequestParam(defaultValue = "TEXT") String type,
            @Parameter(description = "URL du fichier")       @RequestParam(required = false) String fileUrl,
            @Parameter(description = "Nom du fichier")       @RequestParam(required = false) String fileName,
            @Parameter(description = "ID du message parent") @RequestParam(required = false) Long parentMessageId
    ) {
        return ResponseEntity.ok(chatService.sendMessage(
                userDetails.getUsername(), conversationId,
                content, type, fileUrl, fileName, parentMessageId));
    }

    // =========================================================================
    // Édition & suppression de messages
    // =========================================================================

    @Operation(summary = "Modifier un message",
            description = "Modifier le contenu d'un message envoyé par l'utilisateur")
    @PutMapping("/messages/{messageId}")
    public ResponseEntity<ApiResponse<MessageResponse>> editMessage(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long messageId,
            @RequestParam String content
    ) {
        return ResponseEntity.ok(
                chatService.editMessage(
                        userDetails.getUsername(), messageId, content));
    }

    @Operation(summary = "Supprimer un message",
            description = "Supprimer un message envoyé par l'utilisateur")
    @DeleteMapping("/messages/{messageId}")
    public ResponseEntity<ApiResponse<Void>> deleteMessage(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long messageId
    ) {
        return ResponseEntity.ok(
                chatService.deleteMessage(
                        userDetails.getUsername(), messageId));
    }

    // =========================================================================
    // Marquer comme lu
    // =========================================================================

    @Operation(summary = "Marquer comme lu",
            description = "Marquer un ou plusieurs messages comme lus")
    @PostMapping("/conversations/{conversationId}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @AuthenticationPrincipal UserDetails userDetails,
            @Parameter(description = "ID de la conversation") @PathVariable Long conversationId,
            @Parameter(description = "IDs des messages à marquer comme lus")
            @RequestParam(required = false) List<Long> messageIds
    ) {
        return ResponseEntity.ok(chatService.markAsRead(
                userDetails.getUsername(), conversationId, messageIds));
    }

    // =========================================================================
    // Upload de fichier
    // =========================================================================

    @Operation(summary = "Upload fichier",
            description = "Upload un fichier pour l'envoyer dans une conversation")
    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<FileUploadResponse>> uploadFile(
            @AuthenticationPrincipal UserDetails userDetails,
            @Parameter(description = "Fichier à uploader") @RequestParam("file") MultipartFile file
    ) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Le fichier est vide"));
            }
            if (file.getSize() > 10 * 1024 * 1024) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Le fichier est trop volumineux (max 10 MB)"));
            }

            String filename = fileStorageService.saveFile(file);
            String fileUrl  = fileStorageService.getFileUrl(filename);
            String fileType = fileStorageService.getFileType(filename);

            FileUploadResponse response = FileUploadResponse.builder()
                    .filename(file.getOriginalFilename())
                    .storedFilename(filename)
                    .fileUrl(fileUrl)
                    .fileType(fileType)
                    .fileSize(file.getSize())
                    .build();

            return ResponseEntity.ok(ApiResponse.success("Fichier uploadé avec succès", response));

        } catch (IOException e) {
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Erreur lors de l'upload : " + e.getMessage()));
        }
    }

    // =========================================================================
    // B2B — Contacter une entreprise depuis la Marketplace
    // =========================================================================

    @Operation(
            summary = "Contacter une entreprise (B2B)",
            description = "Crée ou récupère une conversation de groupe incluant tous les " +
                    "employés actifs des deux entreprises. Idempotent."
    )
    @PostMapping("/b2b/{entrepriseId}")
    public ResponseEntity<ApiResponse<ConversationResponse>> contacterEntreprise(
            @AuthenticationPrincipal UserDetails userDetails,
            @Parameter(description = "ID de l'entreprise à contacter") @PathVariable Long entrepriseId
    ) {
        return ResponseEntity.ok(
                chatService.createOrGetB2BConversation(
                        userDetails.getUsername(), entrepriseId));
    }

    // =========================================================================
    // Recherche d'utilisateur par email
    // =========================================================================

    @Operation(
            summary = "Rechercher un utilisateur par email",
            description = "Recherche un utilisateur existant sur la plateforme par son adresse " +
                    "email, pour démarrer une nouvelle conversation."
    )
    @GetMapping("/users/search-by-email")
    public ResponseEntity<ApiResponse<Map<String, Object>>> searchUserByEmail(
            @AuthenticationPrincipal UserDetails userDetails,
            @Parameter(description = "Email de l'utilisateur recherché") @RequestParam String email
    ) {
        return ResponseEntity.ok(
                chatService.searchUserByEmail(userDetails.getUsername(), email));
    }

    // =========================================================================
    // Message privé
    // =========================================================================

    @Operation(
            summary = "Démarrer une conversation privée",
            description = "Crée ou récupère une conversation privée entre l'utilisateur " +
                    "courant et un autre utilisateur. Idempotent."
    )
    @PostMapping("/private/{targetUserId}")
    public ResponseEntity<ApiResponse<ConversationResponse>> startPrivateConversation(
            @AuthenticationPrincipal UserDetails userDetails,
            @Parameter(description = "ID de l'utilisateur cible") @PathVariable Long targetUserId
    ) {
        return ResponseEntity.ok(
                chatService.createOrGetPrivateConversation(
                        userDetails.getUsername(), targetUserId));
    }

    // =========================================================================
    // Inviter une personne par email à un appel en cours
    // =========================================================================

    @Operation(
            summary = "Inviter par email à un appel",
            description = "Envoie par email un lien pour rejoindre l'appel en cours dans une conversation"
    )
    @PostMapping("/conversations/{conversationId}/invite-call")
    public ResponseEntity<ApiResponse<Void>> inviteToCall(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long conversationId,
            @Valid @RequestBody CallInviteRequest request
    ) {
        return ResponseEntity.ok(
                chatService.inviteToCall(
                        userDetails.getUsername(), conversationId,
                        request.getEmail(), request.getCallLink()));
    }

    // =========================================================================
    // Notifier le lancement d'un appel aux participants de la conversation
    // =========================================================================

    @Operation(
            summary = "Notifier le lancement d'un appel",
            description = "Envoie à tous les participants de la conversation un lien pour rejoindre l'appel qui vient de démarrer"
    )
    @PostMapping("/conversations/{conversationId}/call-started")
    public ResponseEntity<ApiResponse<Void>> notifyCallStarted(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long conversationId,
            @Valid @RequestBody CallStartedRequest request
    ) {
        return ResponseEntity.ok(
                chatService.notifyCallStarted(
                        userDetails.getUsername(), conversationId,
                        request.getCallLink(), request.getCallType()));
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// DTOs internes
// ─────────────────────────────────────────────────────────────────────────────

/**
 * DTO typé pour l'ajout de participants.
 * Remplace Map<String, List<Long>> qui pose des problèmes de désérialisation
 * Jackson (Integer vs Long).
 */
@Data
class AddParticipantsBody {
    private List<Long> participantIds;
}

@lombok.Data
@lombok.Builder
class FileUploadResponse {
    private String filename;
    private String storedFilename;
    private String fileUrl;
    private String fileType;
    private Long   fileSize;
}