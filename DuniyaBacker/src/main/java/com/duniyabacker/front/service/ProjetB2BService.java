package com.duniyabacker.front.service;

import com.duniyabacker.front.dto.request.CreateProjetB2BRequest;
import com.duniyabacker.front.dto.response.ApiResponse;
import com.duniyabacker.front.entity.User;
import com.duniyabacker.front.entity.b2b.PartenaireProjet;
import com.duniyabacker.front.entity.b2b.ProjetB2B;
import com.duniyabacker.front.exception.CustomExceptions.*;
import com.duniyabacker.front.repository.ProjetB2BRepository;
import com.duniyabacker.front.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjetB2BService {

    private final ProjetB2BRepository projetRepository;
    private final UserRepository userRepository;

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

    // ── CORRECTION PRINCIPALE : @Transactional(readOnly = true) sur toutes les méthodes de lecture ──

    @Transactional(readOnly = true)
    public List<ProjetB2B> getMesProjets(String username) {
        User user = getUserByUsername(username);
        List<ProjetB2B> projets = projetRepository.findByUserIdAsCreatorOrParticipant(user.getId());
        // Forcer l'initialisation des collections lazy DANS la session Hibernate ouverte
        projets.forEach(p -> {
            p.getPartenaires().size();   // force l'initialisation dans la session Hibernate
            p.initTransientFields();     // peuple createurId / createurUsername
        });
        return projets;
    }

    @Transactional(readOnly = true)
    public ProjetB2B getProjetById(String username, Long projetId) {
        User user = getUserByUsername(username);
        ProjetB2B projet = getProjetWithAccessCheck(projetId, user.getId());
        projet.getPartenaires().size(); // init lazy
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
        projets.forEach(p -> p.getPartenaires().size());
        return projets;
    }

    @Transactional(readOnly = true)
    public List<ProjetB2B> filterByStatut(String username, String statutStr) {
        User user = getUserByUsername(username);
        try {
            ProjetB2B.StatutProjet statut = ProjetB2B.StatutProjet.valueOf(statutStr.toUpperCase());
            List<ProjetB2B> projets = projetRepository.findByUserIdAndStatut(user.getId(), statut);
            projets.forEach(p -> p.getPartenaires().size());
            return projets;
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Statut invalide: " + statutStr);
        }
    }

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
}