package com.duniyabacker.front.entity.auth;

import com.duniyabacker.front.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "entreprises")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class Entreprise extends User {

    @Column(name = "nom_entreprise", nullable = false)
    private String nomEntreprise;

    @Column(name = "type_entreprise", nullable = false)
    private String typeEntreprise;

    @Column(name = "secteur_activite", nullable = false)
    private String secteurActivite;

    @Column(name = "adresse_physique", nullable = false, columnDefinition = "TEXT")
    private String adressePhysique;

    @Column(name = "numero_registre_commerce")
    private String numeroRegistreCommerce;

    @Column(name = "logo_url")
    private String logoUrl;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "site_web")
    private String siteWeb;

    // Relation avec les employés
    @OneToMany(mappedBy = "entreprise", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Employe> employes = new ArrayList<>();

    // Méthode utilitaire pour ajouter un employé
    public void addEmploye(Employe employe) {
        employes.add(employe);
        employe.setEntreprise(this);
    }

    // Méthode utilitaire pour supprimer un employé
    public void removeEmploye(Employe employe) {
        employes.remove(employe);
        employe.setEntreprise(null);
    }
}