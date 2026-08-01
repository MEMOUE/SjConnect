package com.duniyabacker.front.controller;

import com.duniyabacker.front.dto.request.ChangePasswordRequest;
import com.duniyabacker.front.dto.request.UpdateParticulierProfilRequest;
import com.duniyabacker.front.dto.response.ApiResponse;
import com.duniyabacker.front.dto.response.UserResponse;
import com.duniyabacker.front.service.ParticulierService;
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
@RequestMapping("/api/particulier")
@RequiredArgsConstructor
@Tag(name = "Particulier", description = "Gestion du profil particulier")
public class ParticulierController {

    private final ParticulierService particulierService;

    /**
     * Mettre à jour le profil du particulier
     */
    @Operation(
            summary = "Mettre à jour le profil particulier",
            description = "Modifier les informations du profil du compte particulier connecté"
    )
    @PutMapping("/profil")
    @PreAuthorize("hasRole('PARTICULIER')")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfil(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UpdateParticulierProfilRequest request) {
        return ResponseEntity.ok(
                particulierService.updateProfil(userDetails.getUsername(), request)
        );
    }

    /**
     * Changer le mot de passe
     */
    @Operation(
            summary = "Changer le mot de passe",
            description = "Modifier le mot de passe du compte particulier connecté"
    )
    @PostMapping("/change-password")
    @PreAuthorize("hasRole('PARTICULIER')")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ChangePasswordRequest request) {
        return ResponseEntity.ok(
                particulierService.changePassword(userDetails.getUsername(), request)
        );
    }
}
