package com.duniyabacker.front.service;

import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Suivi en mémoire des utilisateurs actuellement connectés en WebSocket.
 * Un même utilisateur peut avoir plusieurs sessions ouvertes (plusieurs
 * onglets/appareils) : il n'est considéré hors ligne que lorsque sa
 * dernière session se ferme.
 */
@Service
public class PresenceService {

    private final Map<String, Set<String>> sessionsByUsername = new ConcurrentHashMap<>();
    private final Map<String, String> usernameBySessionId = new ConcurrentHashMap<>();

    /**
     * Enregistre une nouvelle session pour l'utilisateur.
     * @return true si l'utilisateur vient de passer de hors ligne à en ligne
     */
    public boolean userConnected(String username, String sessionId) {
        usernameBySessionId.put(sessionId, username);
        Set<String> sessions = sessionsByUsername.computeIfAbsent(username, k -> ConcurrentHashMap.newKeySet());
        boolean wasOffline = sessions.isEmpty();
        sessions.add(sessionId);
        return wasOffline;
    }

    /**
     * Retire une session fermée.
     * @return le nom d'utilisateur si c'était sa dernière session (donc passé hors ligne), vide sinon
     */
    public Optional<String> userDisconnected(String sessionId) {
        String username = usernameBySessionId.remove(sessionId);
        if (username == null) {
            return Optional.empty();
        }

        Set<String> sessions = sessionsByUsername.get(username);
        if (sessions == null) {
            return Optional.empty();
        }

        sessions.remove(sessionId);
        if (sessions.isEmpty()) {
            sessionsByUsername.remove(username);
            return Optional.of(username);
        }

        return Optional.empty();
    }

    public boolean isOnline(String username) {
        if (username == null) {
            return false;
        }
        Set<String> sessions = sessionsByUsername.get(username);
        return sessions != null && !sessions.isEmpty();
    }
}
