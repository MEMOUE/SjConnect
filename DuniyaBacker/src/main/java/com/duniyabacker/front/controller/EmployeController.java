package com.duniyabacker.front.controller;

import com.duniyabacker.front.dto.request.AcceptInvitationRequest;
import com.duniyabacker.front.dto.request.CreateEmployeRequest;
import com.duniyabacker.front.dto.response.ApiResponse;
import com.duniyabacker.front.dto.response.EmployeResponse;
import com.duniyabacker.front.service.EmployeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Gestion des Employés", description = "API pour la gestion des employés par les entreprises")
public class EmployeController {

    private final EmployeService employeService;

    /**
     * Créer un nouvel employé (entreprise uniquement)
     */
    @Operation(
            summary = "Créer un employé",
            description = "Ajouter un nouvel employé à l'entreprise. Un email d'invitation sera envoyé."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Employé créé avec succès",
                    content = @Content(schema = @Schema(implementation = ApiResponse.class))
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "400",
                    description = "Données invalides"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "401",
                    description = "Non authentifié"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "403",
                    description = "Accès réservé aux entreprises"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "409",
                    description = "Email déjà utilisé"
            )
    })
    @PostMapping("/entreprise/employes")
    @PreAuthorize("hasRole('ENTREPRISE')")
    public ResponseEntity<ApiResponse<EmployeResponse>> createEmploye(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreateEmployeRequest request) {
        return ResponseEntity.ok(
                employeService.createEmploye(userDetails.getUsername(), request)
        );
    }

    /**
     * Accepter une invitation (public)
     */
    @Operation(
            summary = "Accepter une invitation",
            description = "Permettre à un employé invité de créer son compte et d'accepter l'invitation"
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Invitation acceptée avec succès"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "400",
                    description = "Token invalide ou invitation déjà acceptée"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "409",
                    description = "Nom d'utilisateur déjà utilisé"
            )
    })
    @PostMapping("/auth/accept-invitation")
    public ResponseEntity<ApiResponse<Void>> acceptInvitation(
            @Valid @RequestBody AcceptInvitationRequest request) {
        return ResponseEntity.ok(employeService.acceptInvitation(request));
    }

    /**
     * Vérifier la validité d'un token d'invitation (public)
     */
    @Operation(
            summary = "Vérifier token d'invitation",
            description = "Vérifier si un token d'invitation est valide"
    )
    @GetMapping("/auth/check-invitation")
    public ResponseEntity<ApiResponse<Void>> checkInvitation(
            @Parameter(description = "Token d'invitation")
            @RequestParam String token) {
        return ResponseEntity.ok(ApiResponse.success("Token d'invitation valide"));
    }

    /**
     * Obtenir la liste paginée des employés (entreprise uniquement)
     */
    @Operation(
            summary = "Liste des employés (paginée)",
            description = "Obtenir la liste paginée des employés de l'entreprise"
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Liste des employés"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "401",
                    description = "Non authentifié"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "403",
                    description = "Accès réservé aux entreprises"
            )
    })
    @GetMapping("/entreprise/employes")
    @PreAuthorize("hasRole('ENTREPRISE')")
    public ResponseEntity<Page<EmployeResponse>> getEmployes(
            @AuthenticationPrincipal UserDetails userDetails,
            @PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(
                employeService.getEmployesByEntreprise(userDetails.getUsername(), pageable)
        );
    }

    /**
     * Obtenir tous les employés sans pagination (entreprise uniquement)
     */
    @Operation(
            summary = "Liste complète des employés",
            description = "Obtenir tous les employés de l'entreprise sans pagination"
    )
    @GetMapping("/entreprise/employes/all")
    @PreAuthorize("hasRole('ENTREPRISE')")
    public ResponseEntity<List<EmployeResponse>> getAllEmployes(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                employeService.getAllEmployesByEntreprise(userDetails.getUsername())
        );
    }

    /**
     * Obtenir un employé par son ID (entreprise uniquement)
     */
    @Operation(
            summary = "Détails d'un employé",
            description = "Obtenir les informations détaillées d'un employé"
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Détails de l'employé",
                    content = @Content(schema = @Schema(implementation = EmployeResponse.class))
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "403",
                    description = "L'employé n'appartient pas à votre entreprise"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "404",
                    description = "Employé non trouvé"
            )
    })
    @GetMapping("/entreprise/employes/{id}")
    @PreAuthorize("hasRole('ENTREPRISE')")
    public ResponseEntity<EmployeResponse> getEmployeById(
            @AuthenticationPrincipal UserDetails userDetails,
            @Parameter(description = "ID de l'employé")
            @PathVariable Long id) {
        return ResponseEntity.ok(
                employeService.getEmployeById(userDetails.getUsername(), id)
        );
    }

    /**
     * Mettre à jour un employé (entreprise uniquement)
     */
    @Operation(
            summary = "Modifier un employé",
            description = "Mettre à jour les informations d'un employé"
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Employé mis à jour avec succès"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "400",
                    description = "Données invalides ou email non modifiable"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "403",
                    description = "L'employé n'appartient pas à votre entreprise"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "404",
                    description = "Employé non trouvé"
            )
    })
    @PutMapping("/entreprise/employes/{id}")
    @PreAuthorize("hasRole('ENTREPRISE')")
    public ResponseEntity<ApiResponse<EmployeResponse>> updateEmploye(
            @AuthenticationPrincipal UserDetails userDetails,
            @Parameter(description = "ID de l'employé")
            @PathVariable Long id,
            @Valid @RequestBody CreateEmployeRequest request) {
        return ResponseEntity.ok(
                employeService.updateEmploye(userDetails.getUsername(), id, request)
        );
    }

    /**
     * Supprimer un employé (entreprise uniquement)
     */
    @Operation(
            summary = "Supprimer un employé",
            description = "Supprimer définitivement un employé de l'entreprise"
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Employé supprimé avec succès"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "403",
                    description = "L'employé n'appartient pas à votre entreprise"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "404",
                    description = "Employé non trouvé"
            )
    })
    @DeleteMapping("/entreprise/employes/{id}")
    @PreAuthorize("hasRole('ENTREPRISE')")
    public ResponseEntity<ApiResponse<Void>> deleteEmploye(
            @AuthenticationPrincipal UserDetails userDetails,
            @Parameter(description = "ID de l'employé")
            @PathVariable Long id) {
        return ResponseEntity.ok(
                employeService.deleteEmploye(userDetails.getUsername(), id)
        );
    }

    /**
     * Renvoyer l'invitation à un employé (entreprise uniquement)
     */
    @Operation(
            summary = "Renvoyer l'invitation",
            description = "Renvoyer l'email d'invitation à un employé qui n'a pas encore accepté"
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Invitation renvoyée avec succès"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "400",
                    description = "L'employé a déjà accepté l'invitation"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "403",
                    description = "L'employé n'appartient pas à votre entreprise"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "404",
                    description = "Employé non trouvé"
            )
    })
    @PostMapping("/entreprise/employes/{id}/resend-invitation")
    @PreAuthorize("hasRole('ENTREPRISE')")
    public ResponseEntity<ApiResponse<Void>> resendInvitation(
            @AuthenticationPrincipal UserDetails userDetails,
            @Parameter(description = "ID de l'employé")
            @PathVariable Long id) {
        return ResponseEntity.ok(
                employeService.resendInvitation(userDetails.getUsername(), id)
        );
    }

    /**
     * Obtenir le nombre d'employés (entreprise uniquement)
     */
    @Operation(
            summary = "Nombre d'employés",
            description = "Obtenir le nombre total d'employés de l'entreprise"
    )
    @GetMapping("/entreprise/employes/count")
    @PreAuthorize("hasRole('ENTREPRISE')")
    public ResponseEntity<Long> getEmployeCount(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                employeService.getEmployeCount(userDetails.getUsername())
        );
    }
}