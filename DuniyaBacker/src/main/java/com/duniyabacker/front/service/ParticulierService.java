package com.duniyabacker.front.service;

import com.duniyabacker.front.dto.request.ChangePasswordRequest;
import com.duniyabacker.front.dto.request.ConvertToEntrepriseRequest;
import com.duniyabacker.front.dto.request.UpdateParticulierProfilRequest;
import com.duniyabacker.front.dto.response.ApiResponse;
import com.duniyabacker.front.dto.response.UserResponse;
import com.duniyabacker.front.entity.Role;
import com.duniyabacker.front.entity.User;
import com.duniyabacker.front.entity.auth.Particulier;
import com.duniyabacker.front.exception.CustomExceptions.*;
import com.duniyabacker.front.repository.ParticulierRepository;
import com.duniyabacker.front.repository.UserRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
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

    @PersistenceContext
    private EntityManager entityManager;

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

    /**
     * Convertit un compte PARTICULIER en compte ENTREPRISE.
     * L'inheritance JOINED de User conserve le même id (donc les publications,
     * conversations, meetings, etc. déjà liés à ce compte restent valides) :
     * on retire la ligne "particuliers", on insère la ligne "entreprises"
     * correspondante, puis on bascule le rôle sur la table "users".
     */
    @Transactional
    public ApiResponse<Void> convertToEntreprise(String username, ConvertToEntrepriseRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));

        if (user.getRole() != Role.PARTICULIER) {
            throw new BadRequestException("Seul un compte particulier peut être converti en compte entreprise");
        }

        Long id = user.getId();

        entityManager.createNativeQuery("DELETE FROM particuliers WHERE id = :id")
                .setParameter("id", id)
                .executeUpdate();

        entityManager.createNativeQuery("""
                INSERT INTO entreprises
                    (id, nom_entreprise, type_entreprise, secteur_activite, adresse_physique,
                     numero_registre_commerce, description, site_web)
                VALUES
                    (:id, :nomEntreprise, :typeEntreprise, :secteurActivite, :adressePhysique,
                     :numeroRegistreCommerce, :description, :siteWeb)
                """)
                .setParameter("id", id)
                .setParameter("nomEntreprise", request.getNomEntreprise())
                .setParameter("typeEntreprise", request.getTypeEntreprise())
                .setParameter("secteurActivite", request.getSecteurActivite())
                .setParameter("adressePhysique", request.getAdressePhysique())
                .setParameter("numeroRegistreCommerce", request.getNumeroRegistreCommerce())
                .setParameter("description", request.getDescription())
                .setParameter("siteWeb", request.getSiteWeb())
                .executeUpdate();

        entityManager.createNativeQuery("UPDATE users SET role = 'ENTREPRISE' WHERE id = :id")
                .setParameter("id", id)
                .executeUpdate();

        entityManager.clear();

        log.info("Compte {} converti de PARTICULIER vers ENTREPRISE", username);

        return ApiResponse.success("Compte converti en compte entreprise avec succès. Merci de vous reconnecter.");
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
