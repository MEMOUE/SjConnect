package com.duniyabacker.front.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO pour les notifications en temps réel.
 *
 * Types supportés :
 *  - NEW_MESSAGE       : nouveau message reçu
 *  - MESSAGE_EDITED    : un message a été modifié
 *  - MESSAGE_DELETED   : un message a été supprimé
 *  - MESSAGE_READ      : message(s) marqué(s) comme lu(s)
 *  - USER_TYPING       : un utilisateur est en train d'écrire
 *  - USER_STOP_TYPING  : l'utilisateur a arrêté d'écrire
 *  - USER_ONLINE       : un utilisateur est connecté
 *  - USER_OFFLINE      : un utilisateur s'est déconnecté
 *  - CONVERSATION_DELETED : une conversation a été supprimée
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatNotification {

    private String type;
    private Long conversationId;
    private MessageResponse message;

    /**
     * ID du message supprimé — utilisé par le frontend pour MESSAGE_DELETED.
     * Le frontend lit notification.messageId directement.
     */
    private Long messageId;

    private Long userId;
    private String username;
    private LocalDateTime timestamp;
}