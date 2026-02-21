package com.duniyabacker.front.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class CreatePublicationRequest {

    @Size(max = 300, message = "Le titre ne peut pas dépasser 300 caractères")
    private String titre;

    @NotBlank(message = "Le contenu est requis")
    @Size(max = 5000, message = "Le contenu ne peut pas dépasser 5000 caractères")
    private String contenu;

    /**
     * Types d'entreprises autorisés à voir cette publication.
     * Liste vide = visible par TOUS les utilisateurs.
     *
     * Valeurs possibles : BANQUES, ASSURANCES, SGI, SGO, FONDS_INVESTISSEMENT,
     *                     MICROFINANCE, SOCIETES_BOURSE, COURTIERS, AUTRES
     */
    private List<String> typesEntreprisesVisibles = new ArrayList<>();

    // Médias (URL retournée après upload préalable via /api/chat/upload)
    private String mediaUrl;
    private String mediaType;
    private String mediaNom;
    private Long   mediaTaille;
}