package com.duniyabacker.front.repository;

import com.duniyabacker.front.entity.b2b.MessageProjet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageProjetRepository extends JpaRepository<MessageProjet, Long> {

    /** Messages d'un projet, du plus ancien au plus récent (ordre chat). */
    List<MessageProjet> findByProjet_IdOrderByCreatedAtAsc(Long projetId);
}