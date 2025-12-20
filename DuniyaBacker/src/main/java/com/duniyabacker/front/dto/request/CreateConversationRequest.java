package com.duniyabacker.front.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

/**
 * DTO pour créer une nouvelle conversation
 */
@Data
 public class CreateConversationRequest {

    @NotBlank(message = "Le nom de la conversation est requis")
    @Size(max = 100, message = "Le nom ne peut pas dépasser 100 caractères")
    private String name;

    private boolean isGroup = false;

    @NotNull(message = "La liste des participants est requise")
    @Size(min = 1, message = "Au moins un participant est requis")
    private List<Long> participantIds;
}

/**
 * DTO pour envoyer un message
 */
@Data
class SendMessageRequest {

    @NotNull(message = "L'ID de la conversation est requis")
    private Long conversationId;

    @NotBlank(message = "Le contenu du message est requis")
    @Size(max = 5000, message = "Le message ne peut pas dépasser 5000 caractères")
    private String content;

    private String messageType = "TEXT";

    private String fileUrl;

    private String fileName;

    private Long parentMessageId;
}

/**
 * DTO pour marquer les messages comme lus
 */
@Data
class MarkAsReadRequest {

    @NotNull(message = "L'ID de la conversation est requis")
    private Long conversationId;

    private List<Long> messageIds;
}

/**
 * DTO pour ajouter des participants à une conversation
 */
@Data
class AddParticipantsRequest {

    @NotNull(message = "L'ID de la conversation est requis")
    private Long conversationId;

    @NotNull(message = "La liste des participants est requise")
    @Size(min = 1, message = "Au moins un participant est requis")
    private List<Long> participantIds;
}