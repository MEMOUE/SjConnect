# actualite/admin.py
from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import (
    CategorieActualite, TagActualite, Actualite, MediaActualite,
    CommentaireActualite, LikeActualite, VueActualite, NotificationActualite
)


@admin.register(CategorieActualite)
class CategorieActualiteAdmin(admin.ModelAdmin):
    list_display = ['nom', 'couleur_preview', 'icone', 'est_active', 'ordre', 'nombre_actualites']
    list_filter = ['est_active', 'created_at']
    search_fields = ['nom', 'description']
    list_editable = ['ordre', 'est_active']
    ordering = ['ordre', 'nom']

    def couleur_preview(self, obj):
        return format_html(
            '<div style="width: 20px; height: 20px; background-color: {}; border: 1px solid #ddd; border-radius: 3px;"></div>',
            obj.couleur
        )
    couleur_preview.short_description = 'Couleur'

    def nombre_actualites(self, obj):
        count = obj.actualites.count()
        if count > 0:
            url = reverse('admin:actualite_actualite_changelist')
            return format_html(
                '<a href="{}?categorie__id__exact={}">{} actualités</a>',
                url, obj.id, count
            )
        return "0 actualité"
    nombre_actualites.short_description = 'Actualités'

    fieldsets = (
        ('Informations générales', {
            'fields': ('nom', 'description', 'couleur', 'icone')
        }),
        ('Paramètres', {
            'fields': ('est_active', 'ordre')
        }),
    )


@admin.register(TagActualite)
class TagActualiteAdmin(admin.ModelAdmin):
    list_display = ['nom', 'couleur_preview', 'nombre_actualites']
    search_fields = ['nom']

    def couleur_preview(self, obj):
        return format_html(
            '<div style="width: 20px; height: 20px; background-color: {}; border: 1px solid #ddd; border-radius: 3px;"></div>',
            obj.couleur
        )
    couleur_preview.short_description = 'Couleur'

    def nombre_actualites(self, obj):
        return obj.actualites.count()
    nombre_actualites.short_description = 'Actualités'


class MediaActualiteInline(admin.TabularInline):
    model = MediaActualite
    extra = 0
    fields = ['type_media', 'titre', 'file', 'ordre', 'est_principal']
    readonly_fields = ['type_media']


class CommentaireActualiteInline(admin.TabularInline):
    model = CommentaireActualite
    extra = 0
    fields = ['auteur', 'contenu', 'parent', 'est_modere', 'est_signale']
    readonly_fields = ['auteur', 'created_at']


@admin.register(Actualite)
class ActualiteAdmin(admin.ModelAdmin):
    list_display = [
        'titre', 'auteur', 'entreprise', 'statut', 'visibilite', 'categorie',
        'est_epingle', 'vues', 'likes', 'nombre_commentaires', 'date_publication', 'created_at'
    ]
    list_filter = [
        'statut', 'visibilite', 'categorie', 'est_epingle', 'commentaires_actives',
        'created_at', 'date_publication', 'entreprise'
    ]
    search_fields = ['titre', 'resume', 'contenu', 'auteur__username', 'entreprise__nom']
    list_editable = ['statut', 'est_epingle']
    prepopulated_fields = {'slug': ('titre',)}
    filter_horizontal = ['tags']
    date_hierarchy = 'date_publication'
    inlines = [MediaActualiteInline, CommentaireActualiteInline]

    readonly_fields = ['vues', 'likes', 'created_at', 'updated_at', 'slug_preview']

    def nombre_commentaires(self, obj):
        count = obj.commentaires.count()
        if count > 0:
            return format_html('<strong>{}</strong>', count)
        return count
    nombre_commentaires.short_description = 'Commentaires'

    def slug_preview(self, obj):
        if obj.slug:
            return format_html('<code>{}</code>', obj.slug)
        return '-'
    slug_preview.short_description = 'Slug généré'

    fieldsets = (
        ('Contenu', {
            'fields': ('titre', 'slug', 'slug_preview', 'resume', 'contenu')
        }),
        ('Classification', {
            'fields': ('categorie', 'tags', 'visibilite')
        }),
        ('Publication', {
            'fields': ('statut', 'date_publication', 'date_expiration', 'est_epingle')
        }),
        ('Paramètres', {
            'fields': ('commentaires_actives', 'notifications_actives')
        }),
        ('Métadonnées', {
            'fields': ('auteur', 'entreprise', 'vues', 'likes', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

    def save_model(self, request, obj, form, change):
        if not change:  # Création
            obj.auteur = request.user
            # Récupérer l'entreprise de l'utilisateur
            try:
                from entreprise.models import ProfilUtilisateur
                profil = ProfilUtilisateur.objects.get(user=request.user)
                obj.entreprise = profil.entreprise
            except ProfilUtilisateur.DoesNotExist:
                pass
        super().save_model(request, obj, form, change)

    actions = ['publier_actualites', 'archiver_actualites', 'epingler_actualites']

    def publier_actualites(self, request, queryset):
        count = queryset.update(statut='PUBLIE')
        self.message_user(request, f'{count} actualités publiées.')
    publier_actualites.short_description = "Publier les actualités sélectionnées"

    def archiver_actualites(self, request, queryset):
        count = queryset.update(statut='ARCHIVE')
        self.message_user(request, f'{count} actualités archivées.')
    archiver_actualites.short_description = "Archiver les actualités sélectionnées"

    def epingler_actualites(self, request, queryset):
        count = queryset.update(est_epingle=True)
        self.message_user(request, f'{count} actualités épinglées.')
    epingler_actualites.short_description = "Épingler les actualités sélectionnées"


@admin.register(MediaActualite)
class MediaActualiteAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'actualite', 'type_media', 'est_principal', 'file_size_display',
        'uploaded_by', 'created_at'
    ]
    list_filter = ['type_media', 'est_principal', 'created_at', 'actualite__entreprise']
    search_fields = ['name', 'titre', 'actualite__titre']
    readonly_fields = ['file_size', 'content_type', 'type_media']

    def file_size_display(self, obj):
        if obj.file_size:
            size = obj.file_size
            for unit in ['B', 'KB', 'MB', 'GB']:
                if size < 1024.0:
                    return f"{size:.1f} {unit}"
                size /= 1024.0
            return f"{size:.1f} TB"
        return '-'
    file_size_display.short_description = 'Taille'

    fieldsets = (
        ('Fichier', {
            'fields': ('file', 'name', 'titre', 'description')
        }),
        ('Paramètres', {
            'fields': ('ordre', 'est_principal', 'type_media')
        }),
        ('Métadonnées vidéo', {
            'fields': ('duree', 'miniature'),
            'classes': ('collapse',)
        }),
        ('Informations système', {
            'fields': ('file_size', 'content_type', 'uploaded_by'),
            'classes': ('collapse',)
        })
    )


@admin.register(CommentaireActualite)
class CommentaireActualiteAdmin(admin.ModelAdmin):
    list_display = ['actualite', 'auteur', 'contenu_preview', 'parent', 'est_modere', 'est_signale', 'created_at']
    list_filter = ['est_modere', 'est_signale', 'created_at', 'actualite__entreprise']
    search_fields = ['contenu', 'auteur__username', 'actualite__titre']
    list_editable = ['est_modere']
    raw_id_fields = ['actualite', 'auteur', 'parent']

    def contenu_preview(self, obj):
        return obj.contenu[:50] + '...' if len(obj.contenu) > 50 else obj.contenu
    contenu_preview.short_description = 'Contenu'

    actions = ['moderer_commentaires', 'signaler_commentaires']

    def moderer_commentaires(self, request, queryset):
        count = queryset.update(est_modere=True)
        self.message_user(request, f'{count} commentaires modérés.')
    moderer_commentaires.short_description = "Modérer les commentaires sélectionnés"

    def signaler_commentaires(self, request, queryset):
        count = queryset.update(est_signale=True)
        self.message_user(request, f'{count} commentaires signalés.')
    signaler_commentaires.short_description = "Signaler les commentaires sélectionnés"


@admin.register(LikeActualite)
class LikeActualiteAdmin(admin.ModelAdmin):
    list_display = ['actualite', 'utilisateur', 'created_at']
    list_filter = ['created_at', 'actualite__entreprise']
    search_fields = ['actualite__titre', 'utilisateur__username']
    raw_id_fields = ['actualite', 'utilisateur']


@admin.register(VueActualite)
class VueActualiteAdmin(admin.ModelAdmin):
    list_display = ['actualite', 'utilisateur', 'ip_address', 'created_at']
    list_filter = ['created_at', 'actualite__entreprise']
    search_fields = ['actualite__titre', 'utilisateur__username', 'ip_address']
    raw_id_fields = ['actualite', 'utilisateur']
    readonly_fields = ['ip_address', 'user_agent']


@admin.register(NotificationActualite)
class NotificationActualiteAdmin(admin.ModelAdmin):
    list_display = ['actualite', 'utilisateur', 'type_notification', 'est_lue', 'created_at']
    list_filter = ['type_notification', 'est_lue', 'created_at', 'actualite__entreprise']
    search_fields = ['actualite__titre', 'utilisateur__username']
    list_editable = ['est_lue']
    raw_id_fields = ['actualite', 'utilisateur']

    actions = ['marquer_comme_lues']

    def marquer_comme_lues(self, request, queryset):
        count = queryset.update(est_lue=True)
        self.message_user(request, f'{count} notifications marquées comme lues.')
    marquer_comme_lues.short_description = "Marquer comme lues"


# Configuration du site admin
admin.site.site_header = "SJConnect Administration"
admin.site.site_title = "SJConnect Admin"
admin.site.index_title = "Administration de la plateforme"