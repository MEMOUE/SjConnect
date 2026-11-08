package com.duniyabacker.front.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TtsResponse {
    /** Audio MP3 encodé en base64. */
    private String audioContent;
    private String lang;
}
