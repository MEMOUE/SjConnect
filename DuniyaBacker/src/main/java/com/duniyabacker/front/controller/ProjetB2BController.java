package com.duniyabacker.front.controller;

import com.duniyabacker.front.dto.request.CreateProjetB2BRequest;
import com.duniyabacker.front.dto.response.ApiResponse;
import com.duniyabacker.front.entity.b2b.ProjetB2B;
import com.duniyabacker.front.service.ProjetB2BService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/projets-b2b")
@RequiredArgsConstructor
@Tag(name = "Projets B2B", description = "API pour la gestion des projets de collaboration B2B")
public class ProjetB2BController {

    private final ProjetB2BService projetService;

    @Operation(summary = "Créer un projet B2B")
    @PostMapping
    public ResponseEntity<ApiResponse<ProjetB2B>> createProjet(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreateProjetB2BRequest request
    ) {
        return ResponseEntity.ok(projetService.createProjet(userDetails.getUsername(), request));
    }

    @Operation(summary = "Liste de mes projets")
    @GetMapping
    public ResponseEntity<List<ProjetB2B>> getMesProjets(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(projetService.getMesProjets(userDetails.getUsername()));
    }

    @Operation(summary = "Détails d'un projet")
    @GetMapping("/{projetId}")
    public ResponseEntity<ProjetB2B> getProjetById(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projetId
    ) {
        return ResponseEntity.ok(projetService.getProjetById(userDetails.getUsername(), projetId));
    }

    @Operation(summary = "Modifier un projet")
    @PutMapping("/{projetId}")
    public ResponseEntity<ApiResponse<ProjetB2B>> updateProjet(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projetId,
            @Valid @RequestBody CreateProjetB2BRequest request
    ) {
        return ResponseEntity.ok(projetService.updateProjet(userDetails.getUsername(), projetId, request));
    }

    @Operation(summary = "Modifier le statut")
    @PatchMapping("/{projetId}/statut")
    public ResponseEntity<ApiResponse<ProjetB2B>> updateStatut(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projetId,
            @RequestParam String statut
    ) {
        return ResponseEntity.ok(projetService.updateStatut(userDetails.getUsername(), projetId, statut));
    }

    @Operation(summary = "Modifier la progression")
    @PatchMapping("/{projetId}/progression")
    public ResponseEntity<ApiResponse<ProjetB2B>> updateProgression(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projetId,
            @RequestParam Integer progression
    ) {
        return ResponseEntity.ok(projetService.updateProgression(userDetails.getUsername(), projetId, progression));
    }

    @Operation(summary = "Ajouter un participant")
    @PostMapping("/{projetId}/participants/{participantId}")
    public ResponseEntity<ApiResponse<ProjetB2B>> addParticipant(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projetId,
            @PathVariable Long participantId
    ) {
        return ResponseEntity.ok(projetService.addParticipant(userDetails.getUsername(), projetId, participantId));
    }

    @Operation(summary = "Retirer un participant")
    @DeleteMapping("/{projetId}/participants/{participantId}")
    public ResponseEntity<ApiResponse<ProjetB2B>> removeParticipant(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projetId,
            @PathVariable Long participantId
    ) {
        return ResponseEntity.ok(projetService.removeParticipant(userDetails.getUsername(), projetId, participantId));
    }

    @Operation(summary = "Supprimer un projet")
    @DeleteMapping("/{projetId}")
    public ResponseEntity<ApiResponse<Void>> deleteProjet(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projetId
    ) {
        return ResponseEntity.ok(projetService.deleteProjet(userDetails.getUsername(), projetId));
    }

    @Operation(summary = "Statistiques")
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(projetService.getStats(userDetails.getUsername()));
    }

    @Operation(summary = "Rechercher")
    @GetMapping("/search")
    public ResponseEntity<List<ProjetB2B>> searchProjets(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam String q
    ) {
        return ResponseEntity.ok(projetService.searchProjets(userDetails.getUsername(), q));
    }

    @Operation(summary = "Filtrer par statut")
    @GetMapping("/filter")
    public ResponseEntity<List<ProjetB2B>> filterByStatut(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam String statut
    ) {
        return ResponseEntity.ok(projetService.filterByStatut(userDetails.getUsername(), statut));
    }
}