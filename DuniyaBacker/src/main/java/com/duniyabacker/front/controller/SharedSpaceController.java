package com.duniyabacker.front.controller;

import com.duniyabacker.front.dto.response.SharedResourceResponse;
import com.duniyabacker.front.service.SharedSpaceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@RestController
@RequestMapping("/api/shared")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Tag(name = "Espace Partagé", description = "Gestion des fichiers et dossiers partagés")
public class SharedSpaceController {

    private final SharedSpaceService service;

    /**
     * Créer un nouveau dossier
     */
    @Operation(
            summary = "Créer un dossier",
            description = "Créer un nouveau dossier dans l'espace partagé"
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Dossier créé avec succès",
                    content = @Content(schema = @Schema(implementation = SharedResourceResponse.class))
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
    @PostMapping("/folder")
    public ResponseEntity<SharedResourceResponse> createFolder(
            @AuthenticationPrincipal UserDetails user,
            @Parameter(description = "Nom du dossier", required = true)
            @RequestParam String name,
            @Parameter(description = "Description du dossier")
            @RequestParam(required = false) String description,
            @Parameter(description = "ID du dossier parent (optionnel)")
            @RequestParam(required = false) Long parentId) {
        return ResponseEntity.ok(service.createFolder(user.getUsername(), name, description, parentId));
    }

    /**
     * Upload un fichier
     */
    @Operation(
            summary = "Upload un fichier",
            description = "Uploader un fichier dans l'espace partagé"
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Fichier uploadé avec succès",
                    content = @Content(schema = @Schema(implementation = SharedResourceResponse.class))
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "400",
                    description = "Fichier invalide"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "401",
                    description = "Non authentifié"
            )
    })
    @PostMapping(value = "/file", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<SharedResourceResponse> uploadFile(
            @AuthenticationPrincipal UserDetails user,
            @Parameter(description = "Fichier à uploader", required = true)
            @RequestParam("file") MultipartFile file,
            @Parameter(description = "Description du fichier")
            @RequestParam(required = false) String description,
            @Parameter(description = "ID du dossier parent (optionnel)")
            @RequestParam(required = false) Long parentId) throws IOException {
        return ResponseEntity.ok(service.uploadFile(user.getUsername(), file, description, parentId));
    }

    /**
     * Télécharger un fichier
     */
    @Operation(
            summary = "Télécharger un fichier",
            description = "Télécharger un fichier depuis l'espace partagé"
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Fichier téléchargé avec succès"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "404",
                    description = "Fichier non trouvé"
            )
    })
    @GetMapping("/download/{id}")
    public ResponseEntity<Resource> downloadFile(
            @Parameter(description = "ID de la ressource", required = true)
            @PathVariable Long id) throws MalformedURLException {

        SharedResourceResponse resource = service.getResourceById(id);

        if (resource.getFilePath() == null) {
            return ResponseEntity.notFound().build();
        }

        Path filePath = Paths.get("uploads/shared").resolve(resource.getFilePath()).normalize();
        Resource fileResource = new UrlResource(filePath.toUri());

        if (!fileResource.exists()) {
            return ResponseEntity.notFound().build();
        }

        String contentType = resource.getFileType();
        if (contentType == null) {
            contentType = "application/octet-stream";
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + resource.getName() + "\"")
                .body(fileResource);
    }

    /**
     * Visualiser un fichier (inline)
     */
    @Operation(
            summary = "Visualiser un fichier",
            description = "Afficher un fichier dans le navigateur"
    )
    @GetMapping("/view/{id}")
    public ResponseEntity<Resource> viewFile(
            @Parameter(description = "ID de la ressource", required = true)
            @PathVariable Long id) throws MalformedURLException {

        SharedResourceResponse resource = service.getResourceById(id);

        if (resource.getFilePath() == null) {
            return ResponseEntity.notFound().build();
        }

        Path filePath = Paths.get("uploads/shared").resolve(resource.getFilePath()).normalize();
        Resource fileResource = new UrlResource(filePath.toUri());

        if (!fileResource.exists()) {
            return ResponseEntity.notFound().build();
        }

        String contentType = resource.getFileType();
        if (contentType == null) {
            contentType = "application/octet-stream";
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"" + resource.getName() + "\"")
                .body(fileResource);
    }

    /**
     * Récupérer les ressources racines
     */
    @Operation(
            summary = "Ressources racines",
            description = "Obtenir toutes les ressources à la racine de l'espace partagé"
    )
    @GetMapping("/root")
    public ResponseEntity<List<SharedResourceResponse>> getRootResources(
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(service.getRootResources(user.getUsername()));
    }

    /**
     * Récupérer les enfants d'un dossier
     */
    @GetMapping("/{id}/children")
    public ResponseEntity<List<SharedResourceResponse>> getChildren(
            @Parameter(description = "ID du dossier parent", required = true)
            @PathVariable Long id) {
        return ResponseEntity.ok(service.getChildren(id));
    }

    /**
     * Rechercher des ressources
     */
    @GetMapping("/search")
    public ResponseEntity<List<SharedResourceResponse>> search(
            @AuthenticationPrincipal UserDetails user,
            @Parameter(description = "Terme de recherche", required = true)
            @RequestParam String q) {
        return ResponseEntity.ok(service.search(user.getUsername(), q));
    }

    /**
     * Récupérer mes ressources
     */
    @GetMapping("/my")
    public ResponseEntity<List<SharedResourceResponse>> getMyResources(
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(service.getMyResources(user.getUsername()));
    }

    /**
     * Partager une ressource
     */
    @PostMapping("/{id}/share")
    public ResponseEntity<Void> share(
            @Parameter(description = "ID de la ressource", required = true)
            @PathVariable Long id,
            @Parameter(description = "Liste des IDs des utilisateurs", required = true)
            @RequestBody List<Long> userIds) {
        service.shareWith(id, userIds);
        return ResponseEntity.ok().build();
    }

    /**
     * Supprimer une ressource
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @Parameter(description = "ID de la ressource", required = true)
            @PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok().build();
    }

    /**
     * Obtenir les statistiques
     */
    @GetMapping("/stats")
    public ResponseEntity<SharedSpaceService.Stats> getStats(
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(service.getStats(user.getUsername()));
    }
}