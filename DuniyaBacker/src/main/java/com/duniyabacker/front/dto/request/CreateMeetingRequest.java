package com.duniyabacker.front.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class CreateMeetingRequest {

    @NotBlank(message = "Le titre est requis")
    private String titre;

    private String description;

    @NotNull(message = "La date de début est requise")
    private LocalDateTime dateDebut;

    private LocalDateTime dateFin;

    /** IDs des utilisateurs à inviter (optionnel) */
    private List<Long> participantIds;
}