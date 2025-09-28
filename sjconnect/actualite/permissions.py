from rest_framework import permissions
from entreprise.models import ProfilUtilisateur


class IsAuthorOrReadOnly(permissions.BasePermission):
    """Permission : seul l'auteur peut modifier son actualité"""

    def has_object_permission(self, request, view, obj):
        # Permissions de lecture pour tous
        if request.method in permissions.SAFE_METHODS:
            return True

        # Permissions d'écriture seulement pour l'auteur
        return obj.auteur == request.user


class IsAdminOrAuthor(permissions.BasePermission):
    """Permission : admin de l'entreprise ou auteur peuvent modifier"""

    def has_object_permission(self, request, view, obj):
        # Permissions de lecture pour tous
        if request.method in permissions.SAFE_METHODS:
            return True

        # L'auteur peut toujours modifier
        if obj.auteur == request.user:
            return True

        # Vérifier si l'utilisateur est admin de l'entreprise
        try:
            profil = ProfilUtilisateur.objects.get(user=request.user)
            if profil.role == 'ADMIN' and profil.entreprise == obj.entreprise:
                return True
        except ProfilUtilisateur.DoesNotExist:
            pass

        return False


class CanUploadMedia(permissions.BasePermission):
    """Permission pour uploader des médias"""

    def has_permission(self, request, view):
        return request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # Pour les actualités, vérifier si l'utilisateur peut les modifier
        if hasattr(obj, 'auteur'):  # Actualité
            return (obj.auteur == request.user or
                    self._is_admin_of_entreprise(request.user, obj.entreprise))
        return False

    def _is_admin_of_entreprise(self, user, entreprise):
        try:
            profil = ProfilUtilisateur.objects.get(user=user)
            return profil.role == 'ADMIN' and profil.entreprise == entreprise
        except ProfilUtilisateur.DoesNotExist:
            return False