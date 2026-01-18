package com.duniyabacker.front.entity.b2b;

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

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutPartenaire statut = StatutPartenaire.ACTIF;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "projet_id", nullable = false)
    private ProjetB2B projet;

    public enum StatutPartenaire {
        ACTIF,
        INACTIF,
        SUSPENDU
    }
}