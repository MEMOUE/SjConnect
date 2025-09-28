# actualite/views.py - Version simplifiée
from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
from django.db.models import Q, F
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
import django_filters

# Imports pour drf-spectacular
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiResponse
from drf_spectacular.types import OpenApiTypes

from .models import (
    CategorieActualite, TagActualite, Actualite, MediaActualite,
    CommentaireActualite, LikeActualite, VueActualite, NotificationActualite
)
from .serializers import (
    CategorieActualiteSerializer, TagActualiteSerializer,
    ActualiteListSerializer, ActualiteDetailSerializer, ActualiteCreateUpdateSerializer,
    MediaActualiteSerializer, CommentaireActualiteSerializer, CommentaireCreateSerializer,
    NotificationActualiteSerializer, LikeToggleSerializer, MediaUploadSerializer
)
from entreprise.models import ProfilUtilisateur


# Filtres pour les actualités
class ActualiteFilter(django_filters.FilterSet):
    """Filtres pour les actualités"""
    date_debut = django_filters.DateTimeFilter(field_name='date_publication', lookup_expr='gte')
    date_fin = django_filters.DateTimeFilter(field_name='date_publication', lookup_expr='lte')
    auteur = django_filters.CharFilter(field_name='auteur__username', lookup_expr='icontains')

    class Meta:
        model = Actualite
        fields = ['statut', 'visibilite', 'categorie', 'tags', 'est_epingle']


@extend_schema_view(
    list=extend_schema(summary="Liste des catégories", tags=["Actualités - Catégories"]),
    create=extend_schema(summary="Créer une catégorie", tags=["Actualités - Catégories"]),
    retrieve=extend_schema(summary="Détails d'une catégorie", tags=["Actualités - Catégories"]),
    update=extend_schema(summary="Modifier une catégorie", tags=["Actualités - Catégories"]),
    destroy=extend_schema(summary="Supprimer une catégorie", tags=["Actualités - Catégories"])
)
class CategorieActualiteViewSet(viewsets.ModelViewSet):
    """ViewSet pour les catégories d'actualités"""
    queryset = CategorieActualite.objects.filter(est_active=True)
    serializer_class = CategorieActualiteSerializer
    permission_classes = [permissions.IsAuthenticated]
    ordering = ['ordre', 'nom']


@extend_schema_view(
    list=extend_schema(summary="Liste des tags", tags=["Actualités - Tags"]),
    create=extend_schema(summary="Créer un tag", tags=["Actualités - Tags"])
)
class TagActualiteViewSet(viewsets.ModelViewSet):
    """ViewSet pour les tags"""
    queryset = TagActualite.objects.all()
    serializer_class = TagActualiteSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['nom']


@extend_schema_view(
    list=extend_schema(
        summary="Liste des actualités",
        description="Récupère la liste des actualités avec filtres et pagination",
        tags=["Actualités"]
    ),
    create=extend_schema(summary="Créer une actualité", tags=["Actualités"]),
    retrieve=extend_schema(summary="Détails d'une actualité", tags=["Actualités"]),
    update=extend_schema(summary="Modifier une actualité", tags=["Actualités"]),
    destroy=extend_schema(summary="Supprimer une actualité", tags=["Actualités"])
)
class ActualiteViewSet(viewsets.ModelViewSet):
    """ViewSet principal pour les actualités"""
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ActualiteFilter
    search_fields = ['titre', 'resume', 'contenu']
    ordering_fields = ['date_publication', 'created_at', 'vues', 'likes']
    ordering = ['-est_epingle', '-date_publication']

    def get_queryset(self):
        """Filtre les actualités selon les permissions"""
        user = self.request.user
        if not user.is_authenticated:
            return Actualite.objects.filter(statut='PUBLIE', visibilite='PUBLIC')

        queryset = Actualite.objects.select_related('auteur', 'entreprise', 'categorie').prefetch_related('tags', 'medias')

        try:
            profil = ProfilUtilisateur.objects.get(user=user)
            # L'utilisateur voit ses actualités + publiques + celles de son entreprise
            queryset = queryset.filter(
                Q(auteur=user) |  # Ses actualités
                Q(statut='PUBLIE', visibilite='PUBLIC') |  # Publiques
                Q(statut='PUBLIE', entreprise=profil.entreprise)  # De son entreprise
            )
        except ProfilUtilisateur.DoesNotExist:
            queryset = queryset.filter(statut='PUBLIE', visibilite='PUBLIC')

        return queryset.distinct()

    def get_serializer_class(self):
        if self.action == 'list':
            return ActualiteListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return ActualiteCreateUpdateSerializer
        return ActualiteDetailSerializer

    def perform_create(self, serializer):
        """Création avec auteur et entreprise automatiques"""
        try:
            profil = ProfilUtilisateur.objects.get(user=self.request.user)
            serializer.save(auteur=self.request.user, entreprise=profil.entreprise)
        except ProfilUtilisateur.DoesNotExist:
            # Fallback si pas de profil entreprise
            serializer.save(auteur=self.request.user)

    def retrieve(self, request, *args, **kwargs):
        """Récupération avec tracking des vues"""
        instance = self.get_object()

        # Enregistrer la vue si utilisateur connecté
        if request.user.is_authenticated:
            vue, created = VueActualite.objects.get_or_create(
                actualite=instance,
                utilisateur=request.user,
                defaults={
                    'ip_address': self.get_client_ip(request),
                    'user_agent': request.META.get('HTTP_USER_AGENT', '')
                }
            )
            if created:
                # Incrémenter le compteur
                Actualite.objects.filter(id=instance.id).update(vues=F('vues') + 1)

        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def get_client_ip(self, request):
        """Récupère l'IP du client"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

    @extend_schema(
        summary="Liker/Unliker une actualité",
        request=LikeToggleSerializer,
        responses={200: OpenApiResponse(description="Like togglé")},
        tags=["Actualités"]
    )
    @action(detail=True, methods=['post'])
    def toggle_like(self, request, pk=None):
        """Toggle le like d'une actualité"""
        actualite = self.get_object()
        like, created = LikeActualite.objects.get_or_create(
            actualite=actualite,
            utilisateur=request.user
        )

        if not created:
            like.delete()
            Actualite.objects.filter(id=actualite.id).update(likes=F('likes') - 1)
            liked = False
        else:
            Actualite.objects.filter(id=actualite.id).update(likes=F('likes') + 1)
            liked = True

        actualite.refresh_from_db()
        return Response({
            'liked': liked,
            'total_likes': actualite.likes
        })

    @extend_schema(
        summary="Commenter une actualité",
        request=CommentaireCreateSerializer,
        responses={201: CommentaireActualiteSerializer},
        tags=["Actualités"]
    )
    @action(detail=True, methods=['post'])
    def commenter(self, request, pk=None):
        """Ajoute un commentaire"""
        actualite = self.get_object()

        if not actualite.commentaires_actives:
            return Response(
                {'error': 'Les commentaires sont désactivés'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = CommentaireCreateSerializer(
            data=request.data,
            context={'request': request, 'actualite': actualite}
        )

        if serializer.is_valid():
            commentaire = serializer.save(actualite=actualite, auteur=request.user)
            response_serializer = CommentaireActualiteSerializer(
                commentaire, context={'request': request}
            )
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        summary="Commentaires d'une actualité",
        responses={200: CommentaireActualiteSerializer(many=True)},
        tags=["Actualités"]
    )
    @action(detail=True, methods=['get'])
    def commentaires(self, request, pk=None):
        """Récupère les commentaires"""
        actualite = self.get_object()
        commentaires = actualite.commentaires.filter(parent=None).order_by('created_at')
        serializer = CommentaireActualiteSerializer(commentaires, many=True, context={'request': request})
        return Response(serializer.data)

    @extend_schema(
        summary="Uploader un média",
        request=MediaUploadSerializer,
        responses={201: MediaActualiteSerializer},
        tags=["Actualités"]
    )
    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def upload_media(self, request, pk=None):
        """Upload un média pour l'actualité"""
        actualite = self.get_object()

        # Vérifier les permissions (auteur ou admin de l'entreprise)
        if actualite.auteur != request.user:
            try:
                profil = ProfilUtilisateur.objects.get(user=request.user)
                if profil.role != 'ADMIN' or profil.entreprise != actualite.entreprise:
                    return Response(
                        {'error': 'Permission insuffisante'},
                        status=status.HTTP_403_FORBIDDEN
                    )
            except ProfilUtilisateur.DoesNotExist:
                return Response(
                    {'error': 'Permission insuffisante'},
                    status=status.HTTP_403_FORBIDDEN
                )

        serializer = MediaUploadSerializer(data=request.data, context={'request': request})

        if serializer.is_valid():
            media = serializer.save(
                actualite=actualite,
                uploaded_by=request.user,
                name=request.data.get('titre', request.FILES['file'].name)
            )
            response_serializer = MediaActualiteSerializer(media, context={'request': request})
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        summary="Mes actualités",
        responses={200: ActualiteListSerializer(many=True)},
        tags=["Actualités"]
    )
    @action(detail=False, methods=['get'])
    def mes_actualites(self, request):
        """Actualités de l'utilisateur connecté"""
        queryset = Actualite.objects.filter(auteur=request.user).order_by('-created_at')
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = ActualiteListSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)

        serializer = ActualiteListSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)

    @extend_schema(
        summary="Actualités populaires",
        parameters=[
            OpenApiParameter('jours', OpenApiTypes.INT, description='Nombre de jours (défaut: 7)')
        ],
        responses={200: ActualiteListSerializer(many=True)},
        tags=["Actualités"]
    )
    @action(detail=False, methods=['get'])
    def populaires(self, request):
        """Actualités populaires"""
        jours = int(request.query_params.get('jours', 7))
        date_limite = timezone.now() - timezone.timedelta(days=jours)

        queryset = self.get_queryset().filter(
            date_publication__gte=date_limite
        ).order_by('-vues', '-likes')[:10]

        serializer = ActualiteListSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)


@extend_schema_view(
    list=extend_schema(summary="Mes notifications", tags=["Notifications"]),
)
class NotificationActualiteViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet pour les notifications"""
    serializer_class = NotificationActualiteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return NotificationActualite.objects.filter(
            utilisateur=self.request.user
        ).order_by('-created_at')

    @extend_schema(
        summary="Marquer toutes comme lues",
        responses={200: OpenApiResponse(description="Notifications marquées comme lues")},
        tags=["Notifications"]
    )
    @action(detail=False, methods=['post'])
    def marquer_toutes_lues(self, request):
        """Marque toutes les notifications comme lues"""
        count = NotificationActualite.objects.filter(
            utilisateur=request.user,
            est_lue=False
        ).update(est_lue=True)

        return Response({'message': f'{count} notifications marquées comme lues'})

    @extend_schema(
        summary="Nombre de notifications non lues",
        responses={200: OpenApiResponse(description="Nombre de notifications")},
        tags=["Notifications"]
    )
    @action(detail=False, methods=['get'])
    def non_lues(self, request):
        """Nombre de notifications non lues"""
        count = NotificationActualite.objects.filter(
            utilisateur=request.user,
            est_lue=False
        ).count()

        return Response({'count': count})