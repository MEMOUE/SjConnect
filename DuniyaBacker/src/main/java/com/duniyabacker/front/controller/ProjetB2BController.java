//package com.duniyabacker.front.controller;
//
//import com.duniyabacker.front.dto.request.CreateProjetB2BRequest;
//import com.duniyabacker.front.dto.response.ApiResponse;
//import com.duniyabacker.front.dto.response.ProjetB2BResponse;
//import com.duniyabacker.front.dto.response.*;
//import com.duniyabacker.front.service.ProjetB2BService;
//import io.swagger.v3.oas.annotations.Operation;
//import io.swagger.v3.oas.annotations.Parameter;
//import io.swagger.v3.oas.annotations.tags.Tag;
//import jakarta.validation.Valid;
//import lombok.RequiredArgsConstructor;
//import org.springframework.http.ResponseEntity;
//import org.springframework.security.core.annotation.AuthenticationPrincipal;
//import org.springframework.security.core.userdetails.UserDetails;
//import org.springframework.web.bind.annotation.*;
//
//import java.util.List;
//
//@RestController
//@RequestMapping("/api/projets-b2b")
//@RequiredArgsConstructor
//@Tag(name = "Projets B2B", description = "API pour la gestion des projets de collaboration B2B")
//public class ProjetB2BController {
//
//    private final ProjetB2BService projetService;
//
//    /**
//     * Créer un nouveau projet B2B
//     */
//    @Operation(summary = "Créer un projet B2B", description = "Créer un nouveau projet de collaboration inter-entreprises")
//    @PostMapping
//    public ResponseEntity<ApiResponse<ProjetB2BResponse>> createProjet(
//            @AuthenticationPrincipal UserDetails userDetails,
//            @Valid @RequestBody CreateProjetB2BRequest request
//    ) {
//        return ResponseEntity.ok(projetService.createProjet(userDetails.getUsername(), request));
//    }
//
//    /**
//     * Obtenir tous mes projets
//     */
//    @Operation(summary = "Liste de mes projets", description = "Obtenir tous les projets où je suis créateur ou participant")
//    @GetMapping
//    public ResponseEntity<List<ProjetB2BResponse>> getMesProjets(
//            @AuthenticationPrincipal UserDetails userDetails
//    ) {
//        return ResponseEntity.ok(projetService.getMesProjets(userDetails.getUsername()));
//    }
//
//    /**
//     * Obtenir un projet par ID
//     */
//    @Operation(summary = "Détails d'un projet", description = "Obtenir les détails complets d'un projet")
//    @GetMapping("/{projetId}")
//    public ResponseEntity<ProjetB2BResponse> getProjetById(
//            @AuthenticationPrincipal UserDetails userDetails,
//            @Parameter(description = "ID du projet") @PathVariable Long projetId
//    ) {
//        return ResponseEntity.ok(projetService.getProjetById(userDetails.getUsername(), projetId));
//    }
//
//    /**
//     * Mettre à jour un projet
//     */
//    @Operation(summary = "Modifier un projet", description = "Mettre à jour les informations d'un projet")
//    @PutMapping("/{projetId}")
//    public ResponseEntity<ApiResponse<ProjetB2BResponse>> updateProjet(
//            @AuthenticationPrincipal UserDetails userDetails,
//            @Parameter(description = "ID du projet") @PathVariable Long projetId,
//            @Valid @RequestBody CreateProjetB2BRequest request
//    ) {
//        return ResponseEntity.ok(projetService.updateProjet(userDetails.getUsername(), projetId, request));
//    }
//
//    /**
//     * Mettre à jour le statut
//     */
//    @Operation(summary = "Modifier le statut", description = "Changer le statut d'un projet")
//    @PatchMapping("/{projetId}/statut")
//    public ResponseEntity<ApiResponse<ProjetB2BResponse>> updateStatut(
//            @AuthenticationPrincipal UserDetails userDetails,
//            @Parameter(description = "ID du projet") @PathVariable Long projetId,
//            @Parameter(description = "Nouveau statut") @RequestParam String statut
//    ) {
//        return ResponseEntity.ok(projetService.updateStatut(userDetails.getUsername(), projetId, statut));
//    }
//
//    /**
//     * Mettre à jour la progression
//     */
//    @Operation(summary = "Modifier la progression", description = "Mettre à jour le pourcentage de progression")
//    @PatchMapping("/{projetId}/progression")
//    public ResponseEntity<ApiResponse<ProjetB2BResponse>> updateProgression(
//            @AuthenticationPrincipal UserDetails userDetails,
//            @Parameter(description = "ID du projet") @PathVariable Long projetId,
//            @Parameter(description = "Progression (0-100)") @RequestParam Integer progression
//    ) {
//        return ResponseEntity.ok(projetService.updateProgression(userDetails.getUsername(), projetId, progression));
//    }
//
//    /**
//     * Ajouter un participant
//     */
//    @Operation(summary = "Ajouter un participant", description = "Ajouter un utilisateur au projet")
//    @PostMapping("/{projetId}/participants/{participantId}")
//    public ResponseEntity<ApiResponse<ProjetB2BResponse>> addParticipant(
//            @AuthenticationPrincipal UserDetails userDetails,
//            @Parameter(description = "ID du projet") @PathVariable Long projetId,
//            @Parameter(description = "ID du participant") @PathVariable Long participantId
//    ) {
//        return ResponseEntity.ok(projetService.addParticipant(userDetails.getUsername(), projetId, participantId));
//    }
//
//    /**
//     * Retirer un participant
//     */
//    @Operation(summary = "Retirer un participant", description = "Retirer un utilisateur du projet")
//    @DeleteMapping("/{projetId}/participants/{participantId}")
//    public ResponseEntity<ApiResponse<ProjetB2BResponse>> removeParticipant(
//            @AuthenticationPrincipal UserDetails userDetails,
//            @Parameter(description = "ID du projet") @PathVariable Long projetId,
//            @Parameter(description = "ID du participant") @PathVariable Long participantId
//    ) {
//        return ResponseEntity.ok(projetService.removeParticipant(userDetails.getUsername(), projetId, participantId));
//    }
//
//    /**
//     * Supprimer un projet
//     */
//    @Operation(summary = "Supprimer un projet", description = "Supprimer définitivement un projet")
//    @DeleteMapping("/{projetId}")
//    public ResponseEntity<ApiResponse<Void>> deleteProjet(
//            @AuthenticationPrincipal UserDetails userDetails,
//            @Parameter(description = "ID du projet") @PathVariable Long projetId
//    ) {
//        return ResponseEntity.ok(projetService.deleteProjet(userDetails.getUsername(), projetId));
//    }
//
//    /**
//     * Obtenir les statistiques
//     */
//    @Operation(summary = "Statistiques", description = "Obtenir les statistiques globales des projets")
//    @GetMapping("/stats")
//    public ResponseEntity<ProjetStatsResponse> getStats(
//            @AuthenticationPrincipal UserDetails userDetails
//    ) {
//        return ResponseEntity.ok(projetService.getStats(userDetails.getUsername()));
//    }
//
//    /**
//     * Rechercher des projets
//     */
//    @Operation(summary = "Rechercher", description = "Rechercher des projets par nom ou description")
//    @GetMapping("/search")
//    public ResponseEntity<List<ProjetB2BResponse>> searchProjets(
//            @AuthenticationPrincipal UserDetails userDetails,
//            @Parameter(description = "Terme de recherche") @RequestParam String q
//    ) {
//        return ResponseEntity.ok(projetService.searchProjets(userDetails.getUsername(), q));
//    }
//
//    /**
//     * Filtrer par statut
//     */
//    @Operation(summary = "Filtrer par statut", description = "Obtenir les projets d'un statut spécifique")
//    @GetMapping("/filter")
//    public ResponseEntity<List<ProjetB2BResponse>> filterByStatut(
//            @AuthenticationPrincipal UserDetails userDetails,
//            @Parameter(description = "Statut") @RequestParam String statut
//    ) {
//        return ResponseEntity.ok(projetService.filterByStatut(userDetails.getUsername(), statut));
//    }
//}