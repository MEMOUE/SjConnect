package com.duniyabacker.front.repository;

import com.duniyabacker.front.entity.b2b.DocumentProjet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentProjetRepository extends JpaRepository<DocumentProjet, Long> {

    List<DocumentProjet> findByProjet_IdOrderByCreatedAtDesc(Long projetId);

    long countByProjet_Id(Long projetId);
}