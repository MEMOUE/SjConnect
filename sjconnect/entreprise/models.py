from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class Entreprise(models.Model):
    """Modèle représentant une entreprise"""
    nom = models.CharField(max_length=200, unique=True)
    email = models.EmailField(unique=True)
    description = models.TextField(blank=True, null=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    est_active = models.BooleanField(default=True)
    
    def __str__(self):
        return self.nom
    
    class Meta:
        verbose_name = "Entreprise"
        verbose_name_plural = "Entreprises"


class Groupe(models.Model):
    """Modèle représentant un groupe de chat d'entreprise"""
    nom = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    entreprise_proprietaire = models.ForeignKey(
        Entreprise, 
        on_delete=models.CASCADE, 
        related_name='groupes_possedes'
    )
    date_creation = models.DateTimeField(auto_now_add=True)
    est_public = models.BooleanField(default=False)  # Si le groupe accepte les demandes d'intégration
    
    def __str__(self):
        return f"{self.nom} - {self.entreprise_proprietaire.nom}"
    
    class Meta:
        verbose_name = "Groupe"
        verbose_name_plural = "Groupes"
        unique_together = ['nom', 'entreprise_proprietaire']


class MembreGroupe(models.Model):
    """Relation entre une entreprise et un groupe (appartenance)"""
    STATUT_CHOICES = [
        ('PROPRIETAIRE', 'Propriétaire'),
        ('MEMBRE', 'Membre'),
        ('INVITE', 'Invité'),  # Entreprise externe acceptée
    ]
    
    entreprise = models.ForeignKey(Entreprise, on_delete=models.CASCADE)
    groupe = models.ForeignKey(Groupe, on_delete=models.CASCADE)
    statut = models.CharField(max_length=15, choices=STATUT_CHOICES)
    date_ajout = models.DateTimeField(auto_now_add=True)
    ajoute_par = models.ForeignKey(
        Entreprise, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='membres_ajoutes'
    )
    
    def __str__(self):
        return f"{self.entreprise.nom} - {self.groupe.nom} ({self.statut})"
    
    class Meta:
        verbose_name = "Membre du groupe"
        verbose_name_plural = "Membres du groupe"
        unique_together = ['entreprise', 'groupe']


class DemandeIntegration(models.Model):
    """Demandes d'intégration d'une entreprise dans un groupe"""
    STATUT_CHOICES = [
        ('EN_ATTENTE', 'En attente'),
        ('ACCEPTEE', 'Acceptée'),
        ('REFUSEE', 'Refusée'),
    ]
    
    entreprise_demandeur = models.ForeignKey(
        Entreprise, 
        on_delete=models.CASCADE, 
        related_name='demandes_envoyees'
    )
    groupe_cible = models.ForeignKey(Groupe, on_delete=models.CASCADE)
    message_demande = models.TextField(blank=True, null=True)
    statut = models.CharField(max_length=15, choices=STATUT_CHOICES, default='EN_ATTENTE')
    date_demande = models.DateTimeField(auto_now_add=True)
    date_reponse = models.DateTimeField(null=True, blank=True)
    reponse_par = models.ForeignKey(
        Entreprise, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='demandes_traitees'
    )
    
    def __str__(self):
        return f"Demande de {self.entreprise_demandeur.nom} pour {self.groupe_cible.nom}"
    
    class Meta:
        verbose_name = "Demande d'intégration"
        verbose_name_plural = "Demandes d'intégration"
        unique_together = ['entreprise_demandeur', 'groupe_cible']


class Message(models.Model):
    """Messages échangés dans les groupes ou en privé"""
    TYPE_CHOICES = [
        ('GROUPE_PUBLIC', 'Message public du groupe'),
        ('GROUPE_PRIVE', 'Message privé du groupe (membres seulement)'),
        ('DIRECT', 'Message direct'),
    ]
    
    expediteur = models.ForeignKey(Entreprise, on_delete=models.CASCADE, related_name='messages_envoyes')
    contenu = models.TextField()
    type_message = models.CharField(max_length=15, choices=TYPE_CHOICES)
    date_envoi = models.DateTimeField(auto_now_add=True)
    
    # Pour les messages de groupe
    groupe = models.ForeignKey(Groupe, on_delete=models.CASCADE, null=True, blank=True)
    
    # Pour les messages directs
    destinataire = models.ForeignKey(
        Entreprise, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name='messages_recus'
    )
    
    # Métadonnées
    est_lu = models.BooleanField(default=False)
    est_modifie = models.BooleanField(default=False)
    date_modification = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        if self.type_message == 'DIRECT':
            return f"Message de {self.expediteur.nom} à {self.destinataire.nom}"
        else:
            return f"Message de {self.expediteur.nom} dans {self.groupe.nom}"
    
    def save(self, *args, **kwargs):
        # Validation: un message de groupe doit avoir un groupe
        if self.type_message in ['GROUPE_PUBLIC', 'GROUPE_PRIVE'] and not self.groupe:
            raise ValueError("Un message de groupe doit avoir un groupe associé")
        
        # Validation: un message direct doit avoir un destinataire
        if self.type_message == 'DIRECT' and not self.destinataire:
            raise ValueError("Un message direct doit avoir un destinataire")
            
        super().save(*args, **kwargs)
    
    class Meta:
        verbose_name = "Message"
        verbose_name_plural = "Messages"
        ordering = ['-date_envoi']


class ConversationDirecte(models.Model):
    """Modèle pour gérer les conversations directes entre entreprises"""
    entreprise1 = models.ForeignKey(Entreprise, on_delete=models.CASCADE, related_name='conversations_1')
    entreprise2 = models.ForeignKey(Entreprise, on_delete=models.CASCADE, related_name='conversations_2')
    date_creation = models.DateTimeField(auto_now_add=True)
    derniere_activite = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Conversation entre {self.entreprise1.nom} et {self.entreprise2.nom}"
    
    def save(self, *args, **kwargs):
        # Assurer que entreprise1 a un ID plus petit que entreprise2 pour éviter les doublons
        if self.entreprise1.id > self.entreprise2.id:
            self.entreprise1, self.entreprise2 = self.entreprise2, self.entreprise1
        super().save(*args, **kwargs)
    
    class Meta:
        verbose_name = "Conversation directe"
        verbose_name_plural = "Conversations directes"
        unique_together = ['entreprise1', 'entreprise2']