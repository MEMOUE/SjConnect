package com.duniyabacker.front.repository;

import com.duniyabacker.front.entity.b2b.TacheProjet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TacheProjetRepository extends JpaRepository<TacheProjet, Long> {

    List<TacheProjet> findByProjet_IdOrderByCreatedAtDesc(Long projetId);

    List<TacheProjet> findByProjet_IdAndStatutOrderByCreatedAtDesc(Long projetId, TacheProjet.StatutTache statut);

    long countByProjet_Id(Long projetId);

    long countByProjet_IdAndStatut(Long projetId, TacheProjet.StatutTache statut);
}