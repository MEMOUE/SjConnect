package com.duniyabacker.Front.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class RegisterEntrepriseRequest {

    @NotBlank(message = "Le nom de l'entreprise est requis")
    private String nomEntreprise;

    @NotBlank(message = "Le type d'entreprise est requis")
    private String typeEntreprise;

    @NotBlank(message = "Le secteur d'activité est requis")
    private String secteurActivite;

    @NotBlank(message = "L'adresse physique est requise")
    private String adressePhysique;

    @NotBlank(message = "Le numéro de téléphone est requis")
    private String telephone;

    @NotBlank(message = "L'email est requis")
    @Email(message = "L'email doit être valide")
    private String email;

    @NotBlank(message = "Le nom d'utilisateur est requis")
    @Size(min = 3, max = 50, message = "Le nom d'utilisateur doit contenir entre 3 et 50 caractères")
    private String username;

    @NotBlank(message = "Le mot de passe est requis")
    @Size(min = 8, message = "Le mot de passe doit contenir au moins 8 caractères")
    private String password;

    @NotBlank(message = "La confirmation du mot de passe est requise")
    private String confirmPassword;

    @AssertTrue(message = "Vous devez accepter les conditions d'utilisation")
    private boolean acceptTerms;

    private String numeroRegistreCommerce;
    private String description;
    private String siteWeb;
}