package com.duniyabacker.front.service;

import com.duniyabacker.front.dto.response.ChatNotification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;
import java.time.LocalDateTime;

/**
 * Détecte automatiquement les connexions/déconnexions WebSocket (fermeture
 * d'onglet incluse) pour tenir à jour la présence en ligne des utilisateurs,
 * sans dépendre d'un signal explicite envoyé par le frontend.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketPresenceListener {

    private final PresenceService presenceService;
    private final SimpMessagingTemplate messagingTemplate;

    @EventListener
    public void handleSessionConnected(SessionConnectedEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        Principal user = accessor.getUser();
        String sessionId = accessor.getSessionId();

        if (user == null || sessionId == null) {
            return;
        }

        boolean justCameOnline = presenceService.userConnected(user.getName(), sessionId);
        log.info("Session WebSocket connectée: {} (session={})", user.getName(), sessionId);

        if (justCameOnline) {
            broadcastStatus(user.getName(), "USER_ONLINE");
        }
    }

    @EventListener
    public void handleSessionDisconnect(SessionDisconnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = accessor.getSessionId();

        if (sessionId == null) {
            return;
        }

        presenceService.userDisconnected(sessionId).ifPresent(username -> {
            log.info("Utilisateur passé hors ligne: {}", username);
            broadcastStatus(username, "USER_OFFLINE");
        });
    }

    private void broadcastStatus(String username, String type) {
        ChatNotification notification = ChatNotification.builder()
                .type(type)
                .username(username)
                .timestamp(LocalDateTime.now())
                .build();

        messagingTemplate.convertAndSend("/topic/public", notification);
    }
}
