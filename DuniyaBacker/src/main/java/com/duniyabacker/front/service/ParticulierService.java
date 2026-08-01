package com.duniyabacker.front.service;

import com.duniyabacker.front.dto.request.ChangePasswordRequest;
import com.duniyabacker.front.dto.request.UpdateParticulierProfilRequest;
import com.duniyabacker.front.dto.response.ApiResponse;
import com.duniyabacker.front.dto.response.UserResponse;
import com.duniyabacker.front.entity.auth.Particulier;
import com.duniyabacker.front.exception.CustomExceptions.*;
import com.duniyabacker.front.repository.ParticulierRepository;
import com.duniyabacker.front.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ParticulierService {

    private final ParticulierRepository particulierRepository;
    private final UserRepository        userRepository;
    private final PasswordEncoder       passwordEncoder;

    /**
     * Mettre à jour le profil du particulier
     */
    @Transactional
    public ApiResponse<UserResponse> updateProfil(String username, UpdateParticulierProfilRequest request) {
        Particulier particulier = particulierRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Particulier non trouvé"));

        if (request.getEmail() != null && !request.getEmail().isBlank()
                && !particulier.getEmail().equals(request.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new ResourceAlreadyExistsException("Cette adresse email est déjà utilisée");
            }
            particulier.setEmail(request.getEmail());
        }

        particulier.setPrenom(request.getPrenom());
        particulier.setNom(request.getNom());
        particulier.setSecteurActivite(request.getSecteurActivite());

        if (request.getTelephone() != null && !request.getTelephone().isBlank()) {
            particulier.setTelephone(request.getTelephone());
        }
        if (request.getPosteActuel() != null) {
            particulier.setPosteActuel(request.getPosteActuel());
        }
        if (request.getBio() != null) {
            particulier.setBio(request.getBio());
        }
        particulier.setNewsletter(request.isNewsletter());

        particulierRepository.save(particulier);
        log.info("Profil particulier mis à jour : {}", username);

        return ApiResponse.success("Profil mis à jour avec succès", mapToUserResponse(particulier));
    }

    /**
     * Changer le mot de passe
     */
    @Transactional
    public ApiResponse<Void> changePassword(String username, ChangePasswordRequest request) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("Les mots de passe ne correspondent pas");
        }

        Particulier particulier = particulierRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Particulier non trouvé"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), particulier.getPassword())) {
            throw new BadRequestException("Le mot de passe actuel est incorrect");
        }

        particulier.setPassword(passwordEncoder.encode(request.getNewPassword()));
        particulierRepository.save(particulier);

        log.info("Mot de passe modifié pour : {}", username);

        return ApiResponse.success("Mot de passe modifié avec succès");
    }

    // ── Mapping ──────────────────────────────────────────────────────
    public UserResponse mapToUserResponse(Particulier particulier) {
        return UserResponse.builder()
                .id(particulier.getId())
                .username(particulier.getUsername())
                .email(particulier.getEmail())
                .telephone(particulier.getTelephone())
                .role(particulier.getRole().name())
                .createdAt(particulier.getCreatedAt())
                .prenom(particulier.getPrenom())
                .nom(particulier.getNom())
                .genre(particulier.getGenre())
                .secteurActivite(particulier.getSecteurActivite())
                .posteActuel(particulier.getPosteActuel())
                .bio(particulier.getBio())
                .newsletter(particulier.isNewsletter())
                .build();
    }
}
