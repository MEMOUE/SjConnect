package com.duniyabacker.front.entity.b2b;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "taches_projet")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TacheProjet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titre;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private StatutTache statut = StatutTache.EN_ATTENTE;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private PrioriteTache priorite = PrioriteTache.MOYENNE;

    private String assigneA; // nom ou username de la personne assignée

    private LocalDate dateEcheance;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "projet_id", nullable = false)
    @JsonBackReference
    private ProjetB2B projet;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // ── Transient : projetId pour la sérialisation JSON ──
    @Transient
    private Long projetId;

    @PostLoad
    public void initTransientFields() {
        if (this.projet != null) {
            this.projetId = this.projet.getId();
        }
    }

    public enum StatutTache {
        EN_ATTENTE, EN_COURS, TERMINEE
    }

    public enum PrioriteTache {
        BASSE, MOYENNE, HAUTE
    }
}