package com.duniyabacker.front.entity.meeting;

import com.duniyabacker.front.entity.User;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "meetings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Meeting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 300)
    private String titre;

    @Column(columnDefinition = "TEXT")
    private String description;

    /** Identifiant unique de la salle Jitsi — préfixé "DouniyaConnect-" côté frontend */
    @Column(nullable = false, unique = true, length = 150)
    private String roomName;

    @Column(nullable = false)
    private LocalDateTime dateDebut;

    private LocalDateTime dateFin;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organisateur_id", nullable = false)
    @JsonIgnore
    private User organisateur;

    /** Champs transients exposés au frontend */
    @Transient private Long   organisateurId;
    @Transient private String organisateurNom;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private StatutMeeting statut = StatutMeeting.PLANIFIE;

    @OneToMany(mappedBy = "meeting", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<MeetingParticipant> participants = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /** À appeler avant la sérialisation JSON */
    public void initTransientFields() {
        if (organisateur == null) return;
        organisateurId = organisateur.getId();

        // Résolution du nom selon le type d'utilisateur
        organisateurNom = switch (organisateur.getRole().name()) {
            case "ENTREPRISE" -> {
                try {
                    yield ((com.duniyabacker.front.entity.auth.Entreprise) organisateur).getNomEntreprise();
                } catch (ClassCastException e) { yield organisateur.getUsername(); }
            }
            case "PARTICULIER" -> {
                try {
                    var p = (com.duniyabacker.front.entity.auth.Particulier) organisateur;
                    yield p.getPrenom() + " " + p.getNom();
                } catch (ClassCastException e) { yield organisateur.getUsername(); }
            }
            case "EMPLOYE" -> {
                try {
                    var e = (com.duniyabacker.front.entity.auth.Employe) organisateur;
                    yield e.getPrenom() + " " + e.getNom();
                } catch (ClassCastException e2) { yield organisateur.getUsername(); }
            }
            default -> organisateur.getUsername();
        };
    }

    public enum StatutMeeting { PLANIFIE, EN_COURS, TERMINE }
}