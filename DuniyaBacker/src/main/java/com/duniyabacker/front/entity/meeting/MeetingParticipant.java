package com.duniyabacker.front.entity.meeting;

import com.duniyabacker.front.entity.User;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "meeting_participants")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MeetingParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meeting_id", nullable = false)
    @JsonIgnore
    private Meeting meeting;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    @JsonIgnore
    private User user;

    @Transient private Long   userId;
    @Transient private String nom;
    @Transient private String email;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private StatutParticipant statut = StatutParticipant.INVITE;

    public void initTransientFields() {
        if (user == null) return;
        userId = user.getId();
        email  = user.getEmail();
        nom = switch (user.getRole().name()) {
            case "ENTREPRISE" -> {
                try { yield ((com.duniyabacker.front.entity.auth.Entreprise) user).getNomEntreprise(); }
                catch (ClassCastException e) { yield user.getUsername(); }
            }
            case "PARTICULIER" -> {
                try {
                    var p = (com.duniyabacker.front.entity.auth.Particulier) user;
                    yield p.getPrenom() + " " + p.getNom();
                } catch (ClassCastException e) { yield user.getUsername(); }
            }
            case "EMPLOYE" -> {
                try {
                    var e = (com.duniyabacker.front.entity.auth.Employe) user;
                    yield e.getPrenom() + " " + e.getNom();
                } catch (ClassCastException e2) { yield user.getUsername(); }
            }
            default -> user.getUsername();
        };
    }

    public enum StatutParticipant { INVITE, ACCEPTE, REFUSE, PRESENT }
}