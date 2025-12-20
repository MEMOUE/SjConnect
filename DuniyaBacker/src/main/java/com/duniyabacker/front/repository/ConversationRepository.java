package com.duniyabacker.front.repository;

import com.duniyabacker.front.entity.chat.Conversation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    /**
     * Trouver toutes les conversations d'un utilisateur
     */
    @Query("SELECT DISTINCT c FROM Conversation c " +
            "JOIN c.participants p " +
            "WHERE p.id = :userId " +
            "ORDER BY c.updatedAt DESC")
    List<Conversation> findByParticipantId(@Param("userId") Long userId);

    /**
     * Trouver toutes les conversations d'un utilisateur (paginé)
     */
    @Query("SELECT DISTINCT c FROM Conversation c " +
            "JOIN c.participants p " +
            "WHERE p.id = :userId " +
            "ORDER BY c.updatedAt DESC")
    Page<Conversation> findByParticipantId(@Param("userId") Long userId, Pageable pageable);

    /**
     * Trouver une conversation privée entre deux utilisateurs
     */
    @Query("SELECT c FROM Conversation c " +
            "JOIN c.participants p1 " +
            "JOIN c.participants p2 " +
            "WHERE c.isGroup = false " +
            "AND p1.id = :userId1 " +
            "AND p2.id = :userId2 " +
            "AND SIZE(c.participants) = 2")
    Optional<Conversation> findPrivateConversation(
            @Param("userId1") Long userId1,
            @Param("userId2") Long userId2
    );

    /**
     * Vérifier si un utilisateur est participant d'une conversation
     */
    @Query("SELECT CASE WHEN COUNT(c) > 0 THEN true ELSE false END " +
            "FROM Conversation c " +
            "JOIN c.participants p " +
            "WHERE c.id = :conversationId " +
            "AND p.id = :userId")
    boolean isUserParticipant(
            @Param("conversationId") Long conversationId,
            @Param("userId") Long userId
    );

    /**
     * Rechercher des conversations par nom
     */
    @Query("SELECT DISTINCT c FROM Conversation c " +
            "JOIN c.participants p " +
            "WHERE p.id = :userId " +
            "AND LOWER(c.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
            "ORDER BY c.updatedAt DESC")
    List<Conversation> searchConversations(
            @Param("userId") Long userId,
            @Param("searchTerm") String searchTerm
    );
}