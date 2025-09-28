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
    # Entreprise créatrice (premier utilisateur administrateur)
    createur = models.ForeignKey(User, on_delete=models.CASCADE, related_name='entreprises_creees')

    def __str__(self):
        return self.nom

    class Meta:
        verbose_name = "Entreprise"
        verbose_name_plural = "Entreprises"


class ProfilUtilisateur(models.Model):
    """Profil utilisateur lié à une entreprise"""
    ROLE_CHOICES = [
        ('ADMIN', 'Administrateur entreprise'),
        ('EMPLOYE', 'Employé'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE)
    entreprise = models.ForeignKey(Entreprise, on_delete=models.CASCADE, related_name='employes')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='EMPLOYE')
    poste = models.CharField(max_length=200, blank=True)
    date_embauche = models.DateTimeField(auto_now_add=True)
    est_actif = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.user.username} - {self.entreprise.nom}"

    class Meta:
        verbose_name = "Profil utilisateur"
        verbose_name_plural = "Profils utilisateurs"
        unique_together = ['user', 'entreprise']


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
    est_public = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.nom} - {self.entreprise_proprietaire.nom}"

    class Meta:
        verbose_name = "Groupe"
        verbose_name_plural = "Groupes"
        unique_together = ['nom', 'entreprise_proprietaire']


class MembreGroupe(models.Model):
    """Relation entre un utilisateur et un groupe"""
    STATUT_CHOICES = [
        ('ADMIN', 'Administrateur du groupe'),
        ('MEMBRE', 'Membre actif'),
    ]

    utilisateur = models.ForeignKey(User, on_delete=models.CASCADE)
    groupe = models.ForeignKey(Groupe, on_delete=models.CASCADE)
    statut = models.CharField(max_length=15, choices=STATUT_CHOICES, default='MEMBRE')
    date_ajout = models.DateTimeField(auto_now_add=True)
    ajoute_par = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='membres_ajoutes'
    )

    def __str__(self):
        return f"{self.utilisateur.username} - {self.groupe.nom} ({self.statut})"

    class Meta:
        verbose_name = "Membre du groupe"
        verbose_name_plural = "Membres du groupe"
        unique_together = ['utilisateur', 'groupe']


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
        User,
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
    """Messages échangés dans les groupes"""
    TYPE_CHOICES = [
        ('GROUPE_PUBLIC', 'Message public du groupe (visible par toutes les entreprises)'),
        ('GROUPE_PRIVE', 'Message privé du groupe (visible par l\'entreprise seulement)'),
        ('DIRECT', 'Message direct entre utilisateurs'),
    ]

    expediteur = models.ForeignKey(User, on_delete=models.CASCADE, related_name='messages_envoyes')
    contenu = models.TextField()
    type_message = models.CharField(max_length=15, choices=TYPE_CHOICES)
    date_envoi = models.DateTimeField(auto_now_add=True)

    # Pour les messages de groupe
    groupe = models.ForeignKey(Groupe, on_delete=models.CASCADE, null=True, blank=True)

    # Pour les messages directs
    destinataire = models.ForeignKey(
        User,
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
            return f"Message de {self.expediteur.username} à {self.destinataire.username}"
        else:
            visibility = "Public" if self.type_message == 'GROUPE_PUBLIC' else "Privé"
            return f"Message {visibility} de {self.expediteur.username} dans {self.groupe.nom}"

    def save(self, *args, **kwargs):
        # Validation: un message de groupe doit avoir un groupe
        if self.type_message in ['GROUPE_PUBLIC', 'GROUPE_PRIVE'] and not self.groupe:
            raise ValueError("Un message de groupe doit avoir un groupe associé")

        # Validation: un message direct doit avoir un destinataire
        if self.type_message == 'DIRECT' and not self.destinataire:
            raise ValueError("Un message direct doit avoir un destinataire")

        super().save(*args, **kwargs)

    def est_visible_par_utilisateur(self, utilisateur):
        """Détermine si un message est visible par un utilisateur donné"""
        if self.type_message == 'DIRECT':
            return utilisateur in [self.expediteur, self.destinataire]

        # Vérifier si l'utilisateur est membre du groupe
        if not MembreGroupe.objects.filter(utilisateur=utilisateur, groupe=self.groupe).exists():
            return False

        if self.type_message == 'GROUPE_PUBLIC':
            # Visible par tous les membres du groupe
            return True
        elif self.type_message == 'GROUPE_PRIVE':
            # Visible seulement par les membres de la même entreprise
            try:
                profil_expediteur = ProfilUtilisateur.objects.get(user=self.expediteur)
                profil_utilisateur = ProfilUtilisateur.objects.get(user=utilisateur)
                return profil_expediteur.entreprise == profil_utilisateur.entreprise
            except ProfilUtilisateur.DoesNotExist:
                return False

        return False

    class Meta:
        verbose_name = "Message"
        verbose_name_plural = "Messages"
        ordering = ['-date_envoi']


class ConversationDirecte(models.Model):
    """Modèle pour gérer les conversations directes entre utilisateurs"""
    utilisateur1 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='conversations_1', default=1)
    utilisateur2 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='conversations_2')
    date_creation = models.DateTimeField(auto_now_add=True)
    derniere_activite = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Conversation entre {self.utilisateur1.username} et {self.utilisateur2.username}"

    def save(self, *args, **kwargs):
        # Assurer que utilisateur1 a un ID plus petit que utilisateur2 pour éviter les doublons
        if self.utilisateur1.id > self.utilisateur2.id:
            self.utilisateur1, self.utilisateur2 = self.utilisateur2, self.utilisateur1
        super().save(*args, **kwargs)

    class Meta:
        verbose_name = "Conversation directe"
        verbose_name_plural = "Conversations directes"
        unique_together = ['utilisateur1', 'utilisateur2']