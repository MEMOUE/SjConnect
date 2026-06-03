package com.duniyabacker.front.service;

import com.duniyabacker.front.dto.request.AddPartenaireRequest;
import com.duniyabacker.front.dto.request.CreateProjetB2BRequest;
import com.duniyabacker.front.dto.request.CreateTacheProjetRequest;
import com.duniyabacker.front.dto.response.ApiResponse;
import com.duniyabacker.front.entity.User;
import com.duniyabacker.front.entity.auth.Employe;
import com.duniyabacker.front.entity.auth.Entreprise;
import com.duniyabacker.front.entity.b2b.DocumentProjet;
import com.duniyabacker.front.entity.b2b.MessageProjet;
import com.duniyabacker.front.entity.b2b.PartenaireProjet;
import com.duniyabacker.front.entity.b2b.ProjetB2B;
import com.duniyabacker.front.entity.b2b.TacheProjet;
import com.duniyabacker.front.exception.CustomExceptions.*;
import com.duniyabacker.front.repository.DocumentProjetRepository;
import com.duniyabacker.front.repository.MessageProjetRepository;
import com.duniyabacker.front.repository.ProjetB2BRepository;
import com.duniyabacker.front.repository.TacheProjetRepository;
import com.duniyabacker.front.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjetB2BService {

    private final ProjetB2BRepository projetRepository;
    private final UserRepository userRepository;
    private final TacheProjetRepository tacheRepository;
    private final DocumentProjetRepository documentRepository;
    private final MessageProjetRepository messageRepository;

    @Value("${app.upload.dir:uploads/projets-b2b}")
    private String uploadDir;

    // ============================================
    // GESTION DES PROJETS
    // ============================================

    @Transactional
    public ApiResponse<ProjetB2B> createProjet(String username, CreateProjetB2BRequest request) {
        User createur = getUserByUsername(username);

        ProjetB2B projet = ProjetB2B.builder()
                .nom(request.getNom())
                .description(request.getDescription())
                .categorie(request.getCategorie())
                .priorite(ProjetB2B.PrioriteProjet.valueOf(request.getPriorite().toUpperCase()))
                .statut(ProjetB2B.StatutProjet.EN_ATTENTE)
                .progression(0)
                .dateDebut(request.getDateDebut())
                .dateFin(request.getDateFin())
                .budget(request.getBudget())
                .icone(request.getIcone())
                .createur(createur)
                .build();

        projet.addParticipant(createur);

        if (request.getParticipantIds() != null) {
            for (Long participantId : request.getParticipantIds()) {
                User participant = userRepository.findById(participantId)
                        .orElseThrow(() -> new ResourceNotFoundException("Participant non trouvé: " + participantId));
                projet.addParticipant(participant);
            }
        }

        if (request.getPartenaires() != null) {
            for (CreateProjetB2BRequest.PartenaireDTO partenaireDTO : request.getPartenaires()) {
                PartenaireProjet partenaire = PartenaireProjet.builder()
                        .nom(partenaireDTO.getNom())
                        .role(partenaireDTO.getRole())
                        .logo(partenaireDTO.getLogo())
                        .statut(PartenaireProjet.StatutPartenaire.ACTIF)
                        .build();
                projet.addPartenaire(partenaire);
            }
        }

        projetRepository.save(projet);
        log.info("Projet B2B créé: {} par {}", projet.getNom(), username);

        return ApiResponse.success("Projet créé avec succès", projet);
    }

    @Transactional(readOnly = true)
    public List<ProjetB2B> getMesProjets(String username) {
        User user = getUserByUsername(username);
        List<ProjetB2B> projets = projetRepository.findByUserIdAsCreatorOrParticipant(user.getId());
        projets.forEach(p -> {
            p.getPartenaires().size();
            p.initTransientFields();
        });
        return projets;
    }

    @Transactional(readOnly = true)
    public ProjetB2B getProjetById(String username, Long projetId) {
        User user = getUserByUsername(username);
        ProjetB2B projet = getProjetWithAccessCheck(projetId, user.getId());
        projet.getPartenaires().size();
        projet.initTransientFields();
        return projet;
    }

    @Transactional
    public ApiResponse<ProjetB2B> updateProjet(String username, Long projetId, CreateProjetB2BRequest request) {
        User user = getUserByUsername(username);
        ProjetB2B projet = getProjetWithAccessCheck(projetId, user.getId());

        if (!projet.getCreateur().getId().equals(user.getId())) {
            throw new ForbiddenException("Seul le créateur peut modifier le projet");
        }

        projet.setNom(request.getNom());
        projet.setDescription(request.getDescription());
        projet.setCategorie(request.getCategorie());
        projet.setPriorite(ProjetB2B.PrioriteProjet.valueOf(request.getPriorite().toUpperCase()));
        projet.setDateDebut(request.getDateDebut());
        projet.setDateFin(request.getDateFin());
        projet.setBudget(request.getBudget());
        projet.setIcone(request.getIcone());

        // Mise à jour des partenaires si fournis dans la requête.
        // ATTENTION : on ne touche qu'aux partenaires saisis manuellement
        // (utilisateurId == null) pour ne pas casser les liens de partage.
        if (request.getPartenaires() != null) {
            projet.getPartenaires().removeIf(p -> p.getUtilisateurId() == null);
            for (CreateProjetB2BRequest.PartenaireDTO dto : request.getPartenaires()) {
                PartenaireProjet partenaire = PartenaireProjet.builder()
                        .nom(dto.getNom())
                        .role(dto.getRole())
                        .logo(dto.getLogo())
                        .statut(PartenaireProjet.StatutPartenaire.ACTIF)
                        .build();
                projet.addPartenaire(partenaire);
            }
        }

        projetRepository.save(projet);
        projet.getPartenaires().size();
        log.info("Projet B2B mis à jour: {}", projet.getNom());

        return ApiResponse.success("Projet mis à jour avec succès", projet);
    }

    @Transactional
    public ApiResponse<ProjetB2B> updateStatut(String username, Long projetId, String statutStr) {
        User user = getUserByUsername(username);
        ProjetB2B projet = getProjetWithAccessCheck(projetId, user.getId());

        try {
            ProjetB2B.StatutProjet statut = ProjetB2B.StatutProjet.valueOf(statutStr.toUpperCase());
            projet.setStatut(statut);
            projetRepository.save(projet);
            projet.getPartenaires().size();
            log.info("Statut du projet {} mis à jour: {}", projetId, statut);
            return ApiResponse.success("Statut mis à jour", projet);
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Statut invalide: " + statutStr);
        }
    }

    @Transactional
    public ApiResponse<ProjetB2B> updateProgression(String username, Long projetId, Integer progression) {
        if (progression < 0 || progression > 100) {
            throw new BadRequestException("La progression doit être entre 0 et 100");
        }

        User user = getUserByUsername(username);
        ProjetB2B projet = getProjetWithAccessCheck(projetId, user.getId());

        projet.setProgression(progression);
        if (progression == 100) {
            projet.setStatut(ProjetB2B.StatutProjet.TERMINE);
        }

        projetRepository.save(projet);
        projet.getPartenaires().size();
        log.info("Progression du projet {} mise à jour: {}%", projetId, progression);

        return ApiResponse.success("Progression mise à jour", projet);
    }

    @Transactional
    public ApiResponse<Void> deleteProjet(String username, Long projetId) {
        User user = getUserByUsername(username);
        ProjetB2B projet = getProjetWithAccessCheck(projetId, user.getId());

        if (!projet.getCreateur().getId().equals(user.getId())) {
            throw new ForbiddenException("Seul le créateur peut supprimer le projet");
        }

        projetRepository.delete(projet);
        log.info("Projet {} supprimé par {}", projetId, username);

        return ApiResponse.success("Projet supprimé avec succès");
    }

    // ============================================
    // GESTION DES PARTICIPANTS
    // ============================================

    @Transactional
    public ApiResponse<ProjetB2B> addParticipant(String username, Long projetId, Long participantId) {
        User user = getUserByUsername(username);
        ProjetB2B projet = getProjetWithAccessCheck(projetId, user.getId());

        if (!projet.getCreateur().getId().equals(user.getId())) {
            throw new ForbiddenException("Seul le créateur peut ajouter des participants");
        }

        User participant = userRepository.findById(participantId)
                .orElseThrow(() -> new ResourceNotFoundException("Participant non trouvé"));

        projet.addParticipant(participant);
        projetRepository.save(projet);
        projet.getPartenaires().size();
        log.info("Participant {} ajouté au projet {}", participantId, projetId);

        return ApiResponse.success("Participant ajouté", projet);
    }

    @Transactional
    public ApiResponse<ProjetB2B> removeParticipant(String username, Long projetId, Long participantId) {
        User user = getUserByUsername(username);
        ProjetB2B projet = getProjetWithAccessCheck(projetId, user.getId());

        if (!projet.getCreateur().getId().equals(user.getId())) {
            throw new ForbiddenException("Seul le créateur peut retirer des participants");
        }
        if (participantId.equals(user.getId())) {
            throw new BadRequestException("Le créateur ne peut pas être retiré du projet");
        }

        User participant = userRepository.findById(participantId)
                .orElseThrow(() -> new ResourceNotFoundException("Participant non trouvé"));

        projet.removeParticipant(participant);
        projetRepository.save(projet);
        projet.getPartenaires().size();
        log.info("Participant {} retiré du projet {}", participantId, projetId);

        return ApiResponse.success("Participant retiré", projet);
    }

    // ============================================
    // GESTION DES PARTENAIRES
    // ============================================

    @Transactional
    public ApiResponse<ProjetB2B> addPartenaire(String username, Long projetId, AddPartenaireRequest request) {
        User user = getUserByUsername(username);
        ProjetB2B projet = getProjetWithAccessCheck(projetId, user.getId());

        String nom;
        String logo;
        Long utilisateurId = null;
        String role = request.getRole() != null && !request.getRole().isBlank()
                ? request.getRole() : "Partenaire";

        // ── Mode 1 : par userId (employé interne) ──
        if (request.getUserId() != null) {
            User target = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé: " + request.getUserId()));
            nom = resolveDisplayName(target);
            logo = "👤";
            utilisateurId = target.getId();
            projet.addParticipant(target); // ← partage le projet

            // ── Mode 2 : par email (utilisateur externe avec compte) ──
        } else if (request.getEmail() != null && !request.getEmail().isBlank()) {
            User target = userRepository.findByEmail(request.getEmail())
                    .orElseThrow(() -> new ResourceNotFoundException("Aucun utilisateur trouvé avec l'email: " + request.getEmail()));
            nom = resolveDisplayName(target);
            logo = "🌐";
            utilisateurId = target.getId();
            projet.addParticipant(target); // ← partage le projet

            // ── Mode 3 : saisie manuelle ──
        } else if (request.getNom() != null && !request.getNom().isBlank()) {
            nom = request.getNom();
            logo = request.getLogo() != null ? request.getLogo() : "🏢";
        } else {
            throw new BadRequestException("Veuillez fournir un userId, un email ou un nom");
        }

        PartenaireProjet partenaire = PartenaireProjet.builder()
                .nom(nom)
                .role(role)
                .logo(logo)
                .utilisateurId(utilisateurId)
                .statut(PartenaireProjet.StatutPartenaire.ACTIF)
                .build();

        projet.addPartenaire(partenaire);
        projetRepository.save(projet);
        projet.getPartenaires().size();

        log.info("Partenaire '{}' ajouté au projet {} (mode: {})", nom, projetId,
                request.getUserId() != null ? "interne" : request.getEmail() != null ? "email" : "manuel");
        return ApiResponse.success("Partenaire ajouté avec succès", projet);
    }

    @Transactional
    public ApiResponse<ProjetB2B> removePartenaire(String username, Long projetId, Long partenaireId) {
        User user = getUserByUsername(username);
        ProjetB2B projet = getProjetWithAccessCheck(projetId, user.getId());

        if (!projet.getCreateur().getId().equals(user.getId())) {
            throw new ForbiddenException("Seul le créateur peut retirer des partenaires");
        }

        PartenaireProjet partenaire = projet.getPartenaires().stream()
                .filter(p -> p.getId().equals(partenaireId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Partenaire non trouvé dans ce projet"));

        // Si le partenaire est un utilisateur de la plateforme, on lui retire aussi
        // l'accès au projet (sauf si c'est le créateur).
        Long uid = partenaire.getUtilisateurId();
        if (uid != null && !uid.equals(projet.getCreateur().getId())) {
            userRepository.findById(uid).ifPresent(projet::removeParticipant);
        }

        projet.removePartenaire(partenaire);
        projetRepository.save(projet);

        log.info("Partenaire {} retiré du projet {}", partenaireId, projetId);
        return ApiResponse.success("Partenaire retiré", projet);
    }

    /**
     * Rechercher un utilisateur par email (pour l'ajout externe).
     */
    @Transactional(readOnly = true)
    public Map<String, Object> searchUserByEmail(String email) {
        User u = userRepository.findByEmail(email).orElse(null);
        if (u == null) return null;
        Map<String, Object> result = new HashMap<>();
        result.put("id", u.getId());
        result.put("username", u.getUsername());
        result.put("nom", resolveDisplayName(u));
        result.put("email", u.getEmail());
        return result;
    }

    /**
     * Liste du personnel de la structure de l'utilisateur courant.
     * - ENTREPRISE → ses employés
     * - EMPLOYE    → les employés de son entreprise
     * - sinon      → liste vide
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getPersonnel(String username) {
        User user = getUserByUsername(username);

        Entreprise entreprise = null;
        if (user instanceof Entreprise e) {
            entreprise = e;
        } else if (user instanceof Employe emp) {
            entreprise = emp.getEntreprise();
        }

        if (entreprise == null) {
            return new ArrayList<>();
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (Employe emp : entreprise.getEmployes()) {
            Map<String, Object> m = new HashMap<>();
            m.put("id", emp.getId());
            m.put("nom", emp.getPrenom() + " " + emp.getNom());
            m.put("email", emp.getEmail());
            m.put("poste", emp.getPoste());
            m.put("actif", emp.isInvitationAccepted());
            result.add(m);
        }
        return result;
    }

    // ============================================
    // GESTION DES MESSAGES (NOUVEAU)
    // ============================================

    @Transactional(readOnly = true)
    public List<MessageProjet> getMessages(String username, Long projetId) {
        User user = getUserByUsername(username);
        getProjetWithAccessCheck(projetId, user.getId());
        List<MessageProjet> messages = messageRepository.findByProjet_IdOrderByCreatedAtAsc(projetId);
        messages.forEach(MessageProjet::initTransientFields);
        return messages;
    }

    @Transactional
    public ApiResponse<MessageProjet> sendMessage(String username, Long projetId, String contenu) {
        if (contenu == null || contenu.isBlank()) {
            throw new BadRequestException("Le contenu du message est requis");
        }

        User user = getUserByUsername(username);
        ProjetB2B projet = getProjetWithAccessCheck(projetId, user.getId());

        MessageProjet message = MessageProjet.builder()
                .contenu(contenu.trim())
                .expediteur(user)
                .build();

        projet.addMessage(message);
        projetRepository.save(projet); // cascade ALL → persiste le message

        message.initTransientFields();
        log.info("Message envoyé dans le projet {} par {}", projetId, username);
        return ApiResponse.success("Message envoyé", message);
    }

    // ============================================
    // GESTION DES TÂCHES
    // ============================================

    @Transactional
    public ApiResponse<TacheProjet> createTache(String username, Long projetId, CreateTacheProjetRequest request) {
        User user = getUserByUsername(username);
        ProjetB2B projet = getProjetWithAccessCheck(projetId, user.getId());

        TacheProjet.PrioriteTache priorite = TacheProjet.PrioriteTache.MOYENNE;
        if (request.getPriorite() != null) {
            try {
                priorite = TacheProjet.PrioriteTache.valueOf(request.getPriorite().toUpperCase());
            } catch (IllegalArgumentException ignored) {}
        }

        LocalDate dateEcheance = null;
        if (request.getDateEcheance() != null && !request.getDateEcheance().isBlank()) {
            dateEcheance = LocalDate.parse(request.getDateEcheance());
        }

        TacheProjet tache = TacheProjet.builder()
                .titre(request.getTitre())
                .description(request.getDescription())
                .priorite(priorite)
                .statut(TacheProjet.StatutTache.EN_ATTENTE)
                .assigneA(request.getAssigneA())
                .dateEcheance(dateEcheance)
                .build();

        projet.addTache(tache);
        projetRepository.save(projet);

        log.info("Tâche '{}' créée pour le projet {}", request.getTitre(), projetId);
        return ApiResponse.success("Tâche créée avec succès", tache);
    }

    @Transactional(readOnly = true)
    public List<TacheProjet> getTaches(String username, Long projetId) {
        User user = getUserByUsername(username);
        getProjetWithAccessCheck(projetId, user.getId());
        List<TacheProjet> taches = tacheRepository.findByProjet_IdOrderByCreatedAtDesc(projetId);
        taches.forEach(TacheProjet::initTransientFields);
        return taches;
    }

    @Transactional
    public ApiResponse<TacheProjet> updateStatutTache(String username, Long projetId, Long tacheId, String statutStr) {
        User user = getUserByUsername(username);
        getProjetWithAccessCheck(projetId, user.getId());

        TacheProjet tache = tacheRepository.findById(tacheId)
                .orElseThrow(() -> new ResourceNotFoundException("Tâche non trouvée"));

        if (!tache.getProjet().getId().equals(projetId)) {
            throw new BadRequestException("Cette tâche n'appartient pas à ce projet");
        }

        try {
            TacheProjet.StatutTache statut = TacheProjet.StatutTache.valueOf(statutStr.toUpperCase());
            tache.setStatut(statut);
            tacheRepository.save(tache);
            log.info("Statut de la tâche {} mis à jour: {}", tacheId, statut);
            return ApiResponse.success("Statut de la tâche mis à jour", tache);
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Statut de tâche invalide: " + statutStr);
        }
    }

    @Transactional
    public ApiResponse<Void> deleteTache(String username, Long projetId, Long tacheId) {
        User user = getUserByUsername(username);
        ProjetB2B projet = getProjetWithAccessCheck(projetId, user.getId());

        TacheProjet tache = tacheRepository.findById(tacheId)
                .orElseThrow(() -> new ResourceNotFoundException("Tâche non trouvée"));

        if (!tache.getProjet().getId().equals(projetId)) {
            throw new BadRequestException("Cette tâche n'appartient pas à ce projet");
        }

        projet.removeTache(tache);
        projetRepository.save(projet);

        log.info("Tâche {} supprimée du projet {}", tacheId, projetId);
        return ApiResponse.success("Tâche supprimée");
    }

    // ============================================
    // GESTION DES DOCUMENTS
    // ============================================

    @Transactional
    public ApiResponse<DocumentProjet> uploadDocument(String username, Long projetId, MultipartFile file) {
        User user = getUserByUsername(username);
        ProjetB2B projet = getProjetWithAccessCheck(projetId, user.getId());

        if (file.isEmpty()) {
            throw new BadRequestException("Le fichier est vide");
        }

        long maxSize = 10 * 1024 * 1024;
        if (file.getSize() > maxSize) {
            throw new BadRequestException("Le fichier dépasse la taille maximale de 10 MB");
        }

        try {
            Path uploadPath = Paths.get(uploadDir, String.valueOf(projetId));
            Files.createDirectories(uploadPath);

            String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "fichier";
            String extension = "";
            int dotIndex = originalName.lastIndexOf('.');
            if (dotIndex > 0) {
                extension = originalName.substring(dotIndex);
            }
            String storedName = UUID.randomUUID().toString() + extension;

            Path filePath = uploadPath.resolve(storedName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            DocumentProjet document = DocumentProjet.builder()
                    .nomFichier(originalName)
                    .nomOriginal(originalName)
                    .cheminFichier(filePath.toString())
                    .typeMime(file.getContentType())
                    .tailleFichier(file.getSize())
                    .uploadePar(username)
                    .build();

            projet.addDocument(document);
            projetRepository.save(projet);

            log.info("Document '{}' uploadé pour le projet {} par {}", originalName, projetId, username);
            return ApiResponse.success("Document uploadé avec succès", document);

        } catch (IOException e) {
            log.error("Erreur upload fichier pour projet {}: {}", projetId, e.getMessage());
            throw new RuntimeException("Erreur lors de l'upload du fichier", e);
        }
    }

    @Transactional(readOnly = true)
    public List<DocumentProjet> getDocuments(String username, Long projetId) {
        User user = getUserByUsername(username);
        getProjetWithAccessCheck(projetId, user.getId());
        List<DocumentProjet> docs = documentRepository.findByProjet_IdOrderByCreatedAtDesc(projetId);
        docs.forEach(DocumentProjet::initTransientFields);
        return docs;
    }

    @Transactional(readOnly = true)
    public DocumentProjet getDocument(String username, Long projetId, Long documentId) {
        User user = getUserByUsername(username);
        getProjetWithAccessCheck(projetId, user.getId());

        DocumentProjet document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document non trouvé"));

        if (!document.getProjet().getId().equals(projetId)) {
            throw new BadRequestException("Ce document n'appartient pas à ce projet");
        }

        return document;
    }

    @Transactional
    public ApiResponse<Void> deleteDocument(String username, Long projetId, Long documentId) {
        User user = getUserByUsername(username);
        ProjetB2B projet = getProjetWithAccessCheck(projetId, user.getId());

        DocumentProjet document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document non trouvé"));

        if (!document.getProjet().getId().equals(projetId)) {
            throw new BadRequestException("Ce document n'appartient pas à ce projet");
        }

        try {
            Path filePath = Paths.get(document.getCheminFichier());
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            log.warn("Impossible de supprimer le fichier physique: {}", document.getCheminFichier());
        }

        projet.removeDocument(document);
        projetRepository.save(projet);

        log.info("Document {} supprimé du projet {}", documentId, projetId);
        return ApiResponse.success("Document supprimé");
    }

    // ============================================
    // STATISTIQUES ET RECHERCHE
    // ============================================

    @Transactional(readOnly = true)
    public Map<String, Object> getStats(String username) {
        User user = getUserByUsername(username);
        List<ProjetB2B> projets = projetRepository.findByUserIdAsCreatorOrParticipant(user.getId());
        projets.forEach(p -> p.getPartenaires().size());

        long totalProjets  = projets.size();
        long projetsActifs = projets.stream()
                .filter(p -> p.getStatut() == ProjetB2B.StatutProjet.ACTIF).count();
        long totalPartenaires = projets.stream()
                .flatMap(p -> p.getPartenaires().stream())
                .map(PartenaireProjet::getId).distinct().count();
        double avgProgress = projets.stream().mapToInt(ProjetB2B::getProgression).average().orElse(0);
        long budgetTotal   = projets.stream().mapToLong(ProjetB2B::getBudget).sum();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalProjets",     totalProjets);
        stats.put("projetsActifs",    projetsActifs);
        stats.put("totalPartenaires", totalPartenaires);
        stats.put("tauxCompletion",   (long) avgProgress);
        stats.put("budgetTotal",      budgetTotal);
        return stats;
    }

    @Transactional(readOnly = true)
    public List<ProjetB2B> searchProjets(String username, String searchTerm) {
        User user = getUserByUsername(username);
        List<ProjetB2B> projets = projetRepository.searchProjets(user.getId(), searchTerm);
        projets.forEach(p -> { p.getPartenaires().size(); p.initTransientFields(); });
        return projets;
    }

    @Transactional(readOnly = true)
    public List<ProjetB2B> filterByStatut(String username, String statutStr) {
        User user = getUserByUsername(username);
        try {
            ProjetB2B.StatutProjet statut = ProjetB2B.StatutProjet.valueOf(statutStr.toUpperCase());
            List<ProjetB2B> projets = projetRepository.findByUserIdAndStatut(user.getId(), statut);
            projets.forEach(p -> { p.getPartenaires().size(); p.initTransientFields(); });
            return projets;
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Statut invalide: " + statutStr);
        }
    }

    // ============================================
    // UTILITAIRES
    // ============================================

    private User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));
    }

    private ProjetB2B getProjetWithAccessCheck(Long projetId, Long userId) {
        ProjetB2B projet = projetRepository.findById(projetId)
                .orElseThrow(() -> new ResourceNotFoundException("Projet non trouvé"));
        if (!projetRepository.hasUserAccess(projetId, userId)) {
            throw new ForbiddenException("Vous n'avez pas accès à ce projet");
        }
        return projet;
    }

    /** Nom affichable selon le type de compte. */
    private String resolveDisplayName(User u) {
        return switch (u.getRole().name()) {
            case "ENTREPRISE" -> {
                try { yield ((com.duniyabacker.front.entity.auth.Entreprise) u).getNomEntreprise(); }
                catch (ClassCastException e) { yield u.getUsername(); }
            }
            case "PARTICULIER" -> {
                try {
                    var p = (com.duniyabacker.front.entity.auth.Particulier) u;
                    yield p.getPrenom() + " " + p.getNom();
                } catch (ClassCastException e) { yield u.getUsername(); }
            }
            case "EMPLOYE" -> {
                try {
                    var e = (Employe) u;
                    yield e.getPrenom() + " " + e.getNom();
                } catch (ClassCastException e2) { yield u.getUsername(); }
            }
            default -> u.getUsername();
        };
    }
}