package com.duniyabacker.front.controller;

import com.duniyabacker.front.dto.request.AddPartenaireRequest;
import com.duniyabacker.front.dto.request.CreateProjetB2BRequest;
import com.duniyabacker.front.dto.request.CreateTacheProjetRequest;
import com.duniyabacker.front.dto.request.SendMessageProjetRequest;
import com.duniyabacker.front.dto.response.ApiResponse;
import com.duniyabacker.front.entity.b2b.DocumentProjet;
import com.duniyabacker.front.entity.b2b.MessageProjet;
import com.duniyabacker.front.entity.b2b.ProjetB2B;
import com.duniyabacker.front.entity.b2b.TacheProjet;
import com.duniyabacker.front.service.ProjetB2BService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/projets-b2b")
@RequiredArgsConstructor
@Tag(name = "Projets B2B", description = "API pour la gestion des projets de collaboration B2B")
@SecurityRequirement(name = "bearerAuth")
public class ProjetB2BController {

    private final ProjetB2BService projetService;

    // ============================================
    // GESTION DES PROJETS
    // ============================================

    @Operation(summary = "Créer un projet B2B")
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ProjetB2B>> createProjet(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreateProjetB2BRequest request
    ) {
        return ResponseEntity.ok(projetService.createProjet(userDetails.getUsername(), request));
    }

    @Operation(summary = "Liste de mes projets")
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ProjetB2B>> getMesProjets(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(projetService.getMesProjets(userDetails.getUsername()));
    }

    @Operation(summary = "Détails d'un projet")
    @GetMapping("/{projetId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ProjetB2B> getProjetById(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projetId
    ) {
        return ResponseEntity.ok(projetService.getProjetById(userDetails.getUsername(), projetId));
    }

    @Operation(summary = "Modifier un projet")
    @PutMapping("/{projetId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ProjetB2B>> updateProjet(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projetId,
            @Valid @RequestBody CreateProjetB2BRequest request
    ) {
        return ResponseEntity.ok(projetService.updateProjet(userDetails.getUsername(), projetId, request));
    }

    @Operation(summary = "Modifier le statut d'un projet")
    @PatchMapping("/{projetId}/statut")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ProjetB2B>> updateStatut(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projetId,
            @RequestParam String statut
    ) {
        return ResponseEntity.ok(projetService.updateStatut(userDetails.getUsername(), projetId, statut));
    }

    @Operation(summary = "Modifier la progression")
    @PatchMapping("/{projetId}/progression")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ProjetB2B>> updateProgression(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projetId,
            @RequestParam Integer progression
    ) {
        return ResponseEntity.ok(projetService.updateProgression(userDetails.getUsername(), projetId, progression));
    }

    @Operation(summary = "Supprimer un projet")
    @DeleteMapping("/{projetId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> deleteProjet(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projetId
    ) {
        return ResponseEntity.ok(projetService.deleteProjet(userDetails.getUsername(), projetId));
    }

    // ============================================
    // GESTION DES PARTICIPANTS
    // ============================================

    @Operation(summary = "Ajouter un participant")
    @PostMapping("/{projetId}/participants/{participantId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ProjetB2B>> addParticipant(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projetId,
            @PathVariable Long participantId
    ) {
        return ResponseEntity.ok(projetService.addParticipant(userDetails.getUsername(), projetId, participantId));
    }

    @Operation(summary = "Retirer un participant")
    @DeleteMapping("/{projetId}/participants/{participantId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ProjetB2B>> removeParticipant(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projetId,
            @PathVariable Long participantId
    ) {
        return ResponseEntity.ok(projetService.removeParticipant(userDetails.getUsername(), projetId, participantId));
    }

    // ============================================
    // GESTION DES PARTENAIRES
    // ============================================

    @Operation(summary = "Ajouter un partenaire au projet",
            description = "3 modes : userId (employé interne), email (utilisateur externe avec compte), ou nom (manuel)")
    @PostMapping("/{projetId}/partenaires")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ProjetB2B>> addPartenaire(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projetId,
            @Valid @RequestBody AddPartenaireRequest request
    ) {
        return ResponseEntity.ok(projetService.addPartenaire(userDetails.getUsername(), projetId, request));
    }

    @Operation(summary = "Retirer un partenaire du projet")
    @DeleteMapping("/{projetId}/partenaires/{partenaireId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ProjetB2B>> removePartenaire(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projetId,
            @PathVariable Long partenaireId
    ) {
        return ResponseEntity.ok(projetService.removePartenaire(userDetails.getUsername(), projetId, partenaireId));
    }

    @Operation(summary = "Liste du personnel de la structure",
            description = "Employés de l'entreprise de l'utilisateur courant (pour les ajouter comme partenaires/participants)")
    @GetMapping("/personnel")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Map<String, Object>>> getPersonnel(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(projetService.getPersonnel(userDetails.getUsername()));
    }

    @Operation(summary = "Rechercher un utilisateur par email")
    @GetMapping("/users/search-by-email")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> searchUserByEmail(@RequestParam String email) {
        Map<String, Object> user = projetService.searchUserByEmail(email);
        if (user == null) {
            return ResponseEntity.ok(Map.of("found", false, "message", "Aucun utilisateur trouvé avec cet email"));
        }
        user.put("found", true);
        return ResponseEntity.ok(user);
    }

    // ============================================
    // GESTION DES MESSAGES (NOUVEAU)
    // ============================================

    @Operation(summary = "Liste des messages d'un projet")
    @GetMapping("/{projetId}/messages")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<MessageProjet>> getMessages(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projetId
    ) {
        return ResponseEntity.ok(projetService.getMessages(userDetails.getUsername(), projetId));
    }

    @Operation(summary = "Envoyer un message dans un projet")
    @PostMapping("/{projetId}/messages")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<MessageProjet>> sendMessage(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projetId,
            @Valid @RequestBody SendMessageProjetRequest request
    ) {
        return ResponseEntity.ok(
                projetService.sendMessage(userDetails.getUsername(), projetId, request.getContenu()));
    }

    // ============================================
    // GESTION DES TÂCHES
    // ============================================

    @Operation(summary = "Créer une tâche dans un projet")
    @PostMapping("/{projetId}/taches")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<TacheProjet>> createTache(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projetId,
            @Valid @RequestBody CreateTacheProjetRequest request
    ) {
        return ResponseEntity.ok(projetService.createTache(userDetails.getUsername(), projetId, request));
    }

    @Operation(summary = "Liste des tâches d'un projet")
    @GetMapping("/{projetId}/taches")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<TacheProjet>> getTaches(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projetId
    ) {
        return ResponseEntity.ok(projetService.getTaches(userDetails.getUsername(), projetId));
    }

    @Operation(summary = "Modifier le statut d'une tâche",
            description = "Changer le statut (EN_ATTENTE, EN_COURS, TERMINEE)")
    @PatchMapping("/{projetId}/taches/{tacheId}/statut")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<TacheProjet>> updateStatutTache(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projetId,
            @PathVariable Long tacheId,
            @RequestParam String statut
    ) {
        return ResponseEntity.ok(projetService.updateStatutTache(userDetails.getUsername(), projetId, tacheId, statut));
    }

    @Operation(summary = "Supprimer une tâche")
    @DeleteMapping("/{projetId}/taches/{tacheId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> deleteTache(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projetId,
            @PathVariable Long tacheId
    ) {
        return ResponseEntity.ok(projetService.deleteTache(userDetails.getUsername(), projetId, tacheId));
    }

    // ============================================
    // GESTION DES DOCUMENTS
    // ============================================

    @Operation(summary = "Uploader un document dans un projet")
    @PostMapping(value = "/{projetId}/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<DocumentProjet>> uploadDocument(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projetId,
            @RequestParam("file") MultipartFile file
    ) {
        return ResponseEntity.ok(projetService.uploadDocument(userDetails.getUsername(), projetId, file));
    }

    @Operation(summary = "Liste des documents d'un projet")
    @GetMapping("/{projetId}/documents")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<DocumentProjet>> getDocuments(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projetId
    ) {
        return ResponseEntity.ok(projetService.getDocuments(userDetails.getUsername(), projetId));
    }

    @Operation(summary = "Télécharger un document")
    @GetMapping("/{projetId}/documents/{documentId}/download")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Resource> downloadDocument(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projetId,
            @PathVariable Long documentId
    ) {
        DocumentProjet document = projetService.getDocument(userDetails.getUsername(), projetId, documentId);

        try {
            Path filePath = Paths.get(document.getCheminFichier());
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists()) {
                throw new RuntimeException("Fichier introuvable sur le serveur");
            }

            String contentType = document.getTypeMime() != null ? document.getTypeMime() : "application/octet-stream";

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + document.getNomFichier() + "\"")
                    .body(resource);

        } catch (Exception e) {
            throw new RuntimeException("Erreur lors du téléchargement", e);
        }
    }

    @Operation(summary = "Supprimer un document")
    @DeleteMapping("/{projetId}/documents/{documentId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> deleteDocument(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projetId,
            @PathVariable Long documentId
    ) {
        return ResponseEntity.ok(projetService.deleteDocument(userDetails.getUsername(), projetId, documentId));
    }

    // ============================================
    // STATISTIQUES ET RECHERCHE
    // ============================================

    @Operation(summary = "Statistiques des projets")
    @GetMapping("/stats")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> getStats(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(projetService.getStats(userDetails.getUsername()));
    }

    @Operation(summary = "Rechercher des projets")
    @GetMapping("/search")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ProjetB2B>> searchProjets(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam String q
    ) {
        return ResponseEntity.ok(projetService.searchProjets(userDetails.getUsername(), q));
    }

    @Operation(summary = "Filtrer par statut")
    @GetMapping("/filter")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ProjetB2B>> filterByStatut(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam String statut
    ) {
        return ResponseEntity.ok(projetService.filterByStatut(userDetails.getUsername(), statut));
    }
}