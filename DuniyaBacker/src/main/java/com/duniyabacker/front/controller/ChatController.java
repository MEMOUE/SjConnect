package com.duniyabacker.front.controller;

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
import lombok.RequiredArgsConstructor;
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

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@Tag(name = "Messagerie", description = "API pour la messagerie interne en temps réel")
public class ChatController {

    private final ChatService chatService;
    private final FileStorageService fileStorageService;

    /**
     * Créer une nouvelle conversation
     */
    @Operation(summary = "Créer une conversation", description = "Créer une nouvelle conversation privée ou de groupe")
    @PostMapping("/conversations")
    public ResponseEntity<ApiResponse<ConversationResponse>> createConversation(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreateConversationRequest request
    ) {
        return ResponseEntity.ok(chatService.createConversation(userDetails.getUsername(), request));
    }

    /**
     * Récupérer toutes les conversations de l'utilisateur
     */
    @Operation(summary = "Liste des conversations", description = "Obtenir toutes les conversations de l'utilisateur connecté")
    @GetMapping("/conversations")
    public ResponseEntity<Page<ConversationResponse>> getConversations(
            @AuthenticationPrincipal UserDetails userDetails,
            @PageableDefault(size = 20, sort = "updatedAt") Pageable pageable
    ) {
        return ResponseEntity.ok(chatService.getConversations(userDetails.getUsername(), pageable));
    }

    /**
     * Rechercher des conversations
     */
    @Operation(summary = "Rechercher des conversations", description = "Rechercher des conversations par nom")
    @GetMapping("/conversations/search")
    public ResponseEntity<List<ConversationResponse>> searchConversations(
            @AuthenticationPrincipal UserDetails userDetails,
            @Parameter(description = "Terme de recherche") @RequestParam String q
    ) {
        return ResponseEntity.ok(chatService.searchConversations(userDetails.getUsername(), q));
    }

    /**
     * Récupérer les messages d'une conversation
     */
    @Operation(summary = "Messages d'une conversation", description = "Obtenir les messages d'une conversation spécifique")
    @GetMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<Page<MessageResponse>> getMessages(
            @AuthenticationPrincipal UserDetails userDetails,
            @Parameter(description = "ID de la conversation") @PathVariable Long conversationId,
            @PageableDefault(size = 50, sort = "createdAt") Pageable pageable
    ) {
        return ResponseEntity.ok(chatService.getMessages(
                userDetails.getUsername(),
                conversationId,
                pageable
        ));
    }

    /**
     * Upload un fichier pour le chat
     */
    @Operation(summary = "Upload fichier", description = "Upload un fichier pour l'envoyer dans une conversation")
    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<FileUploadResponse>> uploadFile(
            @AuthenticationPrincipal UserDetails userDetails,
            @Parameter(description = "Fichier à uploader") @RequestParam("file") MultipartFile file
    ) {
        try {
            // Valider le fichier
            if (file.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Le fichier est vide"));
            }

            // Limite de 10MB
            long maxSize = 10 * 1024 * 1024;
            if (file.getSize() > maxSize) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Le fichier est trop volumineux (max 10MB)"));
            }

            // Sauvegarder le fichier
            String filename = fileStorageService.saveFile(file);
            String fileUrl = fileStorageService.getFileUrl(filename);
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
                    .body(ApiResponse.error("Erreur lors de l'upload du fichier: " + e.getMessage()));
        }
    }

    /**
     * Envoyer un message
     */
    @Operation(summary = "Envoyer un message", description = "Envoyer un nouveau message dans une conversation")
    @PostMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<ApiResponse<MessageResponse>> sendMessage(
            @AuthenticationPrincipal UserDetails userDetails,
            @Parameter(description = "ID de la conversation") @PathVariable Long conversationId,
            @Parameter(description = "Contenu du message") @RequestParam String content,
            @Parameter(description = "Type de message") @RequestParam(defaultValue = "TEXT") String type,
            @Parameter(description = "URL du fichier") @RequestParam(required = false) String fileUrl,
            @Parameter(description = "Nom du fichier") @RequestParam(required = false) String fileName,
            @Parameter(description = "ID du message parent") @RequestParam(required = false) Long parentMessageId
    ) {
        return ResponseEntity.ok(chatService.sendMessage(
                userDetails.getUsername(),
                conversationId,
                content,
                type,
                fileUrl,
                fileName,
                parentMessageId
        ));
    }

    /**
     * Marquer les messages comme lus
     */
    @Operation(summary = "Marquer comme lu", description = "Marquer un ou plusieurs messages comme lus")
    @PostMapping("/conversations/{conversationId}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @AuthenticationPrincipal UserDetails userDetails,
            @Parameter(description = "ID de la conversation") @PathVariable Long conversationId,
            @Parameter(description = "IDs des messages à marquer comme lus")
            @RequestParam(required = false) List<Long> messageIds
    ) {
        return ResponseEntity.ok(chatService.markAsRead(
                userDetails.getUsername(),
                conversationId,
                messageIds
        ));
    }
}

/**
 * DTO pour la réponse d'upload de fichier
 */
@lombok.Data
@lombok.Builder
class FileUploadResponse {
    private String filename;
    private String storedFilename;
    private String fileUrl;
    private String fileType;
    private Long fileSize;
}