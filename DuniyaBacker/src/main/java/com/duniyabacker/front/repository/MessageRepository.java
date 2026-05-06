package com.duniyabacker.front.repository;

import com.duniyabacker.front.entity.chat.Conversation;
import com.duniyabacker.front.entity.chat.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    Page<Message> findByConversationOrderByCreatedAtDesc(
            Conversation conversation,
            Pageable pageable);

    // Dernier message d'une conversation
    @Query("""
        SELECT m FROM Message m
        WHERE m.conversation.id = :conversationId
        ORDER BY m.createdAt DESC
        LIMIT 1
        """)
    Message findLastMessage(@Param("conversationId") Long conversationId);

    // Compter les messages non lus (envoyés par d'autres)
    @Query("""
        SELECT COUNT(m) FROM Message m
        WHERE m.conversation.id = :conversationId
          AND m.sender.id <> :userId
          AND m.isRead = false
        """)
    long countUnreadMessages(
            @Param("conversationId") Long conversationId,
            @Param("userId") Long userId);

    // Marquer tous les messages d'une conversation comme lus
    @Modifying
    @Query("""
        UPDATE Message m
        SET m.isRead = true, m.readAt = CURRENT_TIMESTAMP
        WHERE m.conversation.id = :conversationId
          AND m.sender.id <> :userId
          AND m.isRead = false
        """)
    void markAllAsRead(
            @Param("conversationId") Long conversationId,
            @Param("userId") Long userId);
}