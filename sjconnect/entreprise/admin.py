# entreprise/admin.py
from django.contrib import admin
from .models import Entreprise, Groupe, MembreGroupe, DemandeIntegration, Message, ConversationDirecte, ProfilUtilisateur


@admin.register(Entreprise)
class EntrepriseAdmin(admin.ModelAdmin):
    list_display = ['nom', 'email', 'est_active', 'date_creation']
    list_filter = ['est_active', 'date_creation']
    search_fields = ['nom', 'email']
    readonly_fields = ['date_creation']

    fieldsets = (
        ('Informations générales', {
            'fields': ('nom', 'email', 'description', 'createur')
        }),
        ('Statut', {
            'fields': ('est_active',)
        }),
        ('Métadonnées', {
            'fields': ('date_creation',),
            'classes': ('collapse',)
        })
    )


@admin.register(ProfilUtilisateur)
class ProfilUtilisateurAdmin(admin.ModelAdmin):
    list_display = ['user', 'entreprise', 'role', 'poste', 'est_actif', 'date_embauche']
    list_filter = ['role', 'est_actif', 'date_embauche', 'entreprise']
    search_fields = ['user__username', 'user__email', 'entreprise__nom', 'poste']
    readonly_fields = ['date_embauche']

    fieldsets = (
        ('Informations utilisateur', {
            'fields': ('user', 'entreprise')
        }),
        ('Profil professionnel', {
            'fields': ('role', 'poste')
        }),
        ('Statut', {
            'fields': ('est_actif',)
        }),
        ('Métadonnées', {
            'fields': ('date_embauche',),
            'classes': ('collapse',)
        })
    )


@admin.register(Groupe)
class GroupeAdmin(admin.ModelAdmin):
    list_display = ['nom', 'entreprise_proprietaire', 'est_public', 'date_creation']
    list_filter = ['est_public', 'date_creation', 'entreprise_proprietaire']
    search_fields = ['nom', 'entreprise_proprietaire__nom']
    readonly_fields = ['date_creation']

    fieldsets = (
        ('Informations du groupe', {
            'fields': ('nom', 'description', 'entreprise_proprietaire')
        }),
        ('Paramètres', {
            'fields': ('est_public',)
        }),
        ('Métadonnées', {
            'fields': ('date_creation',),
            'classes': ('collapse',)
        })
    )


@admin.register(MembreGroupe)
class MembreGroupeAdmin(admin.ModelAdmin):
    list_display = ['utilisateur', 'groupe', 'statut', 'date_ajout']
    list_filter = ['statut', 'date_ajout']
    search_fields = ['utilisateur__username', 'utilisateur__email', 'groupe__nom']
    readonly_fields = ['date_ajout']

    fieldsets = (
        ('Relation', {
            'fields': ('utilisateur', 'groupe', 'statut')
        }),
        ('Métadonnées', {
            'fields': ('ajoute_par', 'date_ajout'),
            'classes': ('collapse',)
        })
    )


@admin.register(DemandeIntegration)
class DemandeIntegrationAdmin(admin.ModelAdmin):
    list_display = ['entreprise_demandeur', 'groupe_cible', 'statut', 'date_demande']
    list_filter = ['statut', 'date_demande']
    search_fields = ['entreprise_demandeur__nom', 'groupe_cible__nom']
    readonly_fields = ['date_demande', 'date_reponse']

    fieldsets = (
        ('Demande', {
            'fields': ('entreprise_demandeur', 'groupe_cible', 'message_demande')
        }),
        ('Traitement', {
            'fields': ('statut', 'reponse_par')
        }),
        ('Métadonnées', {
            'fields': ('date_demande', 'date_reponse'),
            'classes': ('collapse',)
        })
    )


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['expediteur', 'get_destinataire_ou_groupe', 'type_message', 'date_envoi', 'est_lu']
    list_filter = ['type_message', 'date_envoi', 'est_lu']
    search_fields = ['expediteur__username', 'expediteur__email', 'contenu']
    readonly_fields = ['date_envoi', 'date_modification']

    def get_destinataire_ou_groupe(self, obj):
        if obj.type_message == 'DIRECT':
            return f"→ {obj.destinataire.username}"
        else:
            return f"Groupe: {obj.groupe.nom}"
    get_destinataire_ou_groupe.short_description = 'Destinataire/Groupe'

    fieldsets = (
        ('Message', {
            'fields': ('expediteur', 'contenu', 'type_message')
        }),
        ('Destination', {
            'fields': ('groupe', 'destinataire')
        }),
        ('Statut', {
            'fields': ('est_lu', 'est_modifie')
        }),
        ('Métadonnées', {
            'fields': ('date_envoi', 'date_modification'),
            'classes': ('collapse',)
        })
    )


@admin.register(ConversationDirecte)
class ConversationDirecteAdmin(admin.ModelAdmin):
    list_display = ['utilisateur1', 'utilisateur2', 'date_creation', 'derniere_activite']
    list_filter = ['date_creation', 'derniere_activite']
    search_fields = ['utilisateur1__username', 'utilisateur2__username', 'utilisateur1__email', 'utilisateur2__email']
    readonly_fields = ['date_creation', 'derniere_activite']

    fieldsets = (
        ('Participants', {
            'fields': ('utilisateur1', 'utilisateur2')
        }),
        ('Métadonnées', {
            'fields': ('date_creation', 'derniere_activite'),
            'classes': ('collapse',)
        })
    )