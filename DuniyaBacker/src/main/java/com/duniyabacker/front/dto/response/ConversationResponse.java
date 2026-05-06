package com.duniyabacker.front.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
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

    /**
     * FIX : Sans @JsonProperty, Lombok génère isGroup() comme getter,
     * et Jackson sérialise ça en "group" au lieu de "isGroup".
     * Le frontend Angular lit conv.isGroup → undefined → les options de groupe
     * ne s'affichent jamais.
     */
    @JsonProperty("isGroup")
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
    @JsonProperty("isOnline")
    private boolean isOnline;
}