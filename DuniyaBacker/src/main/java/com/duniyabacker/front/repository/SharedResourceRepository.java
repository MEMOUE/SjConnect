package com.duniyabacker.front.repository;

import com.duniyabacker.front.entity.User;
import com.duniyabacker.front.entity.auth.Entreprise;
import com.duniyabacker.front.entity.shared.SharedResource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface SharedResourceRepository extends JpaRepository<SharedResource, Long> {

    // Ressources racines
    List<SharedResource> findByEntrepriseAndParentIsNull(Entreprise entreprise);

    // Enfants d'un dossier
    List<SharedResource> findByParent(SharedResource parent);

    // Recherche
    List<SharedResource> findByEntrepriseAndNameContainingIgnoreCase(Entreprise entreprise, String name);

    // Ressources accessibles (propriétaire ou partagées)
    @Query("SELECT r FROM SharedResource r WHERE r.entreprise = :entreprise " +
            "AND (r.owner.id = :userId OR :userId IN (SELECT u.id FROM r.sharedWith u) OR r.publicAccess = true)")
    List<SharedResource> findAccessible(Entreprise entreprise, Long userId);

    // Stats
    @Query("SELECT COALESCE(SUM(r.fileSize), 0) FROM SharedResource r " +
            "WHERE r.entreprise = :entreprise AND r.type = 'FILE'")
    Long getTotalStorage(Entreprise entreprise);

    Long countByEntrepriseAndType(Entreprise entreprise, SharedResource.ResourceType type);

    // ─── Comptes particulier — ressources personnelles, sans entreprise ──────

    List<SharedResource> findByOwnerAndEntrepriseIsNullAndParentIsNull(User owner);

    List<SharedResource> findByOwnerAndEntrepriseIsNullAndNameContainingIgnoreCase(User owner, String name);

    @Query("SELECT r FROM SharedResource r WHERE r.entreprise IS NULL " +
            "AND (r.owner.id = :userId OR :userId IN (SELECT u.id FROM r.sharedWith u) OR r.publicAccess = true)")
    List<SharedResource> findAccessibleForParticulier(Long userId);

    @Query("SELECT COALESCE(SUM(r.fileSize), 0) FROM SharedResource r " +
            "WHERE r.owner = :owner AND r.entreprise IS NULL AND r.type = 'FILE'")
    Long getTotalStorageForOwner(User owner);

    Long countByOwnerAndEntrepriseIsNullAndType(User owner, SharedResource.ResourceType type);
}