# actualite/models.py
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.utils.text import slugify
from entreprise.models import Entreprise
import os


def upload_media_path(instance, filename):
    """Génère le chemin pour l'upload de médias"""
    return f'actualites/{instance.actualite.id}/medias/{filename}'


def upload_miniature_path(instance, filename):
    """Génère le chemin pour l'upload de miniatures"""
    return f'actualites/{instance.actualite.id}/miniatures/{filename}'


class CategorieActualite(models.Model):
    """Catégories pour organiser les actualités"""
    nom = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    couleur = models.CharField(max_length=7, default='#007bff', help_text='Code couleur hexadécimal')
    icone = models.CharField(max_length=50, blank=True, help_text='Nom de l\'icône FontAwesome')
    est_active = models.BooleanField(default=True)
    ordre = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Catégorie d'actualité"
        verbose_name_plural = "Catégories d'actualités"
        ordering = ['ordre', 'nom']

    def __str__(self):
        return self.nom


class TagActualite(models.Model):
    """Tags pour catégoriser les actualités"""
    nom = models.CharField(max_length=50, unique=True)
    couleur = models.CharField(max_length=7, default='#6c757d')

    class Meta:
        verbose_name = "Tag d'actualité"
        verbose_name_plural = "Tags d'actualités"
        ordering = ['nom']

    def __str__(self):
        return self.nom


class Actualite(models.Model):
    """Modèle principal pour les actualités"""
    STATUT_CHOICES = [
        ('BROUILLON', 'Brouillon'),
        ('PUBLIE', 'Publié'),
        ('ARCHIVE', 'Archivé'),
        ('PLANIFIE', 'Planifié'),
    ]

    VISIBILITE_CHOICES = [
        ('PUBLIC', 'Public - Visible par tous'),
        ('PRIVE', 'Privé - Visible par l\'entreprise seulement'),
        ('GROUPE', 'Groupe - Visible par les groupes sélectionnés'),
        ('PARTENAIRES', 'Partenaires - Visible par les entreprises partenaires'),
    ]

    # Contenu
    titre = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True, blank=True)
    resume = models.TextField(max_length=500, help_text='Résumé court de l\'actualité')
    contenu = models.TextField()

    # Relations
    auteur = models.ForeignKey(User, on_delete=models.CASCADE, related_name='actualites')
    entreprise = models.ForeignKey(Entreprise, on_delete=models.CASCADE, related_name='actualites')
    categorie = models.ForeignKey(CategorieActualite, on_delete=models.SET_NULL, null=True, related_name='actualites')
    tags = models.ManyToManyField(TagActualite, blank=True, related_name='actualites')

    # Configuration
    statut = models.CharField(max_length=10, choices=STATUT_CHOICES, default='BROUILLON')
    visibilite = models.CharField(max_length=15, choices=VISIBILITE_CHOICES, default='PUBLIC')
    date_publication = models.DateTimeField(default=timezone.now)
    date_expiration = models.DateTimeField(null=True, blank=True)

    # Paramètres
    est_epingle = models.BooleanField(default=False)
    commentaires_actives = models.BooleanField(default=True)
    notifications_actives = models.BooleanField(default=True)

    # Statistiques
    vues = models.PositiveIntegerField(default=0)
    likes = models.PositiveIntegerField(default=0)

    # Métadonnées
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Actualité"
        verbose_name_plural = "Actualités"
        ordering = ['-est_epingle', '-date_publication']

    def __str__(self):
        return self.titre

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.titre)
            # Assurer l'unicité du slug
            original_slug = self.slug
            counter = 1
            while Actualite.objects.filter(slug=self.slug).exclude(pk=self.pk).exists():
                self.slug = f"{original_slug}-{counter}"
                counter += 1
        super().save(*args, **kwargs)

    @property
    def est_publie(self):
        """Vérifie si l'actualité est publiée et visible"""
        return (self.statut == 'PUBLIE' and
                self.date_publication <= timezone.now() and
                (self.date_expiration is None or self.date_expiration > timezone.now()))


class MediaActualite(models.Model):
    """Médias associés aux actualités (images, vidéos, documents)"""
    TYPE_CHOICES = [
        ('IMAGE', 'Image'),
        ('VIDEO', 'Vidéo'),
        ('DOCUMENT', 'Document'),
    ]

    actualite = models.ForeignKey(Actualite, on_delete=models.CASCADE, related_name='medias')
    type_media = models.CharField(max_length=10, choices=TYPE_CHOICES)

    # Fichier
    file = models.FileField(upload_to=upload_media_path)
    name = models.CharField(max_length=255, blank=True)
    titre = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)

    # Paramètres
    ordre = models.PositiveIntegerField(default=0)
    est_principal = models.BooleanField(default=False)

    # Métadonnées fichier
    file_size = models.PositiveIntegerField(null=True, blank=True)
    content_type = models.CharField(max_length=100, blank=True)

    # Spécifique aux vidéos
    duree = models.FloatField(null=True, blank=True, help_text='Durée en secondes')
    miniature = models.ImageField(upload_to=upload_miniature_path, null=True, blank=True)

    # Métadonnées
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Média d'actualité"
        verbose_name_plural = "Médias d'actualités"
        ordering = ['ordre', 'created_at']

    def __str__(self):
        return f"{self.get_type_media_display()} - {self.actualite.titre}"

    def save(self, *args, **kwargs):
        if self.file:
            self.file_size = self.file.size
            self.content_type = getattr(self.file.file, 'content_type', '')

            # Déterminer le type de média automatiquement
            if not self.type_media:
                if self.content_type.startswith('image/'):
                    self.type_media = 'IMAGE'
                elif self.content_type.startswith('video/'):
                    self.type_media = 'VIDEO'
                else:
                    self.type_media = 'DOCUMENT'

            # Générer un nom si non fourni
            if not self.name:
                self.name = os.path.basename(self.file.name)

        super().save(*args, **kwargs)


class CommentaireActualite(models.Model):
    """Commentaires sur les actualités"""
    actualite = models.ForeignKey(Actualite, on_delete=models.CASCADE, related_name='commentaires')
    auteur = models.ForeignKey(User, on_delete=models.CASCADE)
    contenu = models.TextField()
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='reponses')

    # Modération
    est_modere = models.BooleanField(default=False)
    est_signale = models.BooleanField(default=False)

    # Métadonnées
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Commentaire d'actualité"
        verbose_name_plural = "Commentaires d'actualités"
        ordering = ['created_at']

    def __str__(self):
        return f"Commentaire de {self.auteur.username} sur {self.actualite.titre}"


class LikeActualite(models.Model):
    """Likes sur les actualités"""
    actualite = models.ForeignKey(Actualite, on_delete=models.CASCADE, related_name='likes_detail')
    utilisateur = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Like d'actualité"
        verbose_name_plural = "Likes d'actualités"
        unique_together = ['actualite', 'utilisateur']

    def __str__(self):
        return f"{self.utilisateur.username} aime {self.actualite.titre}"


class VueActualite(models.Model):
    """Tracking des vues sur les actualités"""
    actualite = models.ForeignKey(Actualite, on_delete=models.CASCADE, related_name='vues_detail')
    utilisateur = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Vue d'actualité"
        verbose_name_plural = "Vues d'actualités"
        unique_together = ['actualite', 'utilisateur']

    def __str__(self):
        if self.utilisateur:
            return f"{self.utilisateur.username} a vu {self.actualite.titre}"
        return f"Vue anonyme de {self.actualite.titre}"


class NotificationActualite(models.Model):
    """Notifications liées aux actualités"""
    TYPE_CHOICES = [
        ('NOUVELLE', 'Nouvelle actualité'),
        ('COMMENTAIRE', 'Nouveau commentaire'),
        ('LIKE', 'Nouveau like'),
        ('MENTION', 'Mention dans un commentaire'),
    ]

    actualite = models.ForeignKey(Actualite, on_delete=models.CASCADE, related_name='notifications')
    utilisateur = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications_actualites')
    type_notification = models.CharField(max_length=15, choices=TYPE_CHOICES)
    est_lue = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Notification d'actualité"
        verbose_name_plural = "Notifications d'actualités"
        ordering = ['-created_at']
        unique_together = ['actualite', 'utilisateur', 'type_notification']

    def __str__(self):
        return f"Notification {self.get_type_notification_display()} pour {self.utilisateur.username}"