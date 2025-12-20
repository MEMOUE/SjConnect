package com.duniyabacker.front.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {

    @NotBlank(message = "L'identifiant est requis")
    private String identifier; // Email ou username

    @NotBlank(message = "Le mot de passe est requis")
    private String password;

    private String accountType; // entreprise ou individuel

    private boolean rememberMe;
}