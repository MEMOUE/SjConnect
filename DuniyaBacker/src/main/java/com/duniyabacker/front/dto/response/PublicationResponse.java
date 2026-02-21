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

    // Média
    private String mediaUrl;
    private String mediaType;
    private String mediaNom;
    private Long   mediaTaille;

    // Auteur
    private Long   auteurId;
    private String auteurNom;
    private String auteurType;
    private String auteurInitiales;

    // Visibilité
    private List<String> typesEntreprisesVisibles;
    private boolean      visibleParTous;

    // Métriques
    private Integer nombreVues;

    // Dates
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}