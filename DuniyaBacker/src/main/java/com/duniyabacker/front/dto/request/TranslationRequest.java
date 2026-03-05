package com.duniyabacker.front.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class TranslationRequest {

    @NotBlank(message = "Le texte à traduire est obligatoire")
    @Size(max = 5000, message = "Le texte ne peut pas dépasser 5000 caractères")
    private String text;

    @NotBlank(message = "La langue cible est obligatoire")
    @Size(min = 2, max = 10)
    private String targetLang;
}