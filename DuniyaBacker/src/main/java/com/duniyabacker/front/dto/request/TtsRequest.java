package com.duniyabacker.front.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class TtsRequest {

    @NotBlank(message = "Le texte à lire est obligatoire")
    @Size(max = 500, message = "Le texte ne peut pas dépasser 500 caractères")
    private String text;

    @NotBlank(message = "La langue est obligatoire")
    @Size(min = 2, max = 10)
    private String lang;
}
