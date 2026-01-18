package com.duniyabacker.front.repository;

import com.duniyabacker.front.entity.b2b.ProjetB2B;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjetB2BRepository extends JpaRepository<ProjetB2B, Long> {

    /**
     * Trouver tous les projets créés par un utilisateur
     */
    @Query("SELECT p FROM ProjetB2B p WHERE p.createur.id = :userId ORDER BY p.updatedAt DESC")
    List<ProjetB2B> findByCreateurId(@Param("userId") Long userId);

    /**
     * Trouver tous les projets où l'utilisateur est participant ou créateur
     */
    @Query("SELECT DISTINCT p FROM ProjetB2B p " +
            "LEFT JOIN p.participants part " +
            "WHERE p.createur.id = :userId OR part.id = :userId " +
            "ORDER BY p.updatedAt DESC")
    List<ProjetB2B> findByUserIdAsCreatorOrParticipant(@Param("userId") Long userId);

    /**
     * Trouver les projets par statut pour un utilisateur
     */
    @Query("SELECT DISTINCT p FROM ProjetB2B p " +
            "LEFT JOIN p.participants part " +
            "WHERE (p.createur.id = :userId OR part.id = :userId) " +
            "AND p.statut = :statut " +
            "ORDER BY p.updatedAt DESC")
    List<ProjetB2B> findByUserIdAndStatut(
            @Param("userId") Long userId,
            @Param("statut") ProjetB2B.StatutProjet statut
    );

    /**
     * Rechercher des projets par nom ou description
     */
    @Query("SELECT DISTINCT p FROM ProjetB2B p " +
            "LEFT JOIN p.participants part " +
            "WHERE (p.createur.id = :userId OR part.id = :userId) " +
            "AND (LOWER(p.nom) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
            "OR LOWER(p.description) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) " +
            "ORDER BY p.updatedAt DESC")
    List<ProjetB2B> searchProjets(
            @Param("userId") Long userId,
            @Param("searchTerm") String searchTerm
    );

    /**
     * Vérifier si un utilisateur a accès à un projet
     */
    @Query("SELECT CASE WHEN COUNT(p) > 0 THEN true ELSE false END FROM ProjetB2B p " +
            "LEFT JOIN p.participants part " +
            "WHERE p.id = :projetId " +
            "AND (p.createur.id = :userId OR part.id = :userId)")
    boolean hasUserAccess(@Param("projetId") Long projetId, @Param("userId") Long userId);

    /**
     * Compter les projets actifs d'un utilisateur
     */
    @Query("SELECT COUNT(DISTINCT p) FROM ProjetB2B p " +
            "LEFT JOIN p.participants part " +
            "WHERE (p.createur.id = :userId OR part.id = :userId) " +
            "AND p.statut = 'ACTIF'")
    long countActiveProjets(@Param("userId") Long userId);

    /**
     * Obtenir les projets paginés
     */
    @Query("SELECT DISTINCT p FROM ProjetB2B p " +
            "LEFT JOIN p.participants part " +
            "WHERE p.createur.id = :userId OR part.id = :userId")
    Page<ProjetB2B> findByUserId(@Param("userId") Long userId, Pageable pageable);
}