package com.duniyabacker.front.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime; /**
 * DTO pour les notifications en temps réel
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
 public class ChatNotification {

    private String type; // NEW_MESSAGE, MESSAGE_READ, USER_TYPING, USER_ONLINE, USER_OFFLINE
    private Long conversationId;
    private MessageResponse message;
    private Long userId;
    private String username;
    private LocalDateTime timestamp;
}
