
# actualite/signals.py
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.auth.models import User
from django.utils import timezone
from .models import (
    Actualite, CommentaireActualite, LikeActualite,
    NotificationActualite, MediaActualite
)
from entreprise.models import ProfilUtilisateur


@receiver(post_save, sender=Actualite)
def actualite_post_save(sender, instance, created, **kwargs):
    """Signal déclenché après la sauvegarde d'une actualité"""
    if created and instance.statut == 'PUBLIE' and instance.notifications_actives:
        # Créer des notifications pour les utilisateurs concernés
        create_actualite_notifications(instance)


@receiver(post_save, sender=CommentaireActualite)
def commentaire_post_save(sender, instance, created, **kwargs):
    """Signal déclenché après la sauvegarde d'un commentaire"""
    if created:
        # Notifier l'auteur de l'actualité si ce n'est pas lui qui commente
        if instance.auteur != instance.actualite.auteur:
            NotificationActualite.objects.get_or_create(
                actualite=instance.actualite,
                utilisateur=instance.actualite.auteur,
                type_notification='COMMENTAIRE',
                defaults={'est_lue': False}
            )

        # Notifier l'auteur du commentaire parent si c'est une réponse
        if instance.parent and instance.auteur != instance.parent.auteur:
            NotificationActualite.objects.get_or_create(
                actualite=instance.actualite,
                utilisateur=instance.parent.auteur,
                type_notification='COMMENTAIRE',
                defaults={'est_lue': False}
            )


@receiver(post_save, sender=LikeActualite)
def like_post_save(sender, instance, created, **kwargs):
    """Signal déclenché après la sauvegarde d'un like"""
    if created and instance.utilisateur != instance.actualite.auteur:
        # Notifier l'auteur de l'actualité
        NotificationActualite.objects.get_or_create(
            actualite=instance.actualite,
            utilisateur=instance.actualite.auteur,
            type_notification='LIKE',
            defaults={'est_lue': False}
        )


@receiver(post_delete, sender=MediaActualite)
def media_post_delete(sender, instance, **kwargs):
    """Signal déclenché après la suppression d'un média"""
    # Supprimer le fichier physique
    if instance.file:
        try:
            instance.file.delete(save=False)
        except Exception:
            pass  # Ignore les erreurs de suppression de fichier

    if instance.miniature:
        try:
            instance.miniature.delete(save=False)
        except Exception:
            pass


def create_actualite_notifications(actualite):
    """Crée les notifications pour une nouvelle actualité"""
    try:
        # Récupérer l'entreprise de l'auteur
        profil_auteur = ProfilUtilisateur.objects.get(user=actualite.auteur)

        # Définir les utilisateurs à notifier selon la visibilité
        if actualite.visibilite == 'PUBLIC':
            # Notifier tous les utilisateurs actifs (limitons à 100 pour éviter la surcharge)
            utilisateurs = User.objects.filter(
                is_active=True,
                profilutilisateur__est_actif=True
            ).exclude(id=actualite.auteur.id)[:100]

        elif actualite.visibilite == 'PRIVE':
            # Notifier seulement les collègues de la même entreprise
            utilisateurs = User.objects.filter(
                profilutilisateur__entreprise=profil_auteur.entreprise,
                is_active=True,
                profilutilisateur__est_actif=True
            ).exclude(id=actualite.auteur.id)

        else:
            # Pour les autres types de visibilité, pas de notification automatique
            utilisateurs = []

        # Créer les notifications en lot
        notifications = []
        for utilisateur in utilisateurs:
            notifications.append(
                NotificationActualite(
                    actualite=actualite,
                    utilisateur=utilisateur,
                    type_notification='NOUVELLE',
                    est_lue=False
                )
            )

        if notifications:
            NotificationActualite.objects.bulk_create(
                notifications,
                ignore_conflicts=True  # Éviter les doublons
            )

    except ProfilUtilisateur.DoesNotExist:
        pass  # Ignore si l'auteur n'a pas de profil entreprise

