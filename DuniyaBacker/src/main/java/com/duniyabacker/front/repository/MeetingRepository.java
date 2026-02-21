package com.duniyabacker.front.repository;

import com.duniyabacker.front.entity.meeting.Meeting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MeetingRepository extends JpaRepository<Meeting, Long> {

    /** Tous les meetings où l'utilisateur est organisateur OU participant */
    @Query("""
        SELECT DISTINCT m FROM Meeting m
        LEFT JOIN m.participants p
        WHERE m.organisateur.id = :userId OR p.user.id = :userId
        ORDER BY m.dateDebut DESC
    """)
    List<Meeting> findAllForUser(@Param("userId") Long userId);

    Optional<Meeting> findByRoomName(String roomName);
}