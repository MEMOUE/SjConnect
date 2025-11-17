package com.duniyabacker.Front.repository;

import com.duniyabacker.Front.entity.auth.Employe;
import com.duniyabacker.Front.entity.auth.Entreprise;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeRepository extends JpaRepository<Employe, Long> {

    Optional<Employe> findByUsername(String username);

    Optional<Employe> findByEmail(String email);

    Optional<Employe> findByInvitationToken(String token);

    List<Employe> findByEntreprise(Entreprise entreprise);

    Page<Employe> findByEntreprise(Entreprise entreprise, Pageable pageable);

    List<Employe> findByEntrepriseAndDepartement(Entreprise entreprise, String departement);

    long countByEntreprise(Entreprise entreprise);

    boolean existsByEmailAndEntreprise(String email, Entreprise entreprise);
}