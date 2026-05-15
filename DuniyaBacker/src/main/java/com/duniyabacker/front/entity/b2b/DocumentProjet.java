package com.duniyabacker.front.entity.b2b;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "documents_projet")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DocumentProjet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nomFichier;        // nom affiché

    private String nomOriginal;       // nom d'origine du fichier uploadé

    @Column(nullable = false)
    private String cheminFichier;     // chemin relatif sur le serveur

    private String typeMime;          // ex: application/pdf, image/png

    private Long tailleFichier;       // en octets

    private String uploadePar;        // username de l'uploader

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "projet_id", nullable = false)
    @JsonBackReference
    private ProjetB2B projet;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    // ── Transient ──
    @Transient
    private Long projetId;

    @PostLoad
    public void initTransientFields() {
        if (this.projet != null) {
            this.projetId = this.projet.getId();
        }
    }

    /** Taille lisible (ex: "2.4 MB") */
    @Transient
    public String getTailleFormatee() {
        if (tailleFichier == null) return "—";
        if (tailleFichier < 1024) return tailleFichier + " B";
        if (tailleFichier < 1024 * 1024) return String.format("%.1f KB", tailleFichier / 1024.0);
        return String.format("%.1f MB", tailleFichier / (1024.0 * 1024));
    }

    /** Icône PrimeIcons selon le type MIME */
    @Transient
    public String getIcone() {
        if (typeMime == null) return "pi pi-file";
        if (typeMime.startsWith("image/")) return "pi pi-image";
        if (typeMime.contains("pdf")) return "pi pi-file-pdf";
        if (typeMime.contains("word") || typeMime.contains("document")) return "pi pi-file-word";
        if (typeMime.contains("excel") || typeMime.contains("spreadsheet")) return "pi pi-file-excel";
        if (typeMime.contains("zip") || typeMime.contains("rar")) return "pi pi-box";
        return "pi pi-file";
    }
}