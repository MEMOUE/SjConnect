package com.duniyabacker.Front.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class CreateEmployeRequest {

    @NotBlank(message = "Le prénom est requis")
    private String prenom;

    @NotBlank(message = "Le nom est requis")
    private String nom;

    @NotBlank(message = "L'email est requis")
    @Email(message = "L'email doit être valide")
    private String email;

    @NotBlank(message = "Le téléphone est requis")
    private String telephone;

    @NotBlank(message = "Le poste est requis")
    private String poste;

    @NotBlank(message = "Le département est requis")
    private String departement;

    @NotBlank(message = "Le rôle est requis")
    private String role; // admin, manager, employee, external

    private String numeroMatricule;
}