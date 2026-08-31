package com.duniyabacker.front.controller;

import com.duniyabacker.front.dto.response.ApiResponse;
import com.duniyabacker.front.dto.request.CallInviteRequest;
import com.duniyabacker.front.dto.request.CreateMeetingRequest;
import com.duniyabacker.front.entity.meeting.Meeting;
import com.duniyabacker.front.service.MeetingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/meetings")
@RequiredArgsConstructor
@Tag(name = "Visioconférence", description = "Gestion des réunions en ligne (Jitsi Meet)")
public class MeetingController {

    private final MeetingService meetingService;

    /** GET /api/meetings — mes réunions */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Lister mes réunions")
    public ResponseEntity<List<Meeting>> getMesMeetings() {
        return ResponseEntity.ok(meetingService.getMesMeetings());
    }

    /** POST /api/meetings — créer une réunion */
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Créer une réunion")
    public ResponseEntity<Meeting> creerMeeting(@Valid @RequestBody CreateMeetingRequest req) {
        return ResponseEntity.ok(meetingService.creerMeeting(req));
    }

    /** PUT /api/meetings/{id}/terminer — clore une réunion */
    @PutMapping("/{id}/terminer")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Terminer une réunion")
    public ResponseEntity<Meeting> terminerMeeting(@PathVariable Long id) {
        return ResponseEntity.ok(meetingService.terminerMeeting(id));
    }

    /** POST /api/meetings/{id}/invite — inviter une personne par email à rejoindre une réunion */
    @PostMapping("/{id}/invite")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Inviter une personne par email à rejoindre une réunion")
    public ResponseEntity<ApiResponse<Void>> inviterParEmail(
            @PathVariable Long id, @Valid @RequestBody CallInviteRequest req) {
        meetingService.inviteToMeeting(id, req.getEmail(), req.getCallLink());
        return ResponseEntity.ok(ApiResponse.success("Invitation envoyée à " + req.getEmail()));
    }
}