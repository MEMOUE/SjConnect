package com.duniyabacker.front.repository;

import com.duniyabacker.front.entity.publication.Publication;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PublicationRepository extends JpaRepository<Publication, Long> {

    /**
     * Publications visibles pour un type d'entreprise donné :
     * visibilité vide (tous) OU le type est dans la liste.
     */
    @Query("""
        SELECT DISTINCT p FROM Publication p
        WHERE p.statut = 'PUBLIE'
          AND (p.typesEntreprisesVisibles IS EMPTY
               OR :typeEntreprise MEMBER OF p.typesEntreprisesVisibles)
        ORDER BY p.createdAt DESC
    """)
    List<Publication> findVisiblePourType(@Param("typeEntreprise") String typeEntreprise);

    /** Toutes les publications publiées (sans filtre de type). */
    @Query("SELECT p FROM Publication p WHERE p.statut = 'PUBLIE' ORDER BY p.createdAt DESC")
    List<Publication> findAllPubliees();

    /** Publications d'un auteur. */
    @Query("SELECT p FROM Publication p WHERE p.auteur.id = :auteurId AND p.statut = 'PUBLIE' ORDER BY p.createdAt DESC")
    List<Publication> findByAuteurId(@Param("auteurId") Long auteurId);

    /** Paginé + filtré par type. */
    @Query("""
        SELECT DISTINCT p FROM Publication p
        WHERE p.statut = 'PUBLIE'
          AND (p.typesEntreprisesVisibles IS EMPTY
               OR :typeEntreprise MEMBER OF p.typesEntreprisesVisibles)
    """)
    Page<Publication> findVisiblePourTypePagine(
            @Param("typeEntreprise") String typeEntreprise,
            Pageable pageable
    );

    /** Recherche fulltext basique. */
    @Query("""
        SELECT DISTINCT p FROM Publication p
        WHERE p.statut = 'PUBLIE'
          AND (LOWER(p.titre) LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(p.contenu) LIKE LOWER(CONCAT('%', :q, '%')))
        ORDER BY p.createdAt DESC
    """)
    List<Publication> search(@Param("q") String q);
}