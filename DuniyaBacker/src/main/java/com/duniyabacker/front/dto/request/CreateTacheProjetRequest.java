package com.duniyabacker.front.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateTacheProjetRequest {

    @NotBlank(message = "Le titre est obligatoire")
    private String titre;

    private String description;

    private String priorite;   // BASSE, MOYENNE, HAUTE

    private String assigneA;   // nom ou username

    private String dateEcheance; // format yyyy-MM-dd
}