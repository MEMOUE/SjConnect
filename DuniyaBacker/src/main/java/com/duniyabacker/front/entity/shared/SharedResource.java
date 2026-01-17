package com.duniyabacker.front.entity.shared;

import com.duniyabacker.front.entity.User;
import com.duniyabacker.front.entity.auth.Entreprise;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "shared_resources")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SharedResource {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    private ResourceType type; // FOLDER ou FILE

    private String description;

    // Pour fichiers
    private String filePath;
    private Long fileSize;
    private String fileType;

    @ManyToOne
    @JoinColumn(name = "owner_id")
    private User owner;

    @ManyToOne
    @JoinColumn(name = "entreprise_id")
    private Entreprise entreprise;

    @ManyToOne
    @JoinColumn(name = "parent_id")
    private SharedResource parent;

    @ManyToMany
    @JoinTable(name = "resource_shares")
    @Builder.Default
    private List<User> sharedWith = new ArrayList<>();

    private boolean publicAccess = false;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() { createdAt = updatedAt = LocalDateTime.now(); }

    @PreUpdate
    void onUpdate() { updatedAt = LocalDateTime.now(); }

    public enum ResourceType { FOLDER, FILE }
}