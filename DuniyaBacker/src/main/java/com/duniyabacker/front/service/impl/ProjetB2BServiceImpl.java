//package com.duniyabacker.front.service.impl;
//
//import com.duniyabacker.front.dto.request.CreateProjetB2BRequest;
//import com.duniyabacker.front.dto.response.*;
//import com.duniyabacker.front.entity.b2b.ProjetB2B;
//import com.duniyabacker.front.entity.User;
//import com.duniyabacker.front.repository.ProjetB2BRepository;
//import com.duniyabacker.front.repository.UserRepository;
//import com.duniyabacker.front.service.ProjetB2BService;
//import lombok.RequiredArgsConstructor;
//import org.springframework.stereotype.Service;
//import org.springframework.transaction.annotation.Transactional;
//
//import java.util.List;
//
//@Service
//@RequiredArgsConstructor
//@Transactional
//public class ProjetB2BServiceImpl implements ProjetB2BService {
//
//    private final ProjetB2BRepository projetRepository;
//    private final UserRepository userRepository;
//    private final ProjetB2BMapper mapper; // MapStruct ou mapper manuel
//
//    @Override
//    public ApiResponse<ProjetB2BResponse> createProjet(String username, CreateProjetB2BRequest request) {
//        User creator = getUser(username);
//
//        ProjetB2B projet = new ProjetB2B();
//        projet.setNom(request.getNom());
//        projet.setDescription(request.getDescription());
//        projet.setStatut("EN_COURS");
//        projet.setProgression(0);
//        projet.setCreateur(creator);
//
//        projetRepository.save(projet);
//
//        return ApiResponse.success("Projet créé avec succès", mapper.toResponse(projet));
//    }
//
//    @Override
//    public List<ProjetB2BResponse> getMesProjets(String username) {
//        User user = getUser(username);
//        return projetRepository
//                .findByCreateurOrParticipantsContains(user, user)
//                .stream()
//                .map(mapper::toResponse)
//                .toList();
//    }
//
//    @Override
//    public ProjetB2BResponse getProjetById(String username, Long projetId) {
//        ProjetB2B projet = getProjetAutorise(username, projetId);
//        return mapper.toResponse(projet);
//    }
//
//    @Override
//    public ApiResponse<ProjetB2BResponse> updateProjet(String username, Long projetId, CreateProjetB2BRequest request) {
//        ProjetB2B projet = getProjetAutorise(username, projetId);
//
//        projet.setNom(request.getNom());
//        projet.setDescription(request.getDescription());
//
//        return ApiResponse.success("Projet mis à jour", mapper.toResponse(projet));
//    }
//
//    @Override
//    public ApiResponse<ProjetB2BResponse> updateStatut(String username, Long projetId, String statut) {
//        ProjetB2B projet = getProjetAutorise(username, projetId);
//        projet.setStatut(statut);
//
//        return ApiResponse.success("Statut mis à jour", mapper.toResponse(projet));
//    }
//
//    @Override
//    public ApiResponse<ProjetB2BResponse> updateProgression(String username, Long projetId, Integer progression) {
//        if (progression < 0 || progression > 100) {
//            throw new IllegalArgumentException("La progression doit être entre 0 et 100");
//        }
//
//        ProjetB2B projet = getProjetAutorise(username, projetId);
//        projet.setProgression(progression);
//
//        return ApiResponse.success("Progression mise à jour", mapper.toResponse(projet));
//    }
//
//    @Override
//    public ApiResponse<ProjetB2BResponse> addParticipant(String username, Long projetId, Long participantId) {
//        ProjetB2B projet = getProjetAutorise(username, projetId);
//        User participant = getUser(participantId);
//
//        projet.getParticipants().add(participant);
//
//        return ApiResponse.success("Participant ajouté", mapper.toResponse(projet));
//    }
//
//    @Override
//    public ApiResponse<ProjetB2BResponse> removeParticipant(String username, Long projetId, Long participantId) {
//        ProjetB2B projet = getProjetAutorise(username, projetId);
//        projet.getParticipants().removeIf(u -> u.getId().equals(participantId));
//
//        return ApiResponse.success("Participant retiré", mapper.toResponse(projet));
//    }
//
//    @Override
//    public ApiResponse<Void> deleteProjet(String username, Long projetId) {
//        ProjetB2B projet = getProjetAutorise(username, projetId);
//        projetRepository.delete(projet);
//
//        return ApiResponse.success("Projet supprimé", null);
//    }
//
//    @Override
//    public ProjetStatsResponse getStats(String username) {
//        User user = getUser(username);
//
//        long total = projetRepository.countByUser(user);
//        long enCours = projetRepository.countByUserAndStatut(user, "EN_COURS");
//        long termine = projetRepository.countByUserAndStatut(user, "TERMINE");
//
//        return new ProjetStatsResponse(total, enCours, termine);
//    }
//
//    @Override
//    public List<ProjetB2BResponse> searchProjets(String username, String q) {
//        User user = getUser(username);
//        return projetRepository.search(user, q)
//                .stream()
//                .map(mapper::toResponse)
//                .toList();
//    }
//
//    @Override
//    public List<ProjetB2BResponse> filterByStatut(String username, String statut) {
//        User user = getUser(username);
//        return projetRepository.findByUserAndStatut(user, statut)
//                .stream()
//                .map(mapper::toResponse)
//                .toList();
//    }
//
//    /* ===================== MÉTHODES PRIVÉES ===================== */
//
//    private User getUser(String username) {
//        return userRepository.findByUsername(username)
//                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
//    }
//
//    private User getUser(Long id) {
//        return userRepository.findById(id)
//                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
//    }
//
//    private ProjetB2B getProjetAutorise(String username, Long projetId) {
//        User user = getUser(username);
//        ProjetB2B projet = projetRepository.findById(projetId)
//                .orElseThrow(() -> new RuntimeException("Projet introuvable"));
//
//        if (!projet.isParticipant(user)) {
//            throw new RuntimeException("Accès refusé au projet");
//        }
//        return projet;
//    }
//}
