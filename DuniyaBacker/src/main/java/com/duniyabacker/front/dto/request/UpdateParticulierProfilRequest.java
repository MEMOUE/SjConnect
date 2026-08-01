package com.duniyabacker.front.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateParticulierProfilRequest {

    @NotBlank(message = "Le prénom est requis")
    private String prenom;

    @NotBlank(message = "Le nom est requis")
    private String nom;

    @NotBlank(message = "Le secteur d'activité est requis")
    private String secteurActivite;

    @Email(message = "L'email doit être valide")
    private String email;

    private String telephone;
    private String posteActuel;
    private String bio;
    private boolean newsletter;
}
