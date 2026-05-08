package com.duniyabacker.front.controller;

import com.duniyabacker.front.dto.response.ApiResponse;
import com.duniyabacker.front.dto.response.SharedResourceResponse;
import com.duniyabacker.front.service.SharedSpaceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
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
import java.util.Map;

@RestController
@RequestMapping("/api/shared")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Espace Partagé", description = "Gestion des fichiers et dossiers partagés")
public class SharedSpaceController {

    private final SharedSpaceService service;

    @Value("${app.upload.dir:uploads/shared}")
    private String uploadDir;

    // =========================================================================
    // DOSSIERS & FICHIERS — CRUD
    // =========================================================================

    @Operation(summary = "Créer un dossier")
    @PostMapping("/folder")
    public ResponseEntity<SharedResourceResponse> createFolder(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam String name,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) Long parentId
    ) {
        return ResponseEntity.ok(
                service.createFolder(user.getUsername(), name, description, parentId));
    }

    @Operation(summary = "Upload un fichier")
    @PostMapping(value = "/file", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<SharedResourceResponse> uploadFile(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) Long parentId
    ) throws IOException {
        if (file.isEmpty()) {
            throw new RuntimeException("Le fichier est vide");
        }
        return ResponseEntity.ok(
                service.uploadFile(user.getUsername(), file, description, parentId));
    }

    @Operation(summary = "Ressources racines")
    @GetMapping("/root")
    public ResponseEntity<List<SharedResourceResponse>> getRootResources(
            @AuthenticationPrincipal UserDetails user
    ) {
        return ResponseEntity.ok(service.getRootResources(user.getUsername()));
    }

    @Operation(summary = "Enfants d'un dossier")
    @GetMapping("/{id}/children")
    public ResponseEntity<List<SharedResourceResponse>> getChildren(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(service.getChildren(id));
    }

    @Operation(summary = "Rechercher des ressources")
    @GetMapping("/search")
    public ResponseEntity<List<SharedResourceResponse>> search(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam String q
    ) {
        return ResponseEntity.ok(service.search(user.getUsername(), q));
    }

    @Operation(summary = "Mes ressources accessibles")
    @GetMapping("/my")
    public ResponseEntity<List<SharedResourceResponse>> getMyResources(
            @AuthenticationPrincipal UserDetails user
    ) {
        return ResponseEntity.ok(service.getMyResources(user.getUsername()));
    }

    @Operation(summary = "Supprimer une ressource")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Long id
    ) {
        service.delete(id);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Statistiques")
    @GetMapping("/stats")
    public ResponseEntity<SharedSpaceService.Stats> getStats(
            @AuthenticationPrincipal UserDetails user
    ) {
        return ResponseEntity.ok(service.getStats(user.getUsername()));
    }

    // =========================================================================
    // TÉLÉCHARGEMENT — FIX : avec @AuthenticationPrincipal + uploadDir
    // =========================================================================

    @Operation(summary = "Télécharger un fichier")
    @GetMapping("/download/{id}")
    public ResponseEntity<Resource> downloadFile(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Long id
    ) throws MalformedURLException {
        SharedResourceResponse resource = service.getResourceById(id);

        if (resource.getFilePath() == null) {
            return ResponseEntity.notFound().build();
        }

        // FIX : utiliser uploadDir configurable au lieu de "uploads" hardcodé
        Path filePath = Paths.get(uploadDir).resolve(resource.getFilePath()).normalize();
        Resource fileResource = new UrlResource(filePath.toUri());

        if (!fileResource.exists()) {
            log.error("Fichier introuvable: {}", filePath);
            return ResponseEntity.notFound().build();
        }

        String contentType = resource.getFileType() != null
                ? resource.getFileType() : "application/octet-stream";

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + resource.getName() + "\"")
                .body(fileResource);
    }

    // =========================================================================
    // VISUALISATION — FIX : avec @AuthenticationPrincipal + uploadDir
    // =========================================================================

    @Operation(summary = "Visualiser un fichier (inline)")
    @GetMapping("/view/{id}")
    public ResponseEntity<Resource> viewFile(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Long id
    ) throws MalformedURLException {
        SharedResourceResponse resource = service.getResourceById(id);

        if (resource.getFilePath() == null) {
            return ResponseEntity.notFound().build();
        }

        Path filePath = Paths.get(uploadDir).resolve(resource.getFilePath()).normalize();
        Resource fileResource = new UrlResource(filePath.toUri());

        if (!fileResource.exists()) {
            log.error("Fichier introuvable: {}", filePath);
            return ResponseEntity.notFound().build();
        }

        String contentType = resource.getFileType() != null
                ? resource.getFileType() : "application/octet-stream";

        // inline → le navigateur affiche le fichier au lieu de le télécharger
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"" + resource.getName() + "\"")
                .body(fileResource);
    }

    // =========================================================================
    // PARTAGE — NOUVEAU
    // =========================================================================

    @Operation(summary = "Partager une ressource avec des utilisateurs")
    @PostMapping("/{id}/share")
    public ResponseEntity<ApiResponse<Void>> share(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Long id,
            @RequestBody List<Long> userIds
    ) {
        service.shareWith(id, userIds);
        return ResponseEntity.ok(ApiResponse.success("Ressource partagée avec succès"));
    }

    @Operation(summary = "Obtenir les utilisateurs avec qui une ressource est partagée")
    @GetMapping("/{id}/shared-with")
    public ResponseEntity<List<Map<String, Object>>> getSharedWith(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(service.getSharedWith(id));
    }

    @Operation(summary = "Retirer le partage pour un utilisateur")
    @DeleteMapping("/{id}/share/{userId}")
    public ResponseEntity<ApiResponse<Void>> unshare(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Long id,
            @PathVariable Long userId
    ) {
        service.unshareWith(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Partage retiré"));
    }

    @Operation(summary = "Rendre public/privé")
    @PutMapping("/{id}/public-access")
    public ResponseEntity<ApiResponse<Void>> togglePublicAccess(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Long id,
            @RequestParam boolean isPublic
    ) {
        service.setPublicAccess(id, isPublic);
        return ResponseEntity.ok(ApiResponse.success(
                isPublic ? "Ressource rendue publique" : "Ressource rendue privée"));
    }

    // =========================================================================
    // RENOMMER — NOUVEAU
    // =========================================================================

    @Operation(summary = "Renommer une ressource")
    @PutMapping("/{id}/rename")
    public ResponseEntity<SharedResourceResponse> rename(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Long id,
            @RequestParam String name
    ) {
        return ResponseEntity.ok(service.rename(id, name));
    }

    // =========================================================================
    // EMPLOYÉS POUR LE PARTAGE — NOUVEAU
    // =========================================================================

    @Operation(summary = "Liste des employés disponibles pour le partage")
    @GetMapping("/employees-for-share")
    public ResponseEntity<List<Map<String, Object>>> getEmployeesForShare(
            @AuthenticationPrincipal UserDetails user
    ) {
        return ResponseEntity.ok(service.getEmployeesForShare(user.getUsername()));
    }
}