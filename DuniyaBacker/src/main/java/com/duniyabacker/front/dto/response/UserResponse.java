package com.duniyabacker.front.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {

    private Long id;
    private String username;
    private String email;
    private String telephone;
    private String role;
    private LocalDateTime createdAt;

    // Champs entreprise
    private String nomEntreprise;
    private String typeEntreprise;
    private String secteurActivite;
    private String adressePhysique;
    private String numeroRegistreCommerce;
    private String description;
    private String siteWeb;

    // Pour particulier
    private String prenom;
    private String nom;
    private String genre;

    // Pour employé
    private String poste;
    private String departement;
    private Long entrepriseId;
    private String entrepriseNom;
}