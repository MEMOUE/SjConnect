package com.duniyabacker.front.service;

import com.duniyabacker.front.dto.request.ChangePasswordRequest;
import com.duniyabacker.front.dto.request.UpdateEntrepriseProfilRequest;
import com.duniyabacker.front.dto.response.ApiResponse;
import com.duniyabacker.front.dto.response.UserResponse;
import com.duniyabacker.front.entity.auth.Employe;
import com.duniyabacker.front.entity.auth.Entreprise;
import com.duniyabacker.front.entity.auth.Particulier;
import com.duniyabacker.front.exception.CustomExceptions.*;
import com.duniyabacker.front.repository.EntrepriseRepository;
import com.duniyabacker.front.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class EntrepriseService {

    private final EntrepriseRepository entrepriseRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Mettre à jour le profil de l'entreprise
     */
    @Transactional
    public ApiResponse<UserResponse> updateProfil(String username, UpdateEntrepriseProfilRequest request) {
        Entreprise entreprise = entrepriseRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Entreprise non trouvée"));

        // Vérifier si l'email est déjà utilisé par un autre compte
        if (!entreprise.getEmail().equals(request.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new ResourceAlreadyExistsException("Cette adresse email est déjà utilisée");
            }
            entreprise.setEmail(request.getEmail());
        }

        entreprise.setNomEntreprise(request.getNomEntreprise());
        entreprise.setTypeEntreprise(request.getTypeEntreprise());
        entreprise.setSecteurActivite(request.getSecteurActivite());

        if (request.getTelephone() != null && !request.getTelephone().isBlank()) {
            entreprise.setTelephone(request.getTelephone());
        }
        if (request.getAdressePhysique() != null) {
            entreprise.setAdressePhysique(request.getAdressePhysique());
        }
        if (request.getNumeroRegistreCommerce() != null) {
            entreprise.setNumeroRegistreCommerce(request.getNumeroRegistreCommerce());
        }
        if (request.getDescription() != null) {
            entreprise.setDescription(request.getDescription());
        }
        if (request.getSiteWeb() != null) {
            entreprise.setSiteWeb(request.getSiteWeb());
        }

        entrepriseRepository.save(entreprise);
        log.info("Profil entreprise mis à jour : {}", username);

        return ApiResponse.success("Profil mis à jour avec succès", mapToUserResponse(entreprise));
    }

    /**
     * Changer le mot de passe
     */
    @Transactional
    public ApiResponse<Void> changePassword(String username, ChangePasswordRequest request) {
        // Vérifier que les nouveaux mots de passe correspondent
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("Les mots de passe ne correspondent pas");
        }

        Entreprise entreprise = entrepriseRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Entreprise non trouvée"));

        // Vérifier l'ancien mot de passe
        if (!passwordEncoder.matches(request.getCurrentPassword(), entreprise.getPassword())) {
            throw new BadRequestException("Le mot de passe actuel est incorrect");
        }

        entreprise.setPassword(passwordEncoder.encode(request.getNewPassword()));
        entrepriseRepository.save(entreprise);

        log.info("Mot de passe modifié pour : {}", username);

        return ApiResponse.success("Mot de passe modifié avec succès");
    }

    // ── Mapping ──────────────────────────────────────────────────────
    public UserResponse mapToUserResponse(Entreprise entreprise) {
        return UserResponse.builder()
                .id(entreprise.getId())
                .username(entreprise.getUsername())
                .email(entreprise.getEmail())
                .telephone(entreprise.getTelephone())
                .role(entreprise.getRole().name())
                .createdAt(entreprise.getCreatedAt())
                .nomEntreprise(entreprise.getNomEntreprise())
                .typeEntreprise(entreprise.getTypeEntreprise())
                .secteurActivite(entreprise.getSecteurActivite())
                .adressePhysique(entreprise.getAdressePhysique())
                .numeroRegistreCommerce(entreprise.getNumeroRegistreCommerce())
                .description(entreprise.getDescription())
                .siteWeb(entreprise.getSiteWeb())
                .build();
    }
}