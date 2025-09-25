from rest_framework import serializers
from .models import Entreprise, Groupe, MembreGroupe, DemandeIntegration, Message, ConversationDirecte


class EntrepriseSerializer(serializers.ModelSerializer):
    """Serializer pour les entreprises"""
    groupes_possedes_count = serializers.SerializerMethodField()

    class Meta:
        model = Entreprise
        fields = ['id', 'nom', 'email', 'description', 'date_creation', 'est_active', 'groupes_possedes_count']
        read_only_fields = ['date_creation']

    def get_groupes_possedes_count(self, obj):
        return obj.groupes_possedes.count()


class MembreGroupeSerializer(serializers.ModelSerializer):
    """Serializer pour les membres de groupe"""
    utilisateur_username = serializers.CharField(source='utilisateur.username', read_only=True)
    utilisateur_email = serializers.CharField(source='utilisateur.email', read_only=True)
    groupe_nom = serializers.CharField(source='groupe.nom', read_only=True)

    class Meta:
        model = MembreGroupe
        fields = ['id', 'utilisateur', 'utilisateur_username', 'utilisateur_email', 'groupe', 'groupe_nom', 'statut', 'date_ajout']
        read_only_fields = ['date_ajout']


class GroupeSerializer(serializers.ModelSerializer):
    """Serializer pour les groupes"""
    entreprise_proprietaire_nom = serializers.CharField(source='entreprise_proprietaire.nom', read_only=True)
    membres = MembreGroupeSerializer(source='membregroupe_set', many=True, read_only=True)
    nombre_membres = serializers.SerializerMethodField()

    class Meta:
        model = Groupe
        fields = [
            'id', 'nom', 'description', 'entreprise_proprietaire', 'entreprise_proprietaire_nom',
            'date_creation', 'est_public', 'membres', 'nombre_membres'
        ]
        read_only_fields = ['date_creation']

    def get_nombre_membres(self, obj):
        return obj.membregroupe_set.count()


class GroupeListSerializer(serializers.ModelSerializer):
    """Serializer simplifié pour lister les groupes"""
    entreprise_proprietaire_nom = serializers.CharField(source='entreprise_proprietaire.nom', read_only=True)
    nombre_membres = serializers.SerializerMethodField()

    class Meta:
        model = Groupe
        fields = [
            'id', 'nom', 'description', 'entreprise_proprietaire_nom',
            'date_creation', 'est_public', 'nombre_membres'
        ]

    def get_nombre_membres(self, obj):
        return obj.membregroupe_set.count()


class DemandeIntegrationSerializer(serializers.ModelSerializer):
    """Serializer pour les demandes d'intégration"""
    entreprise_demandeur_nom = serializers.CharField(source='entreprise_demandeur.nom', read_only=True)
    groupe_cible_nom = serializers.CharField(source='groupe_cible.nom', read_only=True)
    groupe_proprietaire_nom = serializers.CharField(source='groupe_cible.entreprise_proprietaire.nom', read_only=True)

    class Meta:
        model = DemandeIntegration
        fields = [
            'id', 'entreprise_demandeur', 'entreprise_demandeur_nom',
            'groupe_cible', 'groupe_cible_nom', 'groupe_proprietaire_nom',
            'message_demande', 'statut', 'date_demande', 'date_reponse'
        ]
        read_only_fields = ['date_demande', 'date_reponse']


class MessageSerializer(serializers.ModelSerializer):
    """Serializer pour les messages"""
    expediteur_username = serializers.CharField(source='expediteur.username', read_only=True)
    destinataire_username = serializers.CharField(source='destinataire.username', read_only=True)
    groupe_nom = serializers.CharField(source='groupe.nom', read_only=True)

    class Meta:
        model = Message
        fields = [
            'id', 'expediteur', 'expediteur_username', 'contenu', 'type_message',
            'date_envoi', 'groupe', 'groupe_nom', 'destinataire', 'destinataire_username',
            'est_lu', 'est_modifie', 'date_modification'
        ]
        read_only_fields = ['date_envoi', 'est_modifie', 'date_modification']

    def validate(self, data):
        """Validation des données du message"""
        type_message = data.get('type_message')
        groupe = data.get('groupe')
        destinataire = data.get('destinataire')

        if type_message in ['GROUPE_PUBLIC', 'GROUPE_PRIVE'] and not groupe:
            raise serializers.ValidationError("Un message de groupe doit avoir un groupe associé")

        if type_message == 'DIRECT' and not destinataire:
            raise serializers.ValidationError("Un message direct doit avoir un destinataire")

        return data


class ConversationDirecteSerializer(serializers.ModelSerializer):
    """Serializer pour les conversations directes"""
    utilisateur1_username = serializers.CharField(source='utilisateur1.username', read_only=True)
    utilisateur2_username = serializers.CharField(source='utilisateur2.username', read_only=True)
    derniers_messages = serializers.SerializerMethodField()

    class Meta:
        model = ConversationDirecte
        fields = [
            'id', 'utilisateur1', 'utilisateur1_username', 'utilisateur2', 'utilisateur2_username',
            'date_creation', 'derniere_activite', 'derniers_messages'
        ]
        read_only_fields = ['date_creation', 'derniere_activite']

    def get_derniers_messages(self, obj):
        """Récupère les 5 derniers messages de la conversation"""
        messages = Message.objects.filter(
            type_message='DIRECT',
            expediteur__in=[obj.utilisateur1, obj.utilisateur2],
            destinataire__in=[obj.utilisateur1, obj.utilisateur2]
        ).order_by('-date_envoi')[:5]

        return MessageSerializer(messages, many=True).data


# Serializers pour les actions spécifiques

class AjouterMembreSerializer(serializers.Serializer):
    """Serializer pour ajouter un membre à un groupe"""
    utilisateur_id = serializers.IntegerField()
    statut = serializers.ChoiceField(choices=MembreGroupe.STATUT_CHOICES, default='MEMBRE')


class RepondreDemandeSerializer(serializers.Serializer):
    """Serializer pour répondre à une demande d'intégration"""
    accepter = serializers.BooleanField()
    message_reponse = serializers.CharField(required=False, allow_blank=True)


class EnvoyerMessageSerializer(serializers.Serializer):
    """Serializer pour envoyer un message"""
    contenu = serializers.CharField()
    type_message = serializers.ChoiceField(choices=Message.TYPE_CHOICES)
    groupe_id = serializers.IntegerField(required=False)
    destinataire_id = serializers.IntegerField(required=False)

    def validate(self, data):
        type_message = data.get('type_message')
        groupe_id = data.get('groupe_id')
        destinataire_id = data.get('destinataire_id')

        if type_message in ['GROUPE_PUBLIC', 'GROUPE_PRIVE'] and not groupe_id:
            raise serializers.ValidationError("Un message de groupe doit avoir un groupe_id")

        if type_message == 'DIRECT' and not destinataire_id:
            raise serializers.ValidationError("Un message direct doit avoir un destinataire_id")

        return data