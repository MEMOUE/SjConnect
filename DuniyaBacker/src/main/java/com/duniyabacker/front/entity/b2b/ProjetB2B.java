package com.duniyabacker.front.entity.b2b;

import com.duniyabacker.front.entity.User;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "projets_b2b")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjetB2B {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutProjet statut = StatutProjet.EN_ATTENTE;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PrioriteProjet priorite = PrioriteProjet.MOYENNE;

    @Column(nullable = false)
    private String categorie;

    private Integer progression = 0;

    @Column(name = "date_debut")
    private LocalDate dateDebut;

    @Column(name = "date_fin")
    private LocalDate dateFin;

    private Long budget = 0L;

    private String icone = "📁";

    // Créateur : on expose seulement l'id et le username pour éviter la sérialisation profonde
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "createur_id", nullable = false)
    @JsonIgnore
    private User createur;

    @Transient
    private Long createurId;

    @Transient
    private String createurUsername;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "projet_participants",
            joinColumns = @JoinColumn(name = "projet_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    @Builder.Default
    @JsonIgnore
    private Set<User> participants = new HashSet<>();

    // Partenaires : toujours inclus dans la réponse
    @OneToMany(mappedBy = "projet", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PartenaireProjet> partenaires = new ArrayList<>();

    // ── Tâches du projet ──
    @OneToMany(mappedBy = "projet", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    @Builder.Default
    private List<TacheProjet> taches = new ArrayList<>();

    // ── Documents du projet ──
    @OneToMany(mappedBy = "projet", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    @Builder.Default
    private List<DocumentProjet> documents = new ArrayList<>();

    // ── Messages du projet (récupérés via endpoint dédié, jamais sérialisés ici) ──
    @OneToMany(mappedBy = "projet", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    @Builder.Default
    private List<MessageProjet> messages = new ArrayList<>();

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // ── Méthodes utilitaires ──
    public void addParticipant(User user) {
        participants.add(user);
        if (this.createur != null && user.getId() != null && user.getId().equals(this.createur.getId())) {
            this.createurId       = user.getId();
            this.createurUsername = user.getUsername();
        }
    }

    public void removeParticipant(User user) {
        participants.remove(user);
    }

    public void addPartenaire(PartenaireProjet partenaire) {
        partenaires.add(partenaire);
        partenaire.setProjet(this);
    }

    public void removePartenaire(PartenaireProjet partenaire) {
        partenaires.remove(partenaire);
        partenaire.setProjet(null);
    }

    public void addTache(TacheProjet tache) {
        taches.add(tache);
        tache.setProjet(this);
    }

    public void removeTache(TacheProjet tache) {
        taches.remove(tache);
        tache.setProjet(null);
    }

    public void addDocument(DocumentProjet document) {
        documents.add(document);
        document.setProjet(this);
    }

    public void removeDocument(DocumentProjet document) {
        documents.remove(document);
        document.setProjet(null);
    }

    public void addMessage(MessageProjet message) {
        messages.add(message);
        message.setProjet(this);
        this.updatedAt = LocalDateTime.now();
    }

    // Appelé par le service pour peupler les champs @Transient avant sérialisation
    public void initTransientFields() {
        if (this.createur != null) {
            this.createurId       = this.createur.getId();
            this.createurUsername = this.createur.getUsername();
        }
    }

    public enum StatutProjet {
        EN_ATTENTE, ACTIF, EN_PAUSE, TERMINE, ARCHIVE
    }

    public enum PrioriteProjet {
        BASSE, MOYENNE, HAUTE, CRITIQUE
    }
}