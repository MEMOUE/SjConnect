package com.duniyabacker.Front.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Value("${server.port:8080}")
    private String serverPort;

    @Bean
    public OpenAPI customOpenAPI() {
        final String securitySchemeName = "bearerAuth";

        return new OpenAPI()
                .info(new Info()
                        .title("DouniyaConnect API")
                        .version("1.0.0")
                        .description("""
                                API REST pour la plateforme DouniyaConnect.
                                
                                ## Fonctionnalités principales
                                
                                - **Authentification** : Inscription, connexion, vérification email, réinitialisation mot de passe
                                - **Gestion Entreprises** : Inscription et gestion du compte entreprise
                                - **Gestion Particuliers** : Inscription et gestion du compte individuel
                                - **Gestion Employés** : Création, modification, suppression des employés par l'entreprise
                                
                                ## Authentification
                                
                                L'API utilise JWT (JSON Web Token) pour l'authentification. 
                                Pour accéder aux endpoints protégés :
                                
                                1. Connectez-vous via `/api/auth/login`
                                2. Récupérez le `accessToken` de la réponse
                                3. Cliquez sur le bouton **Authorize** et entrez : `Bearer {votre_token}`
                                
                                ## Codes de réponse
                                
                                - `200` : Succès
                                - `201` : Ressource créée
                                - `400` : Requête invalide
                                - `401` : Non authentifié
                                - `403` : Accès interdit
                                - `404` : Ressource non trouvée
                                - `409` : Conflit (ressource existante)
                                - `500` : Erreur serveur
                                """)
                        .contact(new Contact()
                                .name("DouniyaConnect Support")
                                .email("support@duniyaconnect.com")
                                .url("https://duniyaconnect.com"))
                        .license(new License()
                                .name("Propriétaire")
                                .url("https://duniyaconnect.com/license")))
                .servers(List.of(
                        new Server()
                                .url("http://localhost:" + serverPort)
                                .description("Serveur de développement"),
                        new Server()
                                .url("https://api.duniyaconnect.com")
                                .description("Serveur de production")
                ))
                .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
                .components(new Components()
                        .addSecuritySchemes(securitySchemeName,
                                new SecurityScheme()
                                        .name(securitySchemeName)
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("Entrez le token JWT obtenu lors de la connexion")));
    }
}