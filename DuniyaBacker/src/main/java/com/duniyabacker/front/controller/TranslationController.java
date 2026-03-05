package com.duniyabacker.front.controller;

import com.duniyabacker.front.dto.request.TranslationRequest;
import com.duniyabacker.front.dto.response.TranslationResponse;
import com.duniyabacker.front.service.TranslationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/translate")
@RequiredArgsConstructor
@Tag(name = "Traduction", description = "API de traduction automatique des messages")
public class TranslationController {

    private final TranslationService translationService;

    /**
     * Traduit un texte vers la langue cible.
     * Requiert une authentification JWT (l'utilisateur doit être connecté).
     *
     * POST /api/translate
     * Body : { "text": "Hello world", "targetLang": "fr" }
     */
    @Operation(
            summary = "Traduire un texte",
            description = "Traduit un texte vers la langue cible. " +
                    "Utilise LibreTranslate (self-hosted) avec fallback sur MyMemory."
    )
    @PostMapping
    public ResponseEntity<TranslationResponse> translate(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody TranslationRequest request
    ) {
        String translated = translationService.translate(
                request.getText(),
                request.getTargetLang()
        );
        return ResponseEntity.ok(
                TranslationResponse.builder()
                        .originalText(request.getText())
                        .translatedText(translated)
                        .targetLang(request.getTargetLang())
                        .build()
        );
    }
}