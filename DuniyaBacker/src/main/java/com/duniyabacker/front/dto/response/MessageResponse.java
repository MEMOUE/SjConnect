package com.duniyabacker.front.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime; /**
 * DTO de réponse pour un message
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
 public class MessageResponse {

    private Long id;
    private String content;
    private String type;
    private String fileUrl;
    private String fileName;
    private boolean isRead;
    private boolean isEdited;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime readAt;

    // Informations sur l'expéditeur
    private Long senderId;
    private String senderName;
    private String senderAvatar;

    // ID de la conversation
    private Long conversationId;

    // Message parent (si c'est une réponse)
    private Long parentMessageId;
    private String parentMessageContent;
}
