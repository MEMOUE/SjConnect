package com.duniyabacker.front.controller;

import com.duniyabacker.front.dto.request.*;
import com.duniyabacker.front.dto.response.*;
import com.duniyabacker.front.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentification", description = "API pour l'authentification et la gestion des comptes utilisateurs")
public class AuthController {

    private final AuthService authService;

    /**
     * Inscription d'une entreprise
     */
    @Operation(
            summary = "Inscription entreprise",
            description = "Créer un nouveau compte entreprise. Un email de vérification sera envoyé."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Compte créé avec succès",
                    content = @Content(schema = @Schema(implementation = ApiResponse.class))
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "400",
                    description = "Données invalides"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "409",
                    description = "Email ou nom d'utilisateur déjà utilisé"
            )
    })
    @PostMapping("/register/entreprise")
    public ResponseEntity<ApiResponse<Void>> registerEntreprise(
            @Valid @RequestBody RegisterEntrepriseRequest request) {
        return ResponseEntity.ok(authService.registerEntreprise(request));
    }

    /**
     * Inscription d'un particulier
     */
    @Operation(
            summary = "Inscription particulier",
            description = "Créer un nouveau compte individuel. Un email de vérification sera envoyé."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Compte créé avec succès"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "400",
                    description = "Données invalides"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "409",
                    description = "Email ou nom d'utilisateur déjà utilisé"
            )
    })
    @PostMapping("/register/particulier")
    public ResponseEntity<ApiResponse<Void>> registerParticulier(
            @Valid @RequestBody RegisterParticulierRequest request) {
        return ResponseEntity.ok(authService.registerParticulier(request));
    }

    /**
     * Connexion
     */
    @Operation(
            summary = "Connexion",
            description = "Authentifier un utilisateur et obtenir un token JWT"
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Connexion réussie",
                    content = @Content(schema = @Schema(implementation = AuthResponse.class))
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "401",
                    description = "Identifiants incorrects ou compte non activé"
            )
    })
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    /**
     * Vérification de l'email
     */
    @Operation(
            summary = "Vérifier l'email",
            description = "Vérifier l'adresse email avec le token reçu par email"
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Email vérifié avec succès"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "400",
                    description = "Token invalide"
            )
    })
    @GetMapping("/verify-email")
    public ResponseEntity<ApiResponse<Void>> verifyEmail(
            @Parameter(description = "Token de vérification reçu par email")
            @RequestParam String token) {
        return ResponseEntity.ok(authService.verifyEmail(token));
    }

    /**
     * Demande de réinitialisation de mot de passe
     */
    @Operation(
            summary = "Mot de passe oublié",
            description = "Demander la réinitialisation du mot de passe. Un email sera envoyé."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Email de réinitialisation envoyé"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "404",
                    description = "Aucun compte associé à cet email"
            )
    })
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(
            @Valid @RequestBody PasswordResetRequest request) {
        return ResponseEntity.ok(authService.requestPasswordReset(request));
    }

    /**
     * Réinitialisation du mot de passe
     */
    @Operation(
            summary = "Réinitialiser le mot de passe",
            description = "Définir un nouveau mot de passe avec le token reçu par email"
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Mot de passe réinitialisé avec succès"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "400",
                    description = "Token invalide ou expiré"
            )
    })
    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @Valid @RequestBody NewPasswordRequest request) {
        return ResponseEntity.ok(authService.resetPassword(request));
    }

    /**
     * Rafraîchissement du token
     */
    @Operation(
            summary = "Rafraîchir le token",
            description = "Obtenir un nouveau token d'accès avec le token de rafraîchissement"
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Nouveau token généré",
                    content = @Content(schema = @Schema(implementation = AuthResponse.class))
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "401",
                    description = "Token de rafraîchissement invalide"
            )
    })
    @PostMapping("/refresh-token")
    public ResponseEntity<AuthResponse> refreshToken(
            @Parameter(description = "Token de rafraîchissement")
            @RequestParam String refreshToken) {
        return ResponseEntity.ok(authService.refreshToken(refreshToken));
    }

    /**
     * Obtenir l'utilisateur courant
     */
    @Operation(
            summary = "Utilisateur courant",
            description = "Obtenir les informations de l'utilisateur connecté"
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Informations utilisateur",
                    content = @Content(schema = @Schema(implementation = UserResponse.class))
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "401",
                    description = "Non authentifié"
            )
    })
    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(authService.getCurrentUser(userDetails.getUsername()));
    }

    /**
     * Déconnexion (côté client, invalider le token)
     */
    @Operation(
            summary = "Déconnexion",
            description = "Déconnecter l'utilisateur (le token doit être supprimé côté client)"
    )
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout() {
        return ResponseEntity.ok(ApiResponse.success("Déconnexion réussie"));
    }
}