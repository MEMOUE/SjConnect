package com.duniyabacker.front.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "users")
@Inheritance(strategy = InheritanceType.JOINED)
@Getter
@Setter
@ToString(exclude = {"password", "verificationToken", "resetPasswordToken"})
@NoArgsConstructor
@AllArgsConstructor
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String telephone;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @Column(name = "accept_terms", nullable = false)
    private boolean acceptTerms = true;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Column(nullable = false)
    private boolean enabled = false;

    @Column(nullable = false)
    private boolean accountNonLocked = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "verification_token")
    private String verificationToken;

    @Column(name = "reset_password_token")
    private String resetPasswordToken;

    @Column(name = "reset_password_token_expiry")
    private LocalDateTime resetPasswordTokenExpiry;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (!isActive) {
            isActive = true;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // =========================================================================
    // FIX : equals/hashCode basés UNIQUEMENT sur l'id
    // Indispensable pour que Set<User> fonctionne avec les proxies Hibernate
    // =========================================================================

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null) return false;

        // Gérer les proxies Hibernate : comparer sur la classe de base
        Class<?> thisClass = org.hibernate.Hibernate.getClass(this);
        Class<?> otherClass = org.hibernate.Hibernate.getClass(o);
        if (thisClass != otherClass) return false;

        User user = (User) o;
        // Deux entités non persistées (id == null) ne sont jamais égales
        return id != null && id.equals(user.getId());
    }

    @Override
    public int hashCode() {
        // hashCode constant pour les entités JPA
        // (évite les problèmes quand l'id passe de null à une valeur après persist)
        return getClass().hashCode();
    }

    // =========================================================================
    // Spring Security
    // =========================================================================

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return accountNonLocked;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }
}