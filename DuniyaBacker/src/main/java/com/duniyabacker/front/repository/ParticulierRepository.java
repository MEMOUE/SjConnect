package com.duniyabacker.front.repository;

import com.duniyabacker.front.entity.auth.Particulier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ParticulierRepository extends JpaRepository<Particulier, Long> {

    Optional<Particulier> findByUsername(String username);

    Optional<Particulier> findByEmail(String email);
}