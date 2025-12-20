package com.duniyabacker.front.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor; /**
 * DTO de réponse pour un participant
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
 public class ParticipantResponse {

    private Long id;
    private String username;
    private String email;
    private String name;
    private String avatar;
    private boolean isOnline;
    private String role;
}
