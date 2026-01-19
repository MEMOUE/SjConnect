package com.duniyabacker.front.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Data
public class CreateProjetB2BRequest {

    @NotBlank(message = "Le nom du projet est requis")
    @Size(max = 200, message = "Le nom ne peut pas dépasser 200 caractères")
    private String nom;

    @Size(max = 2000, message = "La description ne peut pas dépasser 2000 caractères")
    private String description;

    @NotBlank(message = "La catégorie est requise")
    private String categorie;

    private String priorite = "MOYENNE"; // BASSE, MOYENNE, HAUTE, CRITIQUE

    private LocalDate dateDebut;

    private LocalDate dateFin;

    private Long budget = 0L;

    private String icone = "📁";

    private List<PartenaireDTO> partenaires = new ArrayList<>();

    private List<Long> participantIds = new ArrayList<>();

    /**
     * DTO interne pour les partenaires du projet
     */
    @Data
    public static class PartenaireDTO {

        @NotBlank(message = "Le nom du partenaire est requis")
        private String nom;

        @NotBlank(message = "Le rôle du partenaire est requis")
        private String role;

        private String logo = "🏢";
    }
}