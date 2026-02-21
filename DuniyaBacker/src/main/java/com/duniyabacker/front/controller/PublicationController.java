package com.duniyabacker.front.controller;

import com.duniyabacker.front.dto.request.CreatePublicationRequest;
import com.duniyabacker.front.dto.response.ApiResponse;
import com.duniyabacker.front.dto.response.PublicationResponse;
import com.duniyabacker.front.service.PublicationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/marketplace")
@RequiredArgsConstructor
@Tag(name = "Marketplace", description = "Publications commerciales et financières B2B")
public class PublicationController {

    private final PublicationService publicationService;

    /** Créer une publication */
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Publier une offre / annonce sur le marketplace")
    public ResponseEntity<ApiResponse<PublicationResponse>> createPublication(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreatePublicationRequest request
    ) {
        return ResponseEntity.ok(
                publicationService.createPublication(userDetails.getUsername(), request)
        );
    }

    /** Feed du marketplace (filtré selon le type de l'entreprise connectée) */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Récupérer le feed du marketplace")
    public ResponseEntity<List<PublicationResponse>> getFeed(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(
                publicationService.getFeed(userDetails.getUsername())
        );
    }

    /** Mes publications */
    @GetMapping("/mes-publications")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Mes publications sur le marketplace")
    public ResponseEntity<List<PublicationResponse>> getMesPublications(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(
                publicationService.getMesPublications(userDetails.getUsername())
        );
    }

    /** Recherche */
    @GetMapping("/search")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Rechercher des publications")
    public ResponseEntity<List<PublicationResponse>> search(
            @RequestParam String q
    ) {
        return ResponseEntity.ok(publicationService.search(q));
    }

    /** Supprimer / archiver */
    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Supprimer une de mes publications")
    public ResponseEntity<ApiResponse<Void>> delete(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(
                publicationService.deletePublication(userDetails.getUsername(), id)
        );
    }
}