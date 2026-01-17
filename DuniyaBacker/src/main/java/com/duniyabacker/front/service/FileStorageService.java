package com.duniyabacker.front.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
@Slf4j
public class FileStorageService {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    /**
     * Sauvegarder un fichier uploadé
     */
    public String saveFile(MultipartFile file) throws IOException {
        // Créer le répertoire s'il n'existe pas
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        // Générer un nom de fichier unique
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String filename = UUID.randomUUID().toString() + extension;

        // Sauvegarder le fichier
        Path filePath = uploadPath.resolve(filename);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        log.info("Fichier sauvegardé: {}", filename);

        return filename;
    }

    /**
     * Obtenir l'URL publique du fichier
     */
    public String getFileUrl(String filename) {
        return "/uploads/" + filename;
    }

    /**
     * Supprimer un fichier
     */
    public void deleteFile(String filename) throws IOException {
        Path filePath = Paths.get(uploadDir).resolve(filename);
        Files.deleteIfExists(filePath);
        log.info("Fichier supprimé: {}", filename);
    }

    /**
     * Vérifier si un fichier est une image
     */
    public boolean isImage(String filename) {
        String extension = filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
        return extension.matches("jpg|jpeg|png|gif|webp|bmp|svg");
    }

    /**
     * Obtenir le type de fichier
     */
    public String getFileType(String filename) {
        if (isImage(filename)) {
            return "IMAGE";
        }

        String extension = filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();

        switch (extension) {
            case "pdf":
                return "FILE";
            case "doc":
            case "docx":
            case "xls":
            case "xlsx":
            case "ppt":
            case "pptx":
                return "FILE";
            case "mp4":
            case "avi":
            case "mov":
            case "wmv":
                return "VIDEO";
            case "mp3":
            case "wav":
            case "ogg":
                return "AUDIO";
            default:
                return "FILE";
        }
    }
}