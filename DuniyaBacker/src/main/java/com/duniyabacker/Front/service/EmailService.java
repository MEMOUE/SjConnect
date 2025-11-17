package com.duniyabacker.Front.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Async
    public void sendVerificationEmail(String toEmail, String token) {
        String subject = "DouniyaConnect - Vérification de votre compte";
        String verificationLink = frontendUrl + "/verify-email?token=" + token;

        String content = """
            <html>
            <body style="font-family: Arial, sans-serif;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #2563eb;">Bienvenue sur DouniyaConnect !</h2>
                    <p>Merci de vous être inscrit sur notre plateforme.</p>
                    <p>Veuillez cliquer sur le bouton ci-dessous pour vérifier votre adresse email :</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="%s" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
                            Vérifier mon email
                        </a>
                    </div>
                    <p>Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :</p>
                    <p style="color: #6b7280; word-break: break-all;">%s</p>
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                    <p style="color: #9ca3af; font-size: 12px;">
                        Si vous n'avez pas créé de compte sur DouniyaConnect, ignorez cet email.
                    </p>
                </div>
            </body>
            </html>
            """.formatted(verificationLink, verificationLink);

        sendHtmlEmail(toEmail, subject, content);
    }

    @Async
    public void sendPasswordResetEmail(String toEmail, String token) {
        String subject = "DouniyaConnect - Réinitialisation de mot de passe";
        String resetLink = frontendUrl + "/reset-password?token=" + token;

        String content = """
            <html>
            <body style="font-family: Arial, sans-serif;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #2563eb;">Réinitialisation de mot de passe</h2>
                    <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
                    <p>Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe :</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="%s" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
                            Réinitialiser mon mot de passe
                        </a>
                    </div>
                    <p>Ce lien expire dans 1 heure.</p>
                    <p>Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :</p>
                    <p style="color: #6b7280; word-break: break-all;">%s</p>
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                    <p style="color: #9ca3af; font-size: 12px;">
                        Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
                    </p>
                </div>
            </body>
            </html>
            """.formatted(resetLink, resetLink);

        sendHtmlEmail(toEmail, subject, content);
    }

    @Async
    public void sendEmployeeInvitationEmail(String toEmail, String employeeName, String entrepriseName, String token) {
        String subject = "DouniyaConnect - Invitation à rejoindre " + entrepriseName;
        String invitationLink = frontendUrl + "/accept-invitation?token=" + token;

        String content = """
            <html>
            <body style="font-family: Arial, sans-serif;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #7c3aed;">Invitation à rejoindre %s</h2>
                    <p>Bonjour %s,</p>
                    <p>Vous avez été invité(e) à rejoindre <strong>%s</strong> sur DouniyaConnect.</p>
                    <p>Cliquez sur le bouton ci-dessous pour créer votre compte et accéder à la plateforme :</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="%s" style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
                            Accepter l'invitation
                        </a>
                    </div>
                    <p>Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :</p>
                    <p style="color: #6b7280; word-break: break-all;">%s</p>
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                    <p style="color: #9ca3af; font-size: 12px;">
                        Si vous ne reconnaissez pas cette invitation, ignorez cet email.
                    </p>
                </div>
            </body>
            </html>
            """.formatted(entrepriseName, employeeName, entrepriseName, invitationLink, invitationLink);

        sendHtmlEmail(toEmail, subject, content);
    }

    private void sendHtmlEmail(String to, String subject, String htmlContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Email envoyé avec succès à: {}", to);
        } catch (MessagingException e) {
            log.error("Erreur lors de l'envoi de l'email à {}: {}", to, e.getMessage());
        }
    }
}