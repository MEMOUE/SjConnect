package com.duniyabacker.front.controller;

import com.duniyabacker.front.dto.request.TtsRequest;
import com.duniyabacker.front.dto.response.TtsResponse;
import com.duniyabacker.front.service.TextToSpeechService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tts")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Synthèse vocale", description = "Lecture à voix haute des sous-titres traduits (Google Cloud Text-to-Speech)")
public class TtsController {

    private final TextToSpeechService ttsService;

    /**
     * POST /api/tts
     * Body : { "text": "Bonjour", "lang": "fr" } → { "audioContent": "<mp3 base64>", "lang": "fr" }
     */
    @Operation(summary = "Synthétiser un texte en audio MP3")
    @PostMapping
    public ResponseEntity<TtsResponse> synthesize(@Valid @RequestBody TtsRequest request) {
        if (!ttsService.isConfigured()) {
            // 503 : le frontend retombe sur la synthèse vocale du navigateur.
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build();
        }
        if (!ttsService.isSupported(request.getLang())) {
            return ResponseEntity.badRequest().build();
        }
        try {
            return ResponseEntity.ok(TtsResponse.builder()
                    .audioContent(ttsService.synthesize(request.getText(), request.getLang()))
                    .lang(request.getLang())
                    .build());
        } catch (Exception e) {
            log.warn("[TTS] Google Text-to-Speech KO : {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).build();
        }
    }
}
