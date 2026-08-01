package com.duniyabacker.front.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ConvertToEntrepriseRequest {

    @NotBlank(message = "Le nom de l'entreprise est requis")
    private String nomEntreprise;

    @NotBlank(message = "Le type d'entreprise est requis")
    private String typeEntreprise;

    @NotBlank(message = "Le secteur d'activité est requis")
    private String secteurActivite;

    @NotBlank(message = "L'adresse physique est requise")
    private String adressePhysique;

    private String numeroRegistreCommerce;
    private String description;
    private String siteWeb;
}
