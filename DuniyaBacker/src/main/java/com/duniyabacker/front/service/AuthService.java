package com.duniyabacker.front.service;

import com.duniyabacker.front.dto.request.*;
import com.duniyabacker.front.dto.response.*;
import com.duniyabacker.front.entity.*;
import com.duniyabacker.front.entity.auth.Employe;
import com.duniyabacker.front.entity.auth.Entreprise;
import com.duniyabacker.front.entity.auth.Particulier;
import com.duniyabacker.front.exception.CustomExceptions.*;
import com.duniyabacker.front.repository.*;
import com.duniyabacker.front.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final EntrepriseRepository entrepriseRepository;
    private final ParticulierRepository particulierRepository;
    private final EmployeRepository employeRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;

    public void validatePasswordConfirmation(String passworde,  String confirmation) {
        if (!passworde.equals(confirmation)) {
            throw new BadRequestException("Les mots de passe ne correspondent pas");
        }

    }

    @Transactional
    public ApiResponse<Void> registerEntreprise(RegisterEntrepriseRequest request) {
        // Vérifications
        validatePasswordConfirmation(request.getPassword(), request.getConfirmPassword());
//        if (!request.getPassword().equals(request.getConfirmPassword())) {
//            throw new BadRequestException("Les mots de passe ne correspondent pas");
//        }

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new ResourceAlreadyExistsException("Ce nom d'utilisateur est déjà utilisé");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ResourceAlreadyExistsException("Cette adresse email est déjà utilisée");
        }

        // Création de l'entreprise
        Entreprise entreprise = new Entreprise();
        entreprise.setUsername(request.getUsername());
        entreprise.setEmail(request.getEmail());
        entreprise.setPassword(passwordEncoder.encode(request.getPassword()));
        entreprise.setTelephone(request.getTelephone());
        entreprise.setRole(Role.ENTREPRISE);
        entreprise.setNomEntreprise(request.getNomEntreprise());
        entreprise.setTypeEntreprise(request.getTypeEntreprise());
        entreprise.setSecteurActivite(request.getSecteurActivite());
        entreprise.setAdressePhysique(request.getAdressePhysique());
        entreprise.setNumeroRegistreCommerce(request.getNumeroRegistreCommerce());
        entreprise.setDescription(request.getDescription());
        entreprise.setSiteWeb(request.getSiteWeb());

        // Token de vérification
        String verificationToken = UUID.randomUUID().toString();
        entreprise.setVerificationToken(verificationToken);
        entreprise.setEnabled(false);

        entrepriseRepository.save(entreprise);

        // Envoyer l'email de vérification
        emailService.sendVerificationEmail(request.getEmail(), verificationToken);

        log.info("Entreprise enregistrée avec succès: {}", request.getNomEntreprise());

        return ApiResponse.success("Compte entreprise créé avec succès. Veuillez vérifier votre email.");
    }

    @Transactional
    public ApiResponse<Void> registerParticulier(RegisterParticulierRequest request) {
        // Vérifications
        validatePasswordConfirmation(request.getPassword(), request.getConfirmPassword());
//        if (!request.getPassword().equals(request.getConfirmPassword())) {
//            throw new BadRequestException("Les mots de passe ne correspondent pas");
//        }

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new ResourceAlreadyExistsException("Ce nom d'utilisateur est déjà utilisé");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ResourceAlreadyExistsException("Cette adresse email est déjà utilisée");
        }

        // Création du particulier
        Particulier particulier = new Particulier();
        particulier.setUsername(request.getUsername());
        particulier.setEmail(request.getEmail());
        particulier.setPassword(passwordEncoder.encode(request.getPassword()));
        particulier.setTelephone(request.getTelephone());
        particulier.setRole(Role.PARTICULIER);
        particulier.setPrenom(request.getPrenom());
        particulier.setNom(request.getNom());
        particulier.setGenre(request.getGenre());
        particulier.setDateNaissance(request.getDateNaissance());
        particulier.setSecteurActivite(request.getSecteurActivite());
        particulier.setPosteActuel(request.getPosteActuel());
        particulier.setNewsletter(request.isNewsletter());

        // Token de vérification
        String verificationToken = UUID.randomUUID().toString();
        particulier.setVerificationToken(verificationToken);
        particulier.setEnabled(false);

        particulierRepository.save(particulier);

        // Envoyer l'email de vérification
        emailService.sendVerificationEmail(request.getEmail(), verificationToken);

        log.info("Particulier enregistré avec succès: {} {}", request.getPrenom(), request.getNom());

        return ApiResponse.success("Compte individuel créé avec succès. Veuillez vérifier votre email.");
    }

    public AuthResponse login(LoginRequest request) {
        // Authentification
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getIdentifier(),
                        request.getPassword()
                )
        );

        User user = userRepository.findByUsernameOrEmail(request.getIdentifier(), request.getIdentifier())
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));

        // Générer les tokens
        String accessToken = jwtService.generateToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        log.info("Connexion réussie pour: {}", user.getUsername());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtService.getExpirationTime())
                .user(mapToUserResponse(user))
                .build();
    }

    @Transactional
    public ApiResponse<Void> verifyEmail(String token) {
        User user = userRepository.findByVerificationToken(token)
                .orElseThrow(() -> new BadRequestException("Token de vérification invalide"));

        user.setEnabled(true);
        user.setVerificationToken(null);
        userRepository.save(user);

        log.info("Email vérifié pour: {}", user.getUsername());

        return ApiResponse.success("Email vérifié avec succès. Vous pouvez maintenant vous connecter.");
    }

    @Transactional
    public ApiResponse<Void> requestPasswordReset(PasswordResetRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("Aucun compte associé à cette adresse email"));

        String resetToken = UUID.randomUUID().toString();
        user.setResetPasswordToken(resetToken);
        user.setResetPasswordTokenExpiry(LocalDateTime.now().plusHours(1));
        userRepository.save(user);

        emailService.sendPasswordResetEmail(request.getEmail(), resetToken);

        log.info("Demande de réinitialisation de mot de passe pour: {}", request.getEmail());

        return ApiResponse.success("Un email de réinitialisation a été envoyé.");
    }

    @Transactional
    public ApiResponse<Void> resetPassword(NewPasswordRequest request) {
        validatePasswordConfirmation(request.getPassword(), request.getConfirmPassword());
//        if (!request.getPassword().equals(request.getConfirmPassword())) {
//            throw new BadRequestException("Les mots de passe ne correspondent pas");
//        }

        User user = userRepository.findByResetPasswordToken(request.getToken())
                .orElseThrow(() -> new BadRequestException("Token de réinitialisation invalide"));

        if (user.getResetPasswordTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Le token de réinitialisation a expiré");
        }

        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setResetPasswordToken(null);
        user.setResetPasswordTokenExpiry(null);
        userRepository.save(user);

        log.info("Mot de passe réinitialisé pour: {}", user.getUsername());

        return ApiResponse.success("Mot de passe réinitialisé avec succès.");
    }

    public AuthResponse refreshToken(String refreshToken) {
        String username = jwtService.extractUsername(refreshToken);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));

        if (!jwtService.isTokenValid(refreshToken, user)) {
            throw new UnauthorizedException("Token de rafraîchissement invalide");
        }

        String newAccessToken = jwtService.generateToken(user);

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtService.getExpirationTime())
                .user(mapToUserResponse(user))
                .build();
    }

    public UserResponse getCurrentUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));
        return mapToUserResponse(user);
    }

    private UserResponse mapToUserResponse(User user) {
        UserResponse.UserResponseBuilder builder = UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .telephone(user.getTelephone())
                .role(user.getRole().name())
                .createdAt(user.getCreatedAt());

        if (user instanceof Entreprise entreprise) {
            builder.nomEntreprise(entreprise.getNomEntreprise())
                    .typeEntreprise(entreprise.getTypeEntreprise())
                    .secteurActivite(entreprise.getSecteurActivite());
        } else if (user instanceof Particulier particulier) {
            builder.prenom(particulier.getPrenom())
                    .nom(particulier.getNom())
                    .genre(particulier.getGenre())
                    .secteurActivite(particulier.getSecteurActivite());
        } else if (user instanceof Employe employe) {
            builder.prenom(employe.getPrenom())
                    .nom(employe.getNom())
                    .poste(employe.getPoste())
                    .departement(employe.getDepartement())
                    .entrepriseId(employe.getEntreprise().getId())
                    .entrepriseNom(employe.getEntreprise().getNomEntreprise());
        }

        return builder.build();
    }
}