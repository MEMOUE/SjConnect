package com.duniyabacker.front.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeResponse {

    private Long id;
    private String prenom;
    private String nom;
    private String email;
    private String telephone;
    private String poste;
    private String departement;
    private String rolePlateforme;
    private String numeroMatricule;
    private String username;
    private boolean invitationAccepted;
    private boolean enabled;
    private LocalDateTime createdAt;
}