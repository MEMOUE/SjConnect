package com.duniyabacker.front.service;

import com.duniyabacker.front.dto.request.CreateMeetingRequest;
import com.duniyabacker.front.entity.User;
import com.duniyabacker.front.entity.meeting.Meeting;
import com.duniyabacker.front.entity.meeting.MeetingParticipant;
import com.duniyabacker.front.exception.CustomExceptions.*;
import com.duniyabacker.front.repository.MeetingRepository;
import com.duniyabacker.front.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class MeetingService {

    private final MeetingRepository meetingRepository;
    private final UserRepository    userRepository;

    // ── Lister les meetings de l'utilisateur connecté ───────────────────────
    @Transactional(readOnly = true)
    public List<Meeting> getMesMeetings() {
        User user = utilisateurConnecte();
        List<Meeting> meetings = meetingRepository.findAllForUser(user.getId());
        // Initialiser les champs transients pour la sérialisation
        meetings.forEach(m -> {
            m.initTransientFields();
            m.getParticipants().forEach(MeetingParticipant::initTransientFields);
        });
        return meetings;
    }

    // ── Créer un meeting ─────────────────────────────────────────────────────
    @Transactional
    public Meeting creerMeeting(CreateMeetingRequest req) {
        User organisateur = utilisateurConnecte();

        Meeting meeting = Meeting.builder()
                .titre(req.getTitre())
                .description(req.getDescription())
                .roomName(genererRoomName(req.getTitre()))
                .dateDebut(req.getDateDebut())
                .dateFin(req.getDateFin())
                .organisateur(organisateur)
                .build();

        // Statut automatique : si la réunion commence maintenant → EN_COURS
        if (req.getDateDebut().isBefore(LocalDateTime.now().plusMinutes(1))) {
            meeting.setStatut(Meeting.StatutMeeting.EN_COURS);
        }

        // Ajouter les participants invités
        if (req.getParticipantIds() != null) {
            req.getParticipantIds().forEach(uid ->
                    userRepository.findById(uid).ifPresent(u -> {
                        MeetingParticipant mp = MeetingParticipant.builder()
                                .meeting(meeting)
                                .user(u)
                                .statut(MeetingParticipant.StatutParticipant.INVITE)
                                .build();
                        meeting.getParticipants().add(mp);
                    })
            );
        }

        Meeting saved = meetingRepository.save(meeting);
        saved.initTransientFields();
        saved.getParticipants().forEach(MeetingParticipant::initTransientFields);

        log.info("Meeting créé '{}' par {}", saved.getTitre(), organisateur.getUsername());
        return saved;
    }

    // ── Terminer un meeting ──────────────────────────────────────────────────
    @Transactional
    public Meeting terminerMeeting(Long id) {
        Meeting meeting = meetingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Meeting introuvable"));
        meeting.setStatut(Meeting.StatutMeeting.TERMINE);
        Meeting saved = meetingRepository.save(meeting);
        saved.initTransientFields();
        return saved;
    }

    // ── Helpers ──────────────────────────────────────────────────────────────
    private User utilisateurConnecte() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
    }

    private String genererRoomName(String titre) {
        String slug = Normalizer.normalize(titre, Normalizer.Form.NFD)
                .replaceAll("[\\p{InCombiningDiacriticalMarks}]", "")
                .toLowerCase()
                .replaceAll("[^a-z0-9]", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
        if (slug.length() > 30) slug = slug.substring(0, 30);
        return slug + "-" + Long.toString(System.currentTimeMillis(), 36);
    }
}