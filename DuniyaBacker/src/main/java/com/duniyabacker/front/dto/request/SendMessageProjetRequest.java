package com.duniyabacker.front.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SendMessageProjetRequest {

    @NotBlank(message = "Le contenu du message est requis")
    @Size(max = 5000, message = "Le message ne peut pas dépasser 5000 caractères")
    private String contenu;
}