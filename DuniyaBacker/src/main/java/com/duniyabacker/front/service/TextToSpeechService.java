package com.duniyabacker.front.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * Synthèse vocale via Google Cloud Text-to-Speech (REST).
 * La clé API reste côté serveur : le navigateur n'appelle jamais Google directement.
 */
@Service
@Slf4j
public class TextToSpeechService {

    private static final String URL = "https://texttospeech.googleapis.com/v1/text:synthesize";

    /** Langues de l'application (codes courts) → code de voix Google. */
    private static final Map<String, String> LANGUES = Map.of(
            "fr", "fr-FR",
            "en", "en-US",
            "ar", "ar-XA",
            "es", "es-ES",
            "de", "de-DE",
            "it", "it-IT",
            "tr", "tr-TR"
    );

    /** Clé API Google Cloud (API Text-to-Speech activée). Variable : GOOGLE_TTS_API_KEY. */
    @Value("${google.tts.api-key:}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    public boolean isSupported(String lang) {
        return LANGUES.containsKey(lang);
    }

    /** @return audio MP3 en base64 */
    @SuppressWarnings("unchecked")
    public String synthesize(String text, String lang) {
        Map<String, Object> body = Map.of(
                "input", Map.of("text", text),
                "voice", Map.of("languageCode", LANGUES.get(lang)),
                "audioConfig", Map.of("audioEncoding", "MP3")
        );
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        // En-tête plutôt que paramètre d'URL : la clé n'apparaît pas dans les logs d'accès.
        headers.set("X-Goog-Api-Key", apiKey);

        ResponseEntity<Map> response = restTemplate.postForEntity(URL, new HttpEntity<>(body, headers), Map.class);
        Object audio = response.getBody() != null ? response.getBody().get("audioContent") : null;
        if (audio == null) {
            throw new IllegalStateException("Réponse Google Text-to-Speech sans audio");
        }
        return audio.toString();
    }
}
