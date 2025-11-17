package com.duniyabacker.Front.entity.auth;

import com.duniyabacker.Front.entity.User;
import com.duniyabacker.Front.entity.auth.Entreprise;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "employes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class Employe extends User {

    @Column(nullable = false)
    private String prenom;

    @Column(nullable = false)
    private String nom;

    @Column(nullable = false)
    private String poste;

    @Column(nullable = false)
    private String departement;

    @Column(name = "role_plateforme", nullable = false)
    private String rolePlateforme; // admin, manager, employee, external

    @Column(name = "numero_matricule")
    private String numeroMatricule;

    @Column(name = "photo_profil_url")
    private String photoProfilUrl;

    // Relation avec l'entreprise
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entreprise_id", nullable = false)
    private Entreprise entreprise;

    @Column(name = "invitation_token")
    private String invitationToken;

    @Column(name = "invitation_accepted")
    private boolean invitationAccepted = false;
}