package com.duniyabacker.front.repository;

import com.duniyabacker.front.entity.auth.Entreprise;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EntrepriseRepository extends JpaRepository<Entreprise, Long> {

    Optional<Entreprise> findByUsername(String username);

    Optional<Entreprise> findByEmail(String email);

    Optional<Entreprise> findByNomEntreprise(String nomEntreprise);

    boolean existsByNomEntreprise(String nomEntreprise);
}