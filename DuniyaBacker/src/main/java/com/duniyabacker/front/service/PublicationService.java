package com.duniyabacker.front.service;

import com.duniyabacker.front.dto.request.CreatePublicationRequest;
import com.duniyabacker.front.dto.response.ApiResponse;
import com.duniyabacker.front.dto.response.PublicationResponse;
import com.duniyabacker.front.entity.User;
import com.duniyabacker.front.entity.auth.Employe;
import com.duniyabacker.front.entity.auth.Entreprise;
import com.duniyabacker.front.entity.publication.Publication;
import com.duniyabacker.front.exception.CustomExceptions.*;
import com.duniyabacker.front.repository.PublicationRepository;
import com.duniyabacker.front.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PublicationService {

    private final PublicationRepository publicationRepository;
    private final UserRepository        userRepository;

    // ─── Créer ──────────────────────────────────────────────────────────────
    @Transactional
    public ApiResponse<PublicationResponse> createPublication(
            String username,
            CreatePublicationRequest request
    ) {
        User auteur = getUser(username);

        Publication pub = Publication.builder()
                .titre(request.getTitre())
                .contenu(request.getContenu())
                .typesEntreprisesVisibles(request.getTypesEntreprisesVisibles())
                .mediaUrl(request.getMediaUrl())
                .mediaType(request.getMediaType())
                .mediaNom(request.getMediaNom())
                .mediaTaille(request.getMediaTaille())
                .auteur(auteur)
                .build();

        publicationRepository.save(pub);
        pub.initTransientFields();

        log.info("Publication créée par {} (id={})", username, pub.getId());
        return ApiResponse.success("Publication créée avec succès", toResponse(pub));
    }

    // ─── Feed filtré selon le type d'entreprise ─────────────────────────────
    @Transactional(readOnly = true)
    public List<PublicationResponse> getFeed(String username) {
        User user = getUser(username);

        List<Publication> pubs;
        if (user instanceof Entreprise entreprise) {
            pubs = publicationRepository.findVisiblePourType(
                    normaliserType(entreprise.getTypeEntreprise()));
        } else {
            // Particuliers et employés voient tout
            pubs = publicationRepository.findAllPubliees();
        }

        pubs.forEach(Publication::initTransientFields);
        return pubs.stream().map(this::toResponse).collect(Collectors.toList());
    }

    // ─── Mes publications ────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<PublicationResponse> getMesPublications(String username) {
        User user = getUser(username);
        List<Publication> pubs = publicationRepository.findByAuteurId(user.getId());
        pubs.forEach(Publication::initTransientFields);
        return pubs.stream().map(this::toResponse).collect(Collectors.toList());
    }

    // ─── Recherche ───────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<PublicationResponse> search(String q) {
        List<Publication> pubs = publicationRepository.search(q);
        pubs.forEach(Publication::initTransientFields);
        return pubs.stream().map(this::toResponse).collect(Collectors.toList());
    }

    // ─── Supprimer (archiver) ────────────────────────────────────────────────
    @Transactional
    public ApiResponse<Void> deletePublication(String username, Long pubId) {
        User user = getUser(username);
        Publication pub = publicationRepository.findById(pubId)
                .orElseThrow(() -> new ResourceNotFoundException("Publication non trouvée"));

        if (!pub.getAuteur().getId().equals(user.getId())) {
            throw new ForbiddenException("Vous ne pouvez supprimer que vos propres publications");
        }

        pub.setStatut(Publication.StatutPublication.ARCHIVE);
        publicationRepository.save(pub);
        log.info("Publication {} archivée par {}", pubId, username);
        return ApiResponse.success("Publication supprimée avec succès");
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private User getUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));
    }

    /**
     * Normalise le type d'entreprise vers les valeurs constantes du système.
     * Ex : "Banque commerciale" → "BANQUES"
     */
    private String normaliserType(String raw) {
        if (raw == null) return "";
        String lower = raw.toLowerCase();
        if (lower.contains("banque"))       return "BANQUES";
        if (lower.contains("assurance"))    return "ASSURANCES";
        if (lower.contains("sgi"))          return "SGI";
        if (lower.contains("sgo"))          return "SGO";
        if (lower.contains("fonds") || lower.contains("investissement"))
            return "FONDS_INVESTISSEMENT";
        if (lower.contains("microfinance")) return "MICROFINANCE";
        if (lower.contains("bourse"))       return "SOCIETES_BOURSE";
        if (lower.contains("courtier"))     return "COURTIERS";
        return raw.toUpperCase();
    }

    /**
     * Mappe une Publication vers PublicationResponse.
     * Calcule auteurEntrepriseId :
     *   - Entreprise  → l'auteur lui-même est l'entreprise
     *   - Employé     → l'entreprise de l'employé
     *   - Particulier → null (pas d'entreprise à contacter via ce bouton)
     */
    private PublicationResponse toResponse(Publication p) {

        // Récupérer l'auteur depuis le transient (déjà initialisé via initTransientFields)
        Long auteurEntrepriseId = resolveEntrepriseId(p);

        return PublicationResponse.builder()
                .id(p.getId())
                .titre(p.getTitre())
                .contenu(p.getContenu())
                .mediaUrl(p.getMediaUrl())
                .mediaType(p.getMediaType())
                .mediaNom(p.getMediaNom())
                .mediaTaille(p.getMediaTaille())
                .auteurId(p.getAuteurId())
                .auteurNom(p.getAuteurNom())
                .auteurType(p.getAuteurType())
                .auteurInitiales(p.getAuteurInitiales())
                .auteurEntrepriseId(auteurEntrepriseId)
                .typesEntreprisesVisibles(p.getTypesEntreprisesVisibles())
                .visibleParTous(p.getTypesEntreprisesVisibles() == null
                        || p.getTypesEntreprisesVisibles().isEmpty())
                .nombreVues(p.getNombreVues())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }

    /**
     * Résout l'ID de l'entreprise publieure d'une publication.
     * Nécessite que initTransientFields() ait été appelé sur la publication.
     */
    private Long resolveEntrepriseId(Publication p) {
        if (p.getAuteur() == null) return null;

        if (p.getAuteur() instanceof Entreprise) {
            // L'auteur EST l'entreprise — son User.id = entreprise.id
            return p.getAuteur().getId();
        }
        if (p.getAuteur() instanceof Employe employe) {
            // L'auteur est un employé → renvoyer l'ID de son entreprise
            return employe.getEntreprise() != null
                    ? employe.getEntreprise().getId()
                    : null;
        }
        // Particulier : pas d'entreprise
        return null;
    }
}