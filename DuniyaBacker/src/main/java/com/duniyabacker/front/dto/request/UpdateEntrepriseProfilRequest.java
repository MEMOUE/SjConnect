package com.duniyabacker.front.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateEntrepriseProfilRequest {

    @NotBlank(message = "Le nom de l'entreprise est requis")
    private String nomEntreprise;

    @NotBlank(message = "Le type d'entreprise est requis")
    private String typeEntreprise;

    @NotBlank(message = "Le secteur d'activité est requis")
    private String secteurActivite;

    @Email(message = "L'email doit être valide")
    private String email;

    private String telephone;
    private String adressePhysique;
    private String numeroRegistreCommerce;
    private String description;
    private String siteWeb;
}