package com.duniyabacker.front.entity.b2b;

import com.duniyabacker.front.entity.User;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Message échangé à l'intérieur d'un projet B2B (onglet "Messages").
 *
 * Persistance : chaque message est lié à un projet et à son expéditeur.
 * Les relations sont @JsonIgnore pour éviter la sérialisation profonde ;
 * les champs @Transient (expediteurId, expediteurNom, projetId) sont exposés
 * au frontend après initTransientFields().
 */
@Entity
@Table(name = "messages_projet")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageProjet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String contenu;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "projet_id", nullable = false)
    @JsonIgnore
    private ProjetB2B projet;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expediteur_id", nullable = false)
    @JsonIgnore
    private User expediteur;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    // ── Champs transients exposés au frontend ──
    @Transient
    private Long projetId;

    @Transient
    private Long expediteurId;

    @Transient
    private String expediteurNom;

    @PostLoad
    public void initTransientFields() {
        if (this.projet != null) {
            this.projetId = this.projet.getId();
        }
        if (this.expediteur != null) {
            this.expediteurId = this.expediteur.getId();
            this.expediteurNom = resolveNom(this.expediteur);
        }
    }

    /** Résout le nom affichable selon le type d'utilisateur. */
    private String resolveNom(User u) {
        return switch (u.getRole().name()) {
            case "ENTREPRISE" -> {
                try {
                    yield ((com.duniyabacker.front.entity.auth.Entreprise) u).getNomEntreprise();
                } catch (ClassCastException e) { yield u.getUsername(); }
            }
            case "PARTICULIER" -> {
                try {
                    var p = (com.duniyabacker.front.entity.auth.Particulier) u;
                    yield p.getPrenom() + " " + p.getNom();
                } catch (ClassCastException e) { yield u.getUsername(); }
            }
            case "EMPLOYE" -> {
                try {
                    var e = (com.duniyabacker.front.entity.auth.Employe) u;
                    yield e.getPrenom() + " " + e.getNom();
                } catch (ClassCastException e2) { yield u.getUsername(); }
            }
            default -> u.getUsername();
        };
    }
}