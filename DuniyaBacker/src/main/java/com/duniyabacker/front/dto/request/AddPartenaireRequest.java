package com.duniyabacker.front.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AddPartenaireRequest {

    private Long userId;      // Mode 1 : employé interne
    private String email;     // Mode 2 : externe par email
    private String nom;       // Mode 3 : saisie manuelle
    private String role;
    private String logo;
}