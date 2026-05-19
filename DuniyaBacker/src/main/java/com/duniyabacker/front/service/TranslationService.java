package com.duniyabacker.front.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class TranslationService {

    /**
     * URL de l'instance LibreTranslate.
     * Laisser vide pour utiliser uniquement MyMemory.
     *
     * Exemple dans application.properties :
     *   translation.libretranslate.url=http://localhost:5000
     *
     * Ou via variable d'environnement :
     *   TRANSLATION_LIBRETRANSLATE_URL=http://localhost:5000
     */
    @Value("${translation.libretranslate.url:}")
    private String libreTranslateUrl;

    /**
     * Clé API LibreTranslate (optionnelle).
     * Laisser vide si l'instance ne l'exige pas.
     *
     *   translation.libretranslate.api-key=
     */
    @Value("${translation.libretranslate.api-key:}")
    private String libreTranslateApiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    // ── API publique ──────────────────────────────────────────────────────────

    /**
     * Traduit un texte vers la langue cible.
     *
     * Stratégie :
     *  1. LibreTranslate self-hosted (si translation.libretranslate.url est défini)
     *  2. Fallback automatique → MyMemory (gratuit, sans clé)
     *
     * @param text       Texte à traduire
     * @param targetLang Code ISO de la langue cible (ex : "fr", "en", "ar")
     * @return           Texte traduit, ou texte original en cas d'échec total
     */
    public String translate(String text, String targetLang) {

        if (text == null || text.isBlank() || "original".equals(targetLang)) {
            return text;
        }

        // Nettoyage du texte
        text = text.trim();

        try {

            // Détection de langue
            String detectedLang = detectLanguage(text);

            log.info("[Translation] Langue détectée : {}", detectedLang);

            // IMPORTANT :
            // Si le texte est déjà dans la langue cible
            // on ne traduit pas
            if (detectedLang != null &&
                    detectedLang.equalsIgnoreCase(targetLang)) {

                log.info("[Translation] Même langue, traduction ignorée");
                return text;
            }

        } catch (Exception e) {
            log.warn("[Translation] Impossible de détecter la langue : {}", e.getMessage());
        }

        // 1. LibreTranslate
        if (libreTranslateUrl != null && !libreTranslateUrl.isBlank()) {
            try {

                String result = callLibreTranslate(text, targetLang);

                if (result != null && !result.isBlank()) {
                    return result;
                }

            } catch (Exception e) {
                log.warn("[Translation] LibreTranslate KO : {}", e.getMessage());
            }
        }

        // 2. Fallback MyMemory
        try {
            return callMyMemory(text, targetLang);

        } catch (Exception e) {

            log.error("[Translation] MyMemory KO : {}", e.getMessage());

            return text;
        }
    }


    private String detectLanguage(String text) {

        // Si LibreTranslate disponible
        if (libreTranslateUrl != null && !libreTranslateUrl.isBlank()) {

            try {

                String url = libreTranslateUrl + "/detect";

                Map<String, String> body = new HashMap<>();
                body.put("q", text);

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);

                HttpEntity<Map<String, String>> entity =
                        new HttpEntity<>(body, headers);

                ResponseEntity<Object[]> response =
                        restTemplate.postForEntity(url, entity, Object[].class);

                if (response.getBody() != null &&
                        response.getBody().length > 0) {

                    Object first = response.getBody()[0];

                    if (first instanceof Map<?, ?> map) {

                        Object lang = map.get("language");

                        if (lang != null) {
                            return lang.toString();
                        }
                    }
                }

            } catch (Exception e) {
                log.warn("[Translation] Detect LibreTranslate KO");
            }
        }

        // Fallback simple
        return "unknown";
    }

    // ── Backends privés ───────────────────────────────────────────────────────

    /**
     * Appel à l'instance LibreTranslate self-hosted.
     * POST {libreTranslateUrl}/translate
     */
    private String callLibreTranslate(String text, String targetLang) {
        String url = libreTranslateUrl + "/translate";

        Map<String, String> body = new HashMap<>();
        body.put("q",      text);
        body.put("source", "auto");
        body.put("target", targetLang);
        body.put("format", "text");
        if (libreTranslateApiKey != null && !libreTranslateApiKey.isBlank()) {
            body.put("api_key", libreTranslateApiKey);
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, String>> entity = new HttpEntity<>(body, headers);

        ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            Object translated = response.getBody().get("translatedText");
            return translated != null ? translated.toString() : text;
        }
        return text;
    }

    /**
     * Appel à l'API MyMemory (gratuite, sans clé).
     * GET https://api.mymemory.translated.net/get?q=...&langpair=auto|fr
     */
    private String callMyMemory(String text, String targetLang) {
        String url = UriComponentsBuilder
                .fromHttpUrl("https://api.mymemory.translated.net/get")
                .queryParam("q", text)
                .queryParam("langpair", "auto|" + targetLang)
                .toUriString();

        ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            Object responseData = response.getBody().get("responseData");
            if (responseData instanceof Map<?, ?> dataMap) {
                Object translated = dataMap.get("translatedText");
                return translated != null ? translated.toString() : text;
            }
        }
        return text;
    }
}