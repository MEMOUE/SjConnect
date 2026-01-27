package com.duniyabacker.front.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SharedResourceResponse {
    private Long id;
    private String name;
    private String type; // FOLDER ou FILE
    private String description;

    // Pour fichiers
    private String filePath;
    private Long fileSize;
    private String fileType;

    // Info propriétaire
    private Long ownerId;
    private String ownerName;

    // Info parent
    private Long parentId;
    private String parentName;

    private boolean publicAccess;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}