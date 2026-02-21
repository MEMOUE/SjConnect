package com.duniyabacker.front.entity.publication;

import com.duniyabacker.front.entity.User;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "publications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Publication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 300)
    private String titre;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String contenu;

    // Fichier joint optionnel
    @Column(name = "media_url")
    private String mediaUrl;

    @Column(name = "media_type")
    private String mediaType;

    @Column(name = "media_nom")
    private String mediaNom;

    @Column(name = "media_taille")
    private Long mediaTaille;

    // Auteur (non sérialisé directement)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auteur_id", nullable = false)
    @JsonIgnore
    private User auteur;

    @Transient private Long auteurId;
    @Transient private String auteurNom;
    @Transient private String auteurType;
    @Transient private String auteurInitiales;

    /**
     * Types d'entreprises autorisés à voir.
     * Liste VIDE = visible par TOUS.
     */
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
            name = "publication_visibilite",
            joinColumns = @JoinColumn(name = "publication_id")
    )
    @Column(name = "type_entreprise")
    @Builder.Default
    private List<String> typesEntreprisesVisibles = new ArrayList<>();

    @Column(name = "nombre_vues")
    @Builder.Default
    private Integer nombreVues = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private StatutPublication statut = StatutPublication.PUBLIE;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist protected void onCreate() { createdAt = updatedAt = LocalDateTime.now(); }
    @PreUpdate  protected void onUpdate()  { updatedAt = LocalDateTime.now(); }

    public void initTransientFields() {
        if (auteur == null) return;
        auteurId   = auteur.getId();
        auteurType = auteur.getRole().name();
        String nom = resolveNom();
        auteurNom      = nom;
        auteurInitiales = buildInitiales(nom);
    }

    private String resolveNom() {
        return switch (auteur.getRole().name()) {
            case "ENTREPRISE" -> {
                try { yield ((com.duniyabacker.front.entity.auth.Entreprise) auteur).getNomEntreprise(); }
                catch (ClassCastException e) { yield auteur.getUsername(); }
            }
            case "PARTICULIER" -> {
                try {
                    var p = (com.duniyabacker.front.entity.auth.Particulier) auteur;
                    yield p.getPrenom() + " " + p.getNom();
                } catch (ClassCastException e) { yield auteur.getUsername(); }
            }
            case "EMPLOYE" -> {
                try {
                    var emp = (com.duniyabacker.front.entity.auth.Employe) auteur;
                    yield emp.getPrenom() + " " + emp.getNom();
                } catch (ClassCastException e) { yield auteur.getUsername(); }
            }
            default -> auteur.getUsername();
        };
    }

    private String buildInitiales(String nom) {
        if (nom == null || nom.isBlank()) return "??";
        String[] p = nom.trim().split("\\s+");
        if (p.length >= 2) return ("" + p[0].charAt(0) + p[1].charAt(0)).toUpperCase();
        return nom.substring(0, Math.min(2, nom.length())).toUpperCase();
    }

    public enum StatutPublication { PUBLIE, ARCHIVE }
}