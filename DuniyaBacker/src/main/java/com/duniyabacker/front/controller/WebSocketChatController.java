package com.duniyabacker.front.controller;


import com.duniyabacker.front.dto.response.ChatNotification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.time.LocalDateTime;

@Controller
@RequiredArgsConstructor
@Slf4j
public class WebSocketChatController {

    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Notification de frappe (typing indicator)
     */
    @MessageMapping("/chat.typing")
    public void handleTyping(
            @Payload ChatNotification notification,
            SimpMessageHeaderAccessor headerAccessor,
            Principal principal
    ) {
        notification.setUsername(principal.getName());
        notification.setTimestamp(LocalDateTime.now());
        notification.setType("USER_TYPING");

        // Envoyer la notification à la conversation
        messagingTemplate.convertAndSend(
                "/topic/conversation/" + notification.getConversationId(),
                notification
        );
    }

    /**
     * Notification d'arrêt de frappe
     */
    @MessageMapping("/chat.stopTyping")
    public void handleStopTyping(
            @Payload ChatNotification notification,
            Principal principal
    ) {
        notification.setUsername(principal.getName());
        notification.setTimestamp(LocalDateTime.now());
        notification.setType("USER_STOP_TYPING");

        messagingTemplate.convertAndSend(
                "/topic/conversation/" + notification.getConversationId(),
                notification
        );
    }

    /**
     * Notification de connexion
     */
    @MessageMapping("/chat.connect")
    @SendTo("/topic/public")
    public ChatNotification handleConnect(
            @Payload ChatNotification notification,
            Principal principal
    ) {
        notification.setUsername(principal.getName());
        notification.setTimestamp(LocalDateTime.now());
        notification.setType("USER_ONLINE");

        log.info("User connected: {}", principal.getName());

        return notification;
    }

    /**
     * Notification de déconnexion
     */
    @MessageMapping("/chat.disconnect")
    @SendTo("/topic/public")
    public ChatNotification handleDisconnect(
            @Payload ChatNotification notification,
            Principal principal
    ) {
        notification.setUsername(principal.getName());
        notification.setTimestamp(LocalDateTime.now());
        notification.setType("USER_OFFLINE");

        log.info("User disconnected: {}", principal.getName());

        return notification;
    }
}