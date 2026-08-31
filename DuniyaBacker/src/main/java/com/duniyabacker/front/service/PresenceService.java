package com.duniyabacker.front.service;

import com.duniyabacker.front.dto.response.ChatNotification;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

/**
 * Suivi en mémoire des utilisateurs actuellement connectés en WebSocket.
 * Un même utilisateur peut avoir plusieurs sessions ouvertes (plusieurs
 * onglets/appareils) : il n'est considéré hors ligne que lorsque sa
 * dernière session se ferme.
 *
 * Une brève déconnexion/reconnexion WebSocket (heartbeat manqué, hoquet
 * réseau) pendant une session active se traduirait sinon par un aller-retour
 * "hors ligne" / "en ligne" visible à l'écran des autres utilisateurs, alors
 * que la personne n'a jamais réellement quitté le chat. Une fenêtre de grâce
 * absorbe ces flaps avant d'annoncer "hors ligne".
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PresenceService {

    private static final long OFFLINE_GRACE_SECONDS = 8;

    private final SimpMessagingTemplate messagingTemplate;

    private final Map<String, Set<String>> sessionsByUsername = new ConcurrentHashMap<>();
    private final Map<String, String> usernameBySessionId = new ConcurrentHashMap<>();
    private final Map<String, ScheduledFuture<?>> pendingOffline = new ConcurrentHashMap<>();

    private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor(r -> {
        Thread t = new Thread(r, "presence-offline-grace");
        t.setDaemon(true);
        return t;
    });

    /**
     * Enregistre une nouvelle session pour l'utilisateur.
     * @return true si l'utilisateur vient de passer de hors ligne à en ligne
     *         (à ignorer/annoncer côté appelant) ; false si c'est une simple
     *         reconnexion absorbée par la fenêtre de grâce.
     */
    public boolean userConnected(String username, String sessionId) {
        usernameBySessionId.put(sessionId, username);
        Set<String> sessions = sessionsByUsername.computeIfAbsent(username, k -> ConcurrentHashMap.newKeySet());
        boolean wasOffline = sessions.isEmpty();
        sessions.add(sessionId);

        ScheduledFuture<?> pending = pendingOffline.remove(username);
        if (pending != null) {
            pending.cancel(false);
            // "Hors ligne" n'a jamais été annoncé : ne pas annoncer "en ligne" non plus.
            return false;
        }
        return wasOffline;
    }

    /**
     * Retire une session fermée. Si c'était la dernière session de
     * l'utilisateur, planifie l'annonce "hors ligne" après une fenêtre de
     * grâce plutôt que de l'annoncer immédiatement.
     */
    public void userDisconnected(String sessionId) {
        String username = usernameBySessionId.remove(sessionId);
        if (username == null) {
            return;
        }

        Set<String> sessions = sessionsByUsername.get(username);
        if (sessions == null) {
            return;
        }

        sessions.remove(sessionId);
        if (!sessions.isEmpty()) {
            return; // une autre session de cet utilisateur est encore active
        }
        sessionsByUsername.remove(username);

        ScheduledFuture<?> future = scheduler.schedule(() -> {
            pendingOffline.remove(username);
            log.info("Utilisateur passé hors ligne: {}", username);
            broadcastStatus(username, "USER_OFFLINE");
        }, OFFLINE_GRACE_SECONDS, TimeUnit.SECONDS);
        pendingOffline.put(username, future);
    }

    /** En ligne si une session est ouverte, ou si on est encore dans la fenêtre de grâce. */
    public boolean isOnline(String username) {
        if (username == null) {
            return false;
        }
        Set<String> sessions = sessionsByUsername.get(username);
        if (sessions != null && !sessions.isEmpty()) {
            return true;
        }
        return pendingOffline.containsKey(username);
    }

    private void broadcastStatus(String username, String type) {
        ChatNotification notification = ChatNotification.builder()
                .type(type)
                .username(username)
                .timestamp(LocalDateTime.now())
                .build();
        messagingTemplate.convertAndSend("/topic/public", notification);
    }

    @PreDestroy
    void shutdown() {
        scheduler.shutdownNow();
    }
}
