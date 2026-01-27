package com.duniyabacker.front.service;

import com.duniyabacker.front.dto.response.SharedResourceResponse;
import com.duniyabacker.front.entity.User;
import com.duniyabacker.front.entity.auth.*;
import com.duniyabacker.front.entity.shared.SharedResource;
import com.duniyabacker.front.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SharedSpaceService {

    private final SharedResourceRepository repo;
    private final UserRepository userRepo;

    @Value("${app.upload.dir:uploads/shared}")
    private String uploadDir;

    // Créer dossier
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

        SharedResource saved = repo.save(folder);
        return mapToResponse(saved);
    }

    // Upload fichier
    @Transactional
    public SharedResourceResponse uploadFile(String username, MultipartFile file, String desc, Long parentId) throws IOException {
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

        SharedResource saved = repo.save(resource);
        return mapToResponse(saved);
    }

    // Liste ressources
    public List<SharedResourceResponse> getRootResources(String username) {
        User user = getUser(username);
        return repo.findByEntrepriseAndParentIsNull(getEntreprise(user))
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<SharedResourceResponse> getChildren(Long parentId) {
        SharedResource parent = repo.findById(parentId).orElseThrow();
        return repo.findByParent(parent)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<SharedResourceResponse> search(String username, String query) {
        User user = getUser(username);
        return repo.findByEntrepriseAndNameContainingIgnoreCase(getEntreprise(user), query)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<SharedResourceResponse> getMyResources(String username) {
        User user = getUser(username);
        return repo.findAccessible(getEntreprise(user), user.getId())
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // Partager
    @Transactional
    public void shareWith(Long resourceId, List<Long> userIds) {
        SharedResource resource = repo.findById(resourceId).orElseThrow();
        List<User> users = userRepo.findAllById(userIds);
        resource.getSharedWith().addAll(users);
        repo.save(resource);
    }

    // Supprimer
    @Transactional
    public void delete(Long id) {
        repo.deleteById(id);
    }

    // Stats
    public Stats getStats(String username) {
        User user = getUser(username);
        Entreprise ent = getEntreprise(user);

        return new Stats(
                repo.countByEntrepriseAndType(ent, SharedResource.ResourceType.FOLDER),
                repo.countByEntrepriseAndType(ent, SharedResource.ResourceType.FILE),
                repo.getTotalStorage(ent)
        );
    }

    // Mapper entité -> DTO
    private SharedResourceResponse mapToResponse(SharedResource resource) {
        String ownerName = getUserDisplayName(resource.getOwner());

        return SharedResourceResponse.builder()
                .id(resource.getId())
                .name(resource.getName())
                .type(resource.getType().name())
                .description(resource.getDescription())
                .filePath(resource.getFilePath())
                .fileSize(resource.getFileSize())
                .fileType(resource.getFileType())
                .ownerId(resource.getOwner().getId())
                .ownerName(ownerName)
                .parentId(resource.getParent() != null ? resource.getParent().getId() : null)
                .parentName(resource.getParent() != null ? resource.getParent().getName() : null)
                .publicAccess(resource.isPublicAccess())
                .createdAt(resource.getCreatedAt())
                .updatedAt(resource.getUpdatedAt())
                .build();
    }

    // Helpers
    private User getUser(String username) {
        return userRepo.findByUsername(username).orElseThrow();
    }

    private Entreprise getEntreprise(User user) {
        if (user instanceof Entreprise) return (Entreprise) user;
        if (user instanceof Employe) return ((Employe) user).getEntreprise();
        throw new RuntimeException("Type utilisateur invalide");
    }

    private String getUserDisplayName(User user) {
        if (user instanceof Entreprise) {
            return ((Entreprise) user).getNomEntreprise();
        } else if (user instanceof Particulier) {
            Particulier p = (Particulier) user;
            return p.getPrenom() + " " + p.getNom();
        } else if (user instanceof Employe) {
            Employe e = (Employe) user;
            return e.getPrenom() + " " + e.getNom();
        }
        return user.getUsername();
    }

    private String saveFile(MultipartFile file) throws IOException {
        Path path = Paths.get(uploadDir);
        Files.createDirectories(path);

        String filename = UUID.randomUUID() + "_" + file.getOriginalFilename();
        Files.copy(file.getInputStream(), path.resolve(filename));

        return filename;
    }

    public record Stats(long folders, long files, long storage) {}
}