package com.duniyabacker.front.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TranslationResponse {
    private String originalText;
    private String translatedText;
    private String targetLang;
}




