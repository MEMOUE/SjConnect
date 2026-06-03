package com.duniyabacker.front.entity.b2b;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "partenaires_projet")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PartenaireProjet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom;

    @Column(nullable = false)
    private String role;

    private String logo = "🏢";

    /**
     * Lien optionnel vers l'utilisateur de la plateforme.
     * - Renseigné quand le partenaire est un employé interne (mode userId)
     *   ou un utilisateur externe ajouté par email (mode email).
     * - null pour les partenaires saisis manuellement.
     *
     * Permet de retirer l'accès (participant) au moment de la suppression
     * du partenaire.
     */
    @Column(name = "utilisateur_id")
    private Long utilisateurId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutPartenaire statut = StatutPartenaire.ACTIF;

    // Référence back vers ProjetB2B : jamais sérialisée (évite la boucle infinie)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "projet_id", nullable = false)
    @JsonIgnore
    private ProjetB2B projet;

    public enum StatutPartenaire {
        ACTIF, INACTIF, SUSPENDU
    }
}