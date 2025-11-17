package com.duniyabacker.Front.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;

@Data
public class RegisterParticulierRequest {

    @NotBlank(message = "Le prénom est requis")
    private String prenom;

    @NotBlank(message = "Le nom est requis")
    private String nom;

    @NotBlank(message = "Le genre est requis")
    private String genre;

    @NotNull(message = "La date de naissance est requise")
    @Past(message = "La date de naissance doit être dans le passé")
    private LocalDate dateNaissance;

    @NotBlank(message = "Le numéro de téléphone est requis")
    private String telephone;

    @NotBlank(message = "L'email est requis")
    @Email(message = "L'email doit être valide")
    private String email;

    @NotBlank(message = "Le secteur d'activité est requis")
    private String secteurActivite;

    private String posteActuel;

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

    private boolean newsletter;
}