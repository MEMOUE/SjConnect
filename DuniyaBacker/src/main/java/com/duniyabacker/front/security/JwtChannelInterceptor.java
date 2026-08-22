package com.duniyabacker.front.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;

/**
 * Authentifie les sessions STOMP à partir du header "Authorization" envoyé
 * dans la frame CONNECT (connectHeaders côté client) : un WebSocket brut ne
 * permet pas d'envoyer de header HTTP au moment du handshake, le JWT est
 * donc validé ici plutôt que par JwtAuthenticationFilter.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JwtChannelInterceptor implements ChannelInterceptor {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    @Override
    public Message<?> preSend(@NonNull Message<?> message, @NonNull MessageChannel channel) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authHeader = accessor.getFirstNativeHeader("Authorization");

            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                log.warn("Connexion WebSocket refusée: header Authorization manquant");
                throw new MessagingException("Authentification WebSocket requise");
            }

            String jwt = authHeader.substring(7);
            try {
                String username = jwtService.extractUsername(jwt);
                if (username == null) {
                    throw new MessagingException("Jeton JWT invalide");
                }

                UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                if (!jwtService.isTokenValid(jwt, userDetails)) {
                    throw new MessagingException("Jeton JWT expiré ou invalide");
                }

                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(
                                userDetails, null, userDetails.getAuthorities());
                accessor.setUser(authToken);
            } catch (MessagingException e) {
                throw e;
            } catch (Exception e) {
                // Rejeter la connexion plutôt que de la laisser passer sans Principal :
                // sinon le client croit être connecté (PresenceService/convertAndSendToUser
                // ne fonctionnent alors plus pour cette session, silencieusement).
                log.warn("Échec d'authentification WebSocket: {}", e.getMessage());
                throw new MessagingException("Échec d'authentification WebSocket", e);
            }
        }

        return message;
    }
}
