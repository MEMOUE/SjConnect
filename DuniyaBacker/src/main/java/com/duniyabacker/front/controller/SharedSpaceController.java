package com.duniyabacker.front.controller;

import com.duniyabacker.front.entity.shared.SharedResource;
import com.duniyabacker.front.service.SharedSpaceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/shared")
@RequiredArgsConstructor
public class SharedSpaceController {

    private final SharedSpaceService service;

    @PostMapping("/folder")
    public ResponseEntity<SharedResource> createFolder(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam String name,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) Long parentId) {
        return ResponseEntity.ok(service.createFolder(user.getUsername(), name, description, parentId));
    }

    @PostMapping("/file")
    public ResponseEntity<SharedResource> uploadFile(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam MultipartFile file,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) Long parentId) throws IOException {
        return ResponseEntity.ok(service.uploadFile(user.getUsername(), file, description, parentId));
    }

    @GetMapping("/root")
    public List<SharedResource> getRootResources(@AuthenticationPrincipal UserDetails user) {
        return service.getRootResources(user.getUsername());
    }

    @GetMapping("/{id}/children")
    public List<SharedResource> getChildren(@PathVariable Long id) {
        return service.getChildren(id);
    }

    @GetMapping("/search")
    public List<SharedResource> search(@AuthenticationPrincipal UserDetails user, @RequestParam String q) {
        return service.search(user.getUsername(), q);
    }

    @GetMapping("/my")
    public List<SharedResource> getMyResources(@AuthenticationPrincipal UserDetails user) {
        return service.getMyResources(user.getUsername());
    }

    @PostMapping("/{id}/share")
    public ResponseEntity<Void> share(@PathVariable Long id, @RequestBody List<Long> userIds) {
        service.shareWith(id, userIds);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/stats")
    public SharedSpaceService.Stats getStats(@AuthenticationPrincipal UserDetails user) {
        return service.getStats(user.getUsername());
    }
}