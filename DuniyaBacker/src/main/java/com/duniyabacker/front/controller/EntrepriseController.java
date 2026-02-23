package com.duniyabacker.front.controller;

import com.duniyabacker.front.dto.request.ChangePasswordRequest;
import com.duniyabacker.front.dto.request.UpdateEntrepriseProfilRequest;
import com.duniyabacker.front.dto.response.ApiResponse;
import com.duniyabacker.front.dto.response.UserResponse;
import com.duniyabacker.front.service.EntrepriseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/entreprise")
@RequiredArgsConstructor
@Tag(name = "Entreprise", description = "Gestion du profil entreprise")
public class EntrepriseController {

    private final EntrepriseService entrepriseService;

    /**
     * Mettre à jour le profil de l'entreprise
     */
    @Operation(
            summary = "Mettre à jour le profil entreprise",
            description = "Modifier les informations du profil de l'entreprise connectée"
    )
    @PutMapping("/profil")
    @PreAuthorize("hasRole('ENTREPRISE')")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfil(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UpdateEntrepriseProfilRequest request) {
        return ResponseEntity.ok(
                entrepriseService.updateProfil(userDetails.getUsername(), request)
        );
    }

    /**
     * Changer le mot de passe
     */
    @Operation(
            summary = "Changer le mot de passe",
            description = "Modifier le mot de passe du compte connecté"
    )
    @PostMapping("/change-password")
    @PreAuthorize("hasRole('ENTREPRISE')")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ChangePasswordRequest request) {
        return ResponseEntity.ok(
                entrepriseService.changePassword(userDetails.getUsername(), request)
        );
    }
}