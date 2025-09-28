# actualite/serializers.py
from rest_framework import serializers
from django.contrib.auth.models import User
from django.utils import timezone
from .models import (
    CategorieActualite, TagActualite, Actualite, MediaActualite,
    CommentaireActualite, LikeActualite, VueActualite, NotificationActualite
)
from entreprise.models import Entreprise, ProfilUtilisateur


class CategorieActualiteSerializer(serializers.ModelSerializer):
    """Serializer pour les catégories d'actualités"""
    nombre_actualites = serializers.SerializerMethodField()

    class Meta:
        model = CategorieActualite
        fields = [
            'id', 'nom', 'description', 'couleur', 'icone',
            'est_active', 'ordre', 'nombre_actualites',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_nombre_actualites(self, obj):
        return obj.actualites.filter(statut='PUBLIE').count()


class TagActualiteSerializer(serializers.ModelSerializer):
    """Serializer pour les tags"""
    class Meta:
        model = TagActualite
        fields = ['id', 'nom', 'couleur']


class MediaActualiteSerializer(serializers.ModelSerializer):
    """Serializer pour les médias"""
    file_url = serializers.SerializerMethodField()
    miniature_url = serializers.SerializerMethodField()
    file_size_human = serializers.SerializerMethodField()

    class Meta:
        model = MediaActualite
        fields = [
            'id', 'type_media', 'titre', 'description', 'ordre', 'est_principal',
            'file', 'file_url', 'file_size', 'file_size_human', 'content_type',
            'duree', 'miniature', 'miniature_url', 'created_at'
        ]
        read_only_fields = ['file_size', 'content_type', 'created_at']

    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None

    def get_miniature_url(self, obj):
        if obj.miniature:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.miniature.url)
            return obj.miniature.url
        return None

    def get_file_size_human(self, obj):
        """Retourne la taille du fichier en format lisible"""
        if not obj.file_size:
            return None

        for unit in ['B', 'KB', 'MB', 'GB']:
            if obj.file_size < 1024.0:
                return f"{obj.file_size:.1f} {unit}"
            obj.file_size /= 1024.0
        return f"{obj.file_size:.1f} TB"


class AuteurSerializer(serializers.ModelSerializer):
    """Serializer pour les informations d'auteur"""
    entreprise_nom = serializers.SerializerMethodField()
    poste = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'first_name', 'last_name', 'email',
            'entreprise_nom', 'poste', 'avatar_url'
        ]

    def get_entreprise_nom(self, obj):
        try:
            profil = ProfilUtilisateur.objects.get(user=obj)
            return profil.entreprise.nom
        except ProfilUtilisateur.DoesNotExist:
            return None

    def get_poste(self, obj):
        try:
            profil = ProfilUtilisateur.objects.get(user=obj)
            return profil.poste
        except ProfilUtilisateur.DoesNotExist:
            return None

    def get_avatar_url(self, obj):
        # TODO: Implémenter un système d'avatars
        return None


class CommentaireActualiteSerializer(serializers.ModelSerializer):
    """Serializer pour les commentaires"""
    auteur = AuteurSerializer(read_only=True)
    reponses = serializers.SerializerMethodField()
    nombre_reponses = serializers.SerializerMethodField()

    class Meta:
        model = CommentaireActualite
        fields = [
            'id', 'contenu', 'auteur', 'parent', 'reponses', 'nombre_reponses',
            'est_modere', 'est_signale', 'created_at', 'updated_at'
        ]
        read_only_fields = ['auteur', 'est_modere', 'est_signale', 'created_at', 'updated_at']

    def get_reponses(self, obj):
        if obj.reponses.exists():
            return CommentaireActualiteSerializer(
                obj.reponses.all(),
                many=True,
                context=self.context
            ).data
        return []

    def get_nombre_reponses(self, obj):
        return obj.reponses.count()


class ActualiteListSerializer(serializers.ModelSerializer):
    """Serializer simplifié pour la liste des actualités"""
    auteur = AuteurSerializer(read_only=True)
    entreprise_nom = serializers.CharField(source='entreprise.nom', read_only=True)
    categorie_nom = serializers.CharField(source='categorie.nom', read_only=True)
    categorie_couleur = serializers.CharField(source='categorie.couleur', read_only=True)
    tags = TagActualiteSerializer(many=True, read_only=True)
    media_principal = serializers.SerializerMethodField()
    nombre_commentaires = serializers.SerializerMethodField()
    est_like_par_utilisateur = serializers.SerializerMethodField()
    temps_lecture = serializers.SerializerMethodField()

    class Meta:
        model = Actualite
        fields = [
            'id', 'titre', 'slug', 'resume', 'auteur', 'entreprise_nom',
            'categorie_nom', 'categorie_couleur', 'tags', 'statut', 'visibilite',
            'date_publication', 'vues', 'likes', 'est_epingle', 'media_principal',
            'nombre_commentaires', 'est_like_par_utilisateur', 'temps_lecture',
            'created_at', 'updated_at'
        ]

    def get_media_principal(self, obj):
        media = obj.medias.filter(est_principal=True).first()
        if media:
            return MediaActualiteSerializer(media, context=self.context).data
        return None

    def get_nombre_commentaires(self, obj):
        return obj.commentaires.count()

    def get_est_like_par_utilisateur(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes_detail.filter(utilisateur=request.user).exists()
        return False

    def get_temps_lecture(self, obj):
        """Calcule le temps de lecture estimé (200 mots/minute)"""
        mots = len(obj.contenu.split())
        minutes = max(1, round(mots / 200))
        return f"{minutes} min"


class ActualiteDetailSerializer(serializers.ModelSerializer):
    """Serializer détaillé pour une actualité"""
    auteur = AuteurSerializer(read_only=True)
    entreprise = serializers.StringRelatedField(read_only=True)
    categorie = CategorieActualiteSerializer(read_only=True)
    tags = TagActualiteSerializer(many=True, read_only=True)
    medias = MediaActualiteSerializer(many=True, read_only=True)
    commentaires = serializers.SerializerMethodField()
    nombre_commentaires = serializers.SerializerMethodField()
    est_like_par_utilisateur = serializers.SerializerMethodField()
    peut_modifier = serializers.SerializerMethodField()
    temps_lecture = serializers.SerializerMethodField()

    class Meta:
        model = Actualite
        fields = [
            'id', 'titre', 'slug', 'resume', 'contenu', 'auteur', 'entreprise',
            'categorie', 'tags', 'statut', 'visibilite', 'date_publication',
            'date_expiration', 'vues', 'likes', 'est_epingle', 'commentaires_actives',
            'notifications_actives', 'medias', 'commentaires', 'nombre_commentaires',
            'est_like_par_utilisateur', 'peut_modifier', 'temps_lecture',
            'created_at', 'updated_at'
        ]

    def get_commentaires(self, obj):
        # Retourner seulement les commentaires racines (sans parent)
        commentaires_racines = obj.commentaires.filter(parent=None).order_by('created_at')
        return CommentaireActualiteSerializer(
            commentaires_racines,
            many=True,
            context=self.context
        ).data

    def get_nombre_commentaires(self, obj):
        return obj.commentaires.count()

    def get_est_like_par_utilisateur(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes_detail.filter(utilisateur=request.user).exists()
        return False

    def get_peut_modifier(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return (obj.auteur == request.user or
                    request.user.profilutilisateur.role == 'ADMIN')
        return False

    def get_temps_lecture(self, obj):
        mots = len(obj.contenu.split())
        minutes = max(1, round(mots / 200))
        return f"{minutes} min"


class ActualiteCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer pour créer/modifier des actualités"""
    tags = serializers.PrimaryKeyRelatedField(
        queryset=TagActualite.objects.all(),
        many=True,
        required=False
    )

    class Meta:
        model = Actualite
        fields = [
            'titre', 'resume', 'contenu', 'categorie', 'tags', 'statut',
            'visibilite', 'date_publication', 'date_expiration', 'est_epingle',
            'commentaires_actives', 'notifications_actives'
        ]

    def validate_date_publication(self, value):
        if value and value < timezone.now():
            if self.instance is None:  # Création
                raise serializers.ValidationError(
                    "La date de publication ne peut pas être dans le passé"
                )
        return value

    def validate_date_expiration(self, value):
        if value:
            date_pub = self.validated_data.get('date_publication') or timezone.now()
            if value <= date_pub:
                raise serializers.ValidationError(
                    "La date d'expiration doit être postérieure à la date de publication"
                )
        return value


class NotificationActualiteSerializer(serializers.ModelSerializer):
    """Serializer pour les notifications"""
    actualite_titre = serializers.CharField(source='actualite.titre', read_only=True)
    actualite_slug = serializers.CharField(source='actualite.slug', read_only=True)
    auteur_nom = serializers.CharField(source='actualite.auteur.username', read_only=True)

    class Meta:
        model = NotificationActualite
        fields = [
            'id', 'type_notification', 'est_lue', 'actualite_titre',
            'actualite_slug', 'auteur_nom', 'created_at'
        ]
        read_only_fields = ['created_at']


# Serializers pour les actions

class LikeToggleSerializer(serializers.Serializer):
    """Serializer pour toggle un like"""
    pass  # Pas de champs nécessaires


class CommentaireCreateSerializer(serializers.ModelSerializer):
    """Serializer pour créer un commentaire"""
    class Meta:
        model = CommentaireActualite
        fields = ['contenu', 'parent']

    def validate_parent(self, value):
        if value and value.actualite != self.context['actualite']:
            raise serializers.ValidationError(
                "Le commentaire parent doit appartenir à la même actualité"
            )
        return value


class MediaUploadSerializer(serializers.ModelSerializer):
    """Serializer pour uploader des médias"""
    class Meta:
        model = MediaActualite
        fields = ['file', 'titre', 'description', 'ordre', 'est_principal']

    def validate_file(self, value):
        # Validation de la taille et du type de fichier
        max_size = 100 * 1024 * 1024  # 100MB
        if value.size > max_size:
            raise serializers.ValidationError(
                "La taille du fichier ne peut pas dépasser 100MB"
            )

        allowed_extensions = [
            '.jpg', '.jpeg', '.png', '.gif', '.webp',  # Images
            '.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm',  # Vidéos
            '.pdf', '.doc', '.docx', '.txt'  # Documents
        ]

        ext = '.' + value.name.split('.')[-1].lower()
        if ext not in allowed_extensions:
            raise serializers.ValidationError(
                f"Type de fichier non supporté. Extensions autorisées: {', '.join(allowed_extensions)}"
            )

        return value