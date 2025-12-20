package com.duniyabacker.front.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PasswordResetRequest {

    @NotBlank(message = "L'email est requis")
    @Email(message = "L'email doit être valide")
    private String email;
}