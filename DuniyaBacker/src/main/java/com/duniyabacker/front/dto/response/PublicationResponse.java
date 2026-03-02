package com.duniyabacker.front.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicationResponse {

    private Long   id;
    private String titre;
    private String contenu;

    // Média joint
    private String mediaUrl;
    private String mediaType;
    private String mediaNom;
    private Long   mediaTaille;

    // Auteur
    private Long   auteurId;
    private String auteurNom;
    private String auteurType;
    private String auteurInitiales;

    /**
     * ID de l'entreprise publieure (utile côté frontend pour le bouton "Contacter").
     *
     * - Si l'auteur est une Entreprise  → auteurEntrepriseId == auteurId
     * - Si l'auteur est un Employé      → auteurEntrepriseId == ID de son entreprise
     * - Si l'auteur est un Particulier  → auteurEntrepriseId == null
     */
    private Long auteurEntrepriseId;

    // Visibilité
    private List<String> typesEntreprisesVisibles;
    private boolean      visibleParTous;

    // Métriques
    private Integer nombreVues;

    // Dates
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}