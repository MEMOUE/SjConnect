package com.duniyabacker.front.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CallStartedRequest {

    @NotBlank(message = "Le lien de l'appel est requis")
    private String callLink;

    @NotBlank(message = "Le type d'appel est requis")
    private String callType;
}
