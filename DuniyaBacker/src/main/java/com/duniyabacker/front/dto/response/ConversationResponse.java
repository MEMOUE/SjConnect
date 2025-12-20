package com.duniyabacker.front.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO de réponse pour une conversation
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
 public class ConversationResponse {

    private Long id;
    private String name;
    private boolean isGroup;
    private String avatar;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Dernier message
    private MessageResponse lastMessage;

    // Nombre de messages non lus
    private long unreadCount;

    // Participants
    private List<ParticipantResponse> participants;

    // Statut (en ligne/hors ligne). Pour les conversations 1-1
    private boolean isOnline;
}

