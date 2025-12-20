package com.duniyabacker.front.service;

import com.duniyabacker.front.dto.request.AcceptInvitationRequest;
import com.duniyabacker.front.dto.request.CreateEmployeRequest;
import com.duniyabacker.front.dto.response.ApiResponse;
import com.duniyabacker.front.dto.response.EmployeResponse;
import com.duniyabacker.front.entity.Role;
import com.duniyabacker.front.entity.auth.Employe;
import com.duniyabacker.front.entity.auth.Entreprise;
import com.duniyabacker.front.exception.CustomExceptions.*;
import com.duniyabacker.front.repository.EmployeRepository;
import com.duniyabacker.front.repository.EntrepriseRepository;
import com.duniyabacker.front.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmployeService {

    private final EmployeRepository employeRepository;
    private final EntrepriseRepository entrepriseRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @Transactional
    public ApiResponse<EmployeResponse> createEmploye(String entrepriseUsername, CreateEmployeRequest request) {
        // Récupérer l'entreprise
        Entreprise entreprise = entrepriseRepository.findByUsername(entrepriseUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Entreprise non trouvée"));

        // Vérifier si l'email existe déjà
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ResourceAlreadyExistsException("Cette adresse email est déjà utilisée");
        }

        // Vérifier si l'employé existe déjà dans cette entreprise
        if (employeRepository.existsByEmailAndEntreprise(request.getEmail(), entreprise)) {
            throw new ResourceAlreadyExistsException("Un employé avec cet email existe déjà dans votre entreprise");
        }

        // Créer l'employé
        Employe employe = new Employe();
        employe.setPrenom(request.getPrenom());
        employe.setNom(request.getNom());
        employe.setEmail(request.getEmail());
        employe.setTelephone(request.getTelephone());
        employe.setPoste(request.getPoste());
        employe.setDepartement(request.getDepartement());
        employe.setRolePlateforme(request.getRole());
        employe.setNumeroMatricule(request.getNumeroMatricule());
        employe.setRole(Role.EMPLOYE);
        employe.setEntreprise(entreprise);
        employe.setEnabled(false);
        employe.setInvitationAccepted(false);

        // Générer un username temporaire unique
        String tempUsername = "emp_" + UUID.randomUUID().toString().substring(0, 8);
        employe.setUsername(tempUsername);

        // Mot de passe temporaire (sera changé par l'employé)
        employe.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));

        // Token d'invitation
        String invitationToken = UUID.randomUUID().toString();
        employe.setInvitationToken(invitationToken);

        employeRepository.save(employe);

        // Envoyer l'email d'invitation
        emailService.sendEmployeeInvitationEmail(
                request.getEmail(),
                request.getPrenom() + " " + request.getNom(),
                entreprise.getNomEntreprise(),
                invitationToken
        );

        log.info("Employé créé et invitation envoyée: {} {} pour {}",
                request.getPrenom(), request.getNom(), entreprise.getNomEntreprise());

        return ApiResponse.success(
                "Employé ajouté avec succès. Un email d'invitation lui a été envoyé.",
                mapToEmployeResponse(employe)
        );
    }

    @Transactional
    public ApiResponse<Void> acceptInvitation(AcceptInvitationRequest request) {
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("Les mots de passe ne correspondent pas");
        }

        // Trouver l'employé par token d'invitation
        Employe employe = employeRepository.findByInvitationToken(request.getInvitationToken())
                .orElseThrow(() -> new BadRequestException("Token d'invitation invalide"));

        if (employe.isInvitationAccepted()) {
            throw new BadRequestException("Cette invitation a déjà été acceptée");
        }

        // Vérifier si le username est disponible
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new ResourceAlreadyExistsException("Ce nom d'utilisateur est déjà utilisé");
        }

        // Mettre à jour l'employé
        employe.setUsername(request.getUsername());
        employe.setPassword(passwordEncoder.encode(request.getPassword()));
        employe.setEnabled(true);
        employe.setInvitationAccepted(true);
        employe.setInvitationToken(null);

        employeRepository.save(employe);

        log.info("Invitation acceptée par: {} {}", employe.getPrenom(), employe.getNom());

        return ApiResponse.success("Compte activé avec succès. Vous pouvez maintenant vous connecter.");
    }

    public Page<EmployeResponse> getEmployesByEntreprise(String entrepriseUsername, Pageable pageable) {
        Entreprise entreprise = entrepriseRepository.findByUsername(entrepriseUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Entreprise non trouvée"));

        return employeRepository.findByEntreprise(entreprise, pageable)
                .map(this::mapToEmployeResponse);
    }

    public List<EmployeResponse> getAllEmployesByEntreprise(String entrepriseUsername) {
        Entreprise entreprise = entrepriseRepository.findByUsername(entrepriseUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Entreprise non trouvée"));

        return employeRepository.findByEntreprise(entreprise).stream()
                .map(this::mapToEmployeResponse)
                .collect(Collectors.toList());
    }

    public EmployeResponse getEmployeById(String entrepriseUsername, Long employeId) {
        Entreprise entreprise = entrepriseRepository.findByUsername(entrepriseUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Entreprise non trouvée"));

        Employe employe = employeRepository.findById(employeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employé non trouvé"));

        // Vérifier que l'employé appartient à l'entreprise
        if (!employe.getEntreprise().getId().equals(entreprise.getId())) {
            throw new ForbiddenException("Cet employé n'appartient pas à votre entreprise");
        }

        return mapToEmployeResponse(employe);
    }

    @Transactional
    public ApiResponse<EmployeResponse> updateEmploye(String entrepriseUsername, Long employeId, CreateEmployeRequest request) {
        Entreprise entreprise = entrepriseRepository.findByUsername(entrepriseUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Entreprise non trouvée"));

        Employe employe = employeRepository.findById(employeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employé non trouvé"));

        // Vérifier que l'employé appartient à l'entreprise
        if (!employe.getEntreprise().getId().equals(entreprise.getId())) {
            throw new ForbiddenException("Cet employé n'appartient pas à votre entreprise");
        }

        // Mettre à jour les informations
        employe.setPrenom(request.getPrenom());
        employe.setNom(request.getNom());
        employe.setTelephone(request.getTelephone());
        employe.setPoste(request.getPoste());
        employe.setDepartement(request.getDepartement());
        employe.setRolePlateforme(request.getRole());
        employe.setNumeroMatricule(request.getNumeroMatricule());

        // Si l'email change et que l'invitation n'a pas été acceptée
        if (!employe.getEmail().equals(request.getEmail())) {
            if (employe.isInvitationAccepted()) {
                throw new BadRequestException("Impossible de changer l'email d'un employé qui a déjà accepté l'invitation");
            }

            if (userRepository.existsByEmail(request.getEmail())) {
                throw new ResourceAlreadyExistsException("Cette adresse email est déjà utilisée");
            }

            employe.setEmail(request.getEmail());

            // Renvoyer l'invitation
            String newToken = UUID.randomUUID().toString();
            employe.setInvitationToken(newToken);

            emailService.sendEmployeeInvitationEmail(
                    request.getEmail(),
                    request.getPrenom() + " " + request.getNom(),
                    entreprise.getNomEntreprise(),
                    newToken
            );
        }

        employeRepository.save(employe);

        log.info("Employé mis à jour: {} {}", employe.getPrenom(), employe.getNom());

        return ApiResponse.success("Employé mis à jour avec succès.", mapToEmployeResponse(employe));
    }

    @Transactional
    public ApiResponse<Void> deleteEmploye(String entrepriseUsername, Long employeId) {
        Entreprise entreprise = entrepriseRepository.findByUsername(entrepriseUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Entreprise non trouvée"));

        Employe employe = employeRepository.findById(employeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employé non trouvé"));

        // Vérifier que l'employé appartient à l'entreprise
        if (!employe.getEntreprise().getId().equals(entreprise.getId())) {
            throw new ForbiddenException("Cet employé n'appartient pas à votre entreprise");
        }

        employeRepository.delete(employe);

        log.info("Employé supprimé: {} {}", employe.getPrenom(), employe.getNom());

        return ApiResponse.success("Employé supprimé avec succès.");
    }

    @Transactional
    public ApiResponse<Void> resendInvitation(String entrepriseUsername, Long employeId) {
        Entreprise entreprise = entrepriseRepository.findByUsername(entrepriseUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Entreprise non trouvée"));

        Employe employe = employeRepository.findById(employeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employé non trouvé"));

        // Vérifier que l'employé appartient à l'entreprise
        if (!employe.getEntreprise().getId().equals(entreprise.getId())) {
            throw new ForbiddenException("Cet employé n'appartient pas à votre entreprise");
        }

        if (employe.isInvitationAccepted()) {
            throw new BadRequestException("Cet employé a déjà accepté l'invitation");
        }

        // Générer un nouveau token
        String newToken = UUID.randomUUID().toString();
        employe.setInvitationToken(newToken);
        employeRepository.save(employe);

        // Renvoyer l'invitation
        emailService.sendEmployeeInvitationEmail(
                employe.getEmail(),
                employe.getPrenom() + " " + employe.getNom(),
                entreprise.getNomEntreprise(),
                newToken
        );

        log.info("Invitation renvoyée à: {} {}", employe.getPrenom(), employe.getNom());

        return ApiResponse.success("Invitation renvoyée avec succès.");
    }

    public long getEmployeCount(String entrepriseUsername) {
        Entreprise entreprise = entrepriseRepository.findByUsername(entrepriseUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Entreprise non trouvée"));
        return employeRepository.countByEntreprise(entreprise);
    }

    private EmployeResponse mapToEmployeResponse(Employe employe) {
        return EmployeResponse.builder()
                .id(employe.getId())
                .prenom(employe.getPrenom())
                .nom(employe.getNom())
                .email(employe.getEmail())
                .telephone(employe.getTelephone())
                .poste(employe.getPoste())
                .departement(employe.getDepartement())
                .rolePlateforme(employe.getRolePlateforme())
                .numeroMatricule(employe.getNumeroMatricule())
                .username(employe.getUsername())
                .invitationAccepted(employe.isInvitationAccepted())
                .enabled(employe.isEnabled())
                .createdAt(employe.getCreatedAt())
                .build();
    }
}