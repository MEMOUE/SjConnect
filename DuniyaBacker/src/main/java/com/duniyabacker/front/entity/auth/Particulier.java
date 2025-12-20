package com.duniyabacker.front.entity.auth;

import com.duniyabacker.front.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "particuliers")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class Particulier extends User {

    @Column(nullable = false)
    private String prenom;

    @Column(nullable = false)
    private String nom;

    @Column(nullable = false)
    private String genre;

    @Column(name = "date_naissance", nullable = false)
    private LocalDate dateNaissance;

    @Column(name = "secteur_activite", nullable = false)
    private String secteurActivite;

    @Column(name = "poste_actuel")
    private String posteActuel;

    @Column(name = "photo_profil_url")
    private String photoProfilUrl;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column
    private boolean newsletter = false;
}