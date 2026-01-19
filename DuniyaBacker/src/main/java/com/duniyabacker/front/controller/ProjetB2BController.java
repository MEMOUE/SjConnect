package com.duniyabacker.front.controller;

import com.duniyabacker.front.dto.request.CreateProjetB2BRequest;
import com.duniyabacker.front.dto.response.ApiResponse;
import com.duniyabacker.front.entity.b2b.ProjetB2B;
import com.duniyabacker.front.service.ProjetB2BService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/projets-b2b")
@RequiredArgsConstructor
@Tag(name = "Projets B2B", description = "API pour la gestion des projets de collaboration B2B")
@SecurityRequirement(name = "bearerAuth")
public class ProjetB2BController {

    private final ProjetB2BService projetService;

    @Operation(
            summary = "Créer un projet B2B",
            description = "Créer un nouveau projet de collaboration B2B avec partenaires et participants"
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Projet créé avec succès",
                    content = @Content(schema = @Schema(implementation = ProjetB2B.class))
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "400",
                    description = "Données invalides"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "401",
                    description = "Non authentifié"
            )
    })
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ProjetB2B>> createProjet(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreateProjetB2BRequest request
    ) {
        return ResponseEntity.ok(projetService.createProjet(userDetails.getUsername(), request));
    }

    @Operation(
            summary = "Liste de mes projets",
            description = "Obtenir la liste de tous les projets où je suis créateur ou participant"
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Liste des projets",
                    content = @Content(schema = @Schema(implementation = ProjetB2B.class))
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "401",
                    description = "Non authentifié"
            )
    })
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ProjetB2B>> getMesProjets(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(projetService.getMesProjets(userDetails.getUsername()));
    }

    @Operation(
            summary = "Détails d'un projet",
            description = "Obtenir les informations détaillées d'un projet spécifique"
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Détails du projet",
                    content = @Content(schema = @Schema(implementation = ProjetB2B.class))
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "403",
                    description = "Accès interdit"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "404",
                    description = "Projet non trouvé"
            )
    })
    @GetMapping("/{projetId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ProjetB2B> getProjetById(
            @AuthenticationPrincipal UserDetails userDetails,
            @Parameter(description = "ID du projet") @PathVariable Long projetId
    ) {
        return ResponseEntity.ok(projetService.getProjetById(userDetails.getUsername(), projetId));
    }

    @Operation(
            summary = "Modifier un projet",
            description = "Mettre à jour les informations d'un projet (réservé au créateur)"
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Projet mis à jour avec succès"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "403",
                    description = "Seul le créateur peut modifier le projet"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "404",
                    description = "Projet non trouvé"
            )
    })
    @PutMapping("/{projetId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ProjetB2B>> updateProjet(
            @AuthenticationPrincipal UserDetails userDetails,
            @Parameter(description = "ID du projet") @PathVariable Long projetId,
            @Valid @RequestBody CreateProjetB2BRequest request
    ) {
        return ResponseEntity.ok(projetService.updateProjet(userDetails.getUsername(), projetId, request));
    }

    @Operation(
            summary = "Modifier le statut d'un projet",
            description = "Changer le statut du projet (EN_ATTENTE, ACTIF, EN_PAUSE, TERMINE, ARCHIVE)"
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Statut mis à jour avec succès"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "400",
                    description = "Statut invalide"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "404",
                    description = "Projet non trouvé"
            )
    })
    @PatchMapping("/{projetId}/statut")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ProjetB2B>> updateStatut(
            @AuthenticationPrincipal UserDetails userDetails,
            @Parameter(description = "ID du projet") @PathVariable Long projetId,
            @Parameter(description = "Nouveau statut (EN_ATTENTE, ACTIF, EN_PAUSE, TERMINE, ARCHIVE)")
            @RequestParam String statut
    ) {
        return ResponseEntity.ok(projetService.updateStatut(userDetails.getUsername(), projetId, statut));
    }

    @Operation(
            summary = "Modifier la progression",
            description = "Mettre à jour le pourcentage de progression du projet (0-100)"
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Progression mise à jour avec succès"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "400",
                    description = "Progression invalide (doit être entre 0 et 100)"
            )
    })
    @PatchMapping("/{projetId}/progression")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ProjetB2B>> updateProgression(
            @AuthenticationPrincipal UserDetails userDetails,
            @Parameter(description = "ID du projet") @PathVariable Long projetId,
            @Parameter(description = "Pourcentage de progression (0-100)") @RequestParam Integer progression
    ) {
        return ResponseEntity.ok(projetService.updateProgression(userDetails.getUsername(), projetId, progression));
    }

    @Operation(
            summary = "Ajouter un participant",
            description = "Ajouter un utilisateur comme participant au projet (réservé au créateur)"
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Participant ajouté avec succès"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "403",
                    description = "Seul le créateur peut ajouter des participants"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "404",
                    description = "Participant ou projet non trouvé"
            )
    })
    @PostMapping("/{projetId}/participants/{participantId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ProjetB2B>> addParticipant(
            @AuthenticationPrincipal UserDetails userDetails,
            @Parameter(description = "ID du projet") @PathVariable Long projetId,
            @Parameter(description = "ID de l'utilisateur à ajouter") @PathVariable Long participantId
    ) {
        return ResponseEntity.ok(projetService.addParticipant(userDetails.getUsername(), projetId, participantId));
    }

    @Operation(
            summary = "Retirer un participant",
            description = "Retirer un participant du projet (réservé au créateur)"
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Participant retiré avec succès"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "400",
                    description = "Le créateur ne peut pas être retiré"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "403",
                    description = "Seul le créateur peut retirer des participants"
            )
    })
    @DeleteMapping("/{projetId}/participants/{participantId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ProjetB2B>> removeParticipant(
            @AuthenticationPrincipal UserDetails userDetails,
            @Parameter(description = "ID du projet") @PathVariable Long projetId,
            @Parameter(description = "ID du participant à retirer") @PathVariable Long participantId
    ) {
        return ResponseEntity.ok(projetService.removeParticipant(userDetails.getUsername(), projetId, participantId));
    }

    @Operation(
            summary = "Supprimer un projet",
            description = "Supprimer définitivement un projet (réservé au créateur)"
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Projet supprimé avec succès"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "403",
                    description = "Seul le créateur peut supprimer le projet"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "404",
                    description = "Projet non trouvé"
            )
    })
    @DeleteMapping("/{projetId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> deleteProjet(
            @AuthenticationPrincipal UserDetails userDetails,
            @Parameter(description = "ID du projet") @PathVariable Long projetId
    ) {
        return ResponseEntity.ok(projetService.deleteProjet(userDetails.getUsername(), projetId));
    }

    @Operation(
            summary = "Statistiques des projets",
            description = "Obtenir des statistiques sur l'ensemble de mes projets"
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Statistiques récupérées avec succès"
            )
    })
    @GetMapping("/stats")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> getStats(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(projetService.getStats(userDetails.getUsername()));
    }

    @Operation(
            summary = "Rechercher des projets",
            description = "Rechercher des projets par nom ou description"
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Résultats de la recherche"
            )
    })
    @GetMapping("/search")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ProjetB2B>> searchProjets(
            @AuthenticationPrincipal UserDetails userDetails,
            @Parameter(description = "Terme de recherche") @RequestParam String q
    ) {
        return ResponseEntity.ok(projetService.searchProjets(userDetails.getUsername(), q));
    }

    @Operation(
            summary = "Filtrer par statut",
            description = "Obtenir les projets filtrés par statut"
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Projets filtrés"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "400",
                    description = "Statut invalide"
            )
    })
    @GetMapping("/filter")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ProjetB2B>> filterByStatut(
            @AuthenticationPrincipal UserDetails userDetails,
            @Parameter(description = "Statut (EN_ATTENTE, ACTIF, EN_PAUSE, TERMINE, ARCHIVE)")
            @RequestParam String statut
    ) {
        return ResponseEntity.ok(projetService.filterByStatut(userDetails.getUsername(), statut));
    }
}