package com.duniyabacker.front.service;

import com.duniyabacker.front.dto.response.SharedResourceResponse;
import com.duniyabacker.front.entity.User;
import com.duniyabacker.front.entity.auth.*;
import com.duniyabacker.front.entity.shared.SharedResource;
import com.duniyabacker.front.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SharedSpaceService {

    private final SharedResourceRepository repo;
    private final UserRepository userRepo;
    private final EmployeRepository employeRepo;

    @Value("${app.upload.dir:uploads/shared}")
    private String uploadDir;

    // =========================================================================
    // CRUD
    // =========================================================================

    @Transactional
    public SharedResourceResponse createFolder(String username, String name, String desc, Long parentId) {
        User user = getUser(username);
        Entreprise entreprise = getEntreprise(user);

        SharedResource folder = SharedResource.builder()
                .name(name)
                .description(desc)
                .type(SharedResource.ResourceType.FOLDER)
                .owner(user)
                .entreprise(entreprise)
                .parent(parentId != null ? repo.findById(parentId).orElse(null) : null)
                .build();

        return mapToResponse(repo.save(folder));
    }

    @Transactional
    public SharedResourceResponse uploadFile(String username, MultipartFile file,
                                             String desc, Long parentId) throws IOException {
        User user = getUser(username);
        Entreprise entreprise = getEntreprise(user);

        String filename = saveFile(file);

        SharedResource resource = SharedResource.builder()
                .name(file.getOriginalFilename())
                .description(desc)
                .type(SharedResource.ResourceType.FILE)
                .filePath(filename)
                .fileSize(file.getSize())
                .fileType(file.getContentType())
                .owner(user)
                .entreprise(entreprise)
                .parent(parentId != null ? repo.findById(parentId).orElse(null) : null)
                .build();

        return mapToResponse(repo.save(resource));
    }

    public List<SharedResourceResponse> getRootResources(String username) {
        User user = getUser(username);
        return repo.findByEntrepriseAndParentIsNull(getEntreprise(user))
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public List<SharedResourceResponse> getChildren(Long parentId) {
        SharedResource parent = repo.findById(parentId)
                .orElseThrow(() -> new RuntimeException("Dossier non trouvé"));
        return repo.findByParent(parent)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public List<SharedResourceResponse> search(String username, String query) {
        User user = getUser(username);
        return repo.findByEntrepriseAndNameContainingIgnoreCase(getEntreprise(user), query)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public List<SharedResourceResponse> getMyResources(String username) {
        User user = getUser(username);
        return repo.findAccessible(getEntreprise(user), user.getId())
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional
    public void delete(Long id) {
        repo.deleteById(id);
    }

    public SharedResourceResponse getResourceById(Long id) {
        SharedResource resource = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Ressource non trouvée"));
        return mapToResponse(resource);
    }

    // =========================================================================
    // PARTAGE
    // =========================================================================

    @Transactional
    public void shareWith(Long resourceId, List<Long> userIds) {
        SharedResource resource = repo.findById(resourceId)
                .orElseThrow(() -> new RuntimeException("Ressource non trouvée"));

        List<User> users = userRepo.findAllById(userIds);

        // Éviter les doublons
        Set<Long> existingIds = resource.getSharedWith().stream()
                .map(User::getId).collect(Collectors.toSet());

        users.stream()
                .filter(u -> !existingIds.contains(u.getId()))
                .forEach(u -> resource.getSharedWith().add(u));

        repo.save(resource);
        log.info("Ressource {} partagée avec {} utilisateur(s)", resourceId, users.size());
    }

    @Transactional
    public void unshareWith(Long resourceId, Long userId) {
        SharedResource resource = repo.findById(resourceId)
                .orElseThrow(() -> new RuntimeException("Ressource non trouvée"));
        resource.getSharedWith().removeIf(u -> u.getId().equals(userId));
        repo.save(resource);
        log.info("Partage retiré pour utilisateur {} sur ressource {}", userId, resourceId);
    }

    @Transactional
    public void setPublicAccess(Long resourceId, boolean isPublic) {
        SharedResource resource = repo.findById(resourceId)
                .orElseThrow(() -> new RuntimeException("Ressource non trouvée"));
        resource.setPublicAccess(isPublic);
        repo.save(resource);
    }

    public List<Map<String, Object>> getSharedWith(Long resourceId) {
        SharedResource resource = repo.findById(resourceId)
                .orElseThrow(() -> new RuntimeException("Ressource non trouvée"));

        return resource.getSharedWith().stream().map(u -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", u.getId());
            map.put("name", getUserDisplayName(u));
            map.put("email", u.getEmail());
            map.put("role", u.getRole().name());
            return map;
        }).collect(Collectors.toList());
    }

    // =========================================================================
    // RENOMMER
    // =========================================================================

    @Transactional
    public SharedResourceResponse rename(Long resourceId, String newName) {
        SharedResource resource = repo.findById(resourceId)
                .orElseThrow(() -> new RuntimeException("Ressource non trouvée"));
        resource.setName(newName.trim());
        return mapToResponse(repo.save(resource));
    }

    // =========================================================================
    // EMPLOYÉS POUR LE PARTAGE
    // =========================================================================

    public List<Map<String, Object>> getEmployeesForShare(String username) {
        User user = getUser(username);
        Entreprise entreprise = getEntreprise(user);

        List<Map<String, Object>> result = new ArrayList<>();

        // Ajouter le compte entreprise si l'utilisateur n'est pas l'entreprise
        if (!(user instanceof Entreprise)) {
            Map<String, Object> entMap = new LinkedHashMap<>();
            entMap.put("id", entreprise.getId());
            entMap.put("name", entreprise.getNomEntreprise());
            entMap.put("email", entreprise.getEmail());
            entMap.put("role", "ENTREPRISE");
            result.add(entMap);
        }

        // Ajouter les employés (sauf soi-même)
        employeRepo.findByEntreprise(entreprise).stream()
                .filter(e -> !e.getId().equals(user.getId()))
                .filter(User::isEnabled)
                .forEach(e -> {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("id", e.getId());
                    map.put("name", e.getPrenom() + " " + e.getNom());
                    map.put("email", e.getEmail());
                    map.put("poste", e.getPoste());
                    map.put("departement", e.getDepartement());
                    map.put("role", e.getRolePlateforme());
                    result.add(map);
                });

        return result;
    }

    // =========================================================================
    // STATS
    // =========================================================================

    public Stats getStats(String username) {
        User user = getUser(username);
        Entreprise ent = getEntreprise(user);
        return new Stats(
                repo.countByEntrepriseAndType(ent, SharedResource.ResourceType.FOLDER),
                repo.countByEntrepriseAndType(ent, SharedResource.ResourceType.FILE),
                repo.getTotalStorage(ent)
        );
    }

    public record Stats(long folders, long files, long storage) {}

    // =========================================================================
    // HELPERS
    // =========================================================================

    private SharedResourceResponse mapToResponse(SharedResource resource) {
        return SharedResourceResponse.builder()
                .id(resource.getId())
                .name(resource.getName())
                .type(resource.getType().name())
                .description(resource.getDescription())
                .filePath(resource.getFilePath())
                .fileSize(resource.getFileSize())
                .fileType(resource.getFileType())
                .ownerId(resource.getOwner().getId())
                .ownerName(getUserDisplayName(resource.getOwner()))
                .parentId(resource.getParent() != null ? resource.getParent().getId() : null)
                .parentName(resource.getParent() != null ? resource.getParent().getName() : null)
                .publicAccess(resource.isPublicAccess())
                .createdAt(resource.getCreatedAt())
                .updatedAt(resource.getUpdatedAt())
                .build();
    }

    private User getUser(String username) {
        return userRepo.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
    }

    private Entreprise getEntreprise(User user) {
        if (user instanceof Entreprise e) return e;
        if (user instanceof Employe e) return e.getEntreprise();
        throw new RuntimeException("Seuls les entreprises et employés ont accès à l'espace partagé");
    }

    private String getUserDisplayName(User user) {
        if (user instanceof Entreprise e) return e.getNomEntreprise();
        if (user instanceof Particulier p) return p.getPrenom() + " " + p.getNom();
        if (user instanceof Employe e) return e.getPrenom() + " " + e.getNom();
        return user.getUsername();
    }

    private String saveFile(MultipartFile file) throws IOException {
        Path path = Paths.get(uploadDir);
        Files.createDirectories(path);
        String filename = UUID.randomUUID() + "_" + file.getOriginalFilename();
        Files.copy(file.getInputStream(), path.resolve(filename));
        return filename;
    }
}