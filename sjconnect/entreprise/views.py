from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.utils import timezone

from .models import (
    Entreprise, Groupe, MembreGroupe, DemandeIntegration, 
    Message, ConversationDirecte
)
from .serializers import (
    EntrepriseSerializer, GroupeSerializer, GroupeListSerializer,
    MembreGroupeSerializer, DemandeIntegrationSerializer,
    MessageSerializer, ConversationDirecteSerializer,
    AjouterMembreSerializer, RepondreDemandeSerializer,
    EnvoyerMessageSerializer
)


class EntrepriseViewSet(viewsets.ModelViewSet):
    """ViewSet pour la gestion des entreprises"""
    queryset = Entreprise.objects.filter(est_active=True)
    serializer_class = EntrepriseSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=True, methods=['get'])
    def groupes_possedes(self, request, pk=None):
        """Récupère les groupes possédés par l'entreprise"""
        entreprise = self.get_object()
        groupes = entreprise.groupes_possedes.all()
        serializer = GroupeListSerializer(groupes, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def groupes_membres(self, request, pk=None):
        """Récupère les groupes où l'entreprise est membre"""
        entreprise = self.get_object()
        memberships = MembreGroupe.objects.filter(entreprise=entreprise)
        groupes = [m.groupe for m in memberships]
        serializer = GroupeListSerializer(groupes, many=True)
        return Response(serializer.data)


class GroupeViewSet(viewsets.ModelViewSet):
    """ViewSet pour la gestion des groupes"""
    queryset = Groupe.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return GroupeListSerializer
        return GroupeSerializer
    
    def perform_create(self, serializer):
        """Crée un groupe et ajoute l'entreprise propriétaire comme membre"""
        groupe = serializer.save()
        MembreGroupe.objects.create(
            entreprise=groupe.entreprise_proprietaire,
            groupe=groupe,
            statut='PROPRIETAIRE'
        )
    
    @action(detail=True, methods=['get'])
    def membres(self, request, pk=None):
        """Liste les membres du groupe"""
        groupe = self.get_object()
        membres = MembreGroupe.objects.filter(groupe=groupe)
        serializer = MembreGroupeSerializer(membres, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def ajouter_membre(self, request, pk=None):
        """Ajoute un membre au groupe"""
        groupe = self.get_object()
        serializer = AjouterMembreSerializer(data=request.data)
        
        if serializer.is_valid():
            entreprise_id = serializer.validated_data['entreprise_id']
            statut = serializer.validated_data.get('statut', 'MEMBRE')
            
            try:
                entreprise = Entreprise.objects.get(id=entreprise_id)
                membre, created = MembreGroupe.objects.get_or_create(
                    entreprise=entreprise,
                    groupe=groupe,
                    defaults={
                        'statut': statut,
                        'ajoute_par': groupe.entreprise_proprietaire
                    }
                )
                
                if created:
                    return Response({'message': 'Membre ajouté avec succès'}, status=status.HTTP_201_CREATED)
                else:
                    return Response({'message': 'L\'entreprise est déjà membre du groupe'}, 
                                  status=status.HTTP_400_BAD_REQUEST)
                    
            except Entreprise.DoesNotExist:
                return Response({'error': 'Entreprise non trouvée'}, 
                              status=status.HTTP_404_NOT_FOUND)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['delete'])
    def retirer_membre(self, request, pk=None):
        """Retire un membre du groupe"""
        groupe = self.get_object()
        entreprise_id = request.query_params.get('entreprise_id')
        
        if not entreprise_id:
            return Response({'error': 'entreprise_id requis'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        try:
            membre = MembreGroupe.objects.get(
                entreprise_id=entreprise_id,
                groupe=groupe
            )
            
            if membre.statut == 'PROPRIETAIRE':
                return Response({'error': 'Impossible de retirer le propriétaire du groupe'}, 
                              status=status.HTTP_400_BAD_REQUEST)
            
            membre.delete()
            return Response({'message': 'Membre retiré avec succès'})
            
        except MembreGroupe.DoesNotExist:
            return Response({'error': 'Membre non trouvé dans ce groupe'}, 
                          status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        """Récupère les messages du groupe"""
        groupe = self.get_object()
        
        # Récupérer l'entreprise qui fait la demande (à adapter selon votre système d'auth)
        # Pour l'instant, on suppose que l'ID de l'entreprise est passé en paramètre
        entreprise_id = request.query_params.get('entreprise_id')
        
        if not entreprise_id:
            return Response({'error': 'entreprise_id requis'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        try:
            entreprise = Entreprise.objects.get(id=entreprise_id)
            membre = MembreGroupe.objects.get(entreprise=entreprise, groupe=groupe)
            
            # Si l'entreprise est propriétaire ou membre, elle voit tous les messages
            if membre.statut in ['PROPRIETAIRE', 'MEMBRE']:
                messages = Message.objects.filter(groupe=groupe)
            # Si elle est invitée, elle ne voit que les messages publics
            else:
                messages = Message.objects.filter(
                    groupe=groupe, 
                    type_message='GROUPE_PUBLIC'
                )
            
            serializer = MessageSerializer(messages.order_by('-date_envoi'), many=True)
            return Response(serializer.data)
            
        except (Entreprise.DoesNotExist, MembreGroupe.DoesNotExist):
            return Response({'error': 'Accès non autorisé à ce groupe'}, 
                          status=status.HTTP_403_FORBIDDEN)


class DemandeIntegrationViewSet(viewsets.ModelViewSet):
    """ViewSet pour la gestion des demandes d'intégration"""
    queryset = DemandeIntegration.objects.all()
    serializer_class = DemandeIntegrationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filtre les demandes selon l'entreprise"""
        entreprise_id = self.request.query_params.get('entreprise_id')
        if entreprise_id:
            return self.queryset.filter(
                Q(entreprise_demandeur_id=entreprise_id) |
                Q(groupe_cible__entreprise_proprietaire_id=entreprise_id)
            )
        return self.queryset
    
    @action(detail=True, methods=['post'])
    def repondre(self, request, pk=None):
        """Répond à une demande d'intégration"""
        demande = self.get_object()
        serializer = RepondreDemandeSerializer(data=request.data)
        
        if serializer.is_valid():
            accepter = serializer.validated_data['accepter']
            
            # Mettre à jour la demande
            demande.statut = 'ACCEPTEE' if accepter else 'REFUSEE'
            demande.date_reponse = timezone.now()
            demande.save()
            
            # Si acceptée, ajouter l'entreprise comme membre invité
            if accepter:
                MembreGroupe.objects.create(
                    entreprise=demande.entreprise_demandeur,
                    groupe=demande.groupe_cible,
                    statut='INVITE',
                    ajoute_par=demande.groupe_cible.entreprise_proprietaire
                )
            
            return Response({'message': f'Demande {"acceptée" if accepter else "refusée"}'})
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MessageViewSet(viewsets.ModelViewSet):
    """ViewSet pour la gestion des messages"""
    queryset = Message.objects.all()
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filtre les messages selon l'entreprise et le type"""
        entreprise_id = self.request.query_params.get('entreprise_id')
        if not entreprise_id:
            return Message.objects.none()
        
        return Message.objects.filter(
            Q(expediteur_id=entreprise_id) |
            Q(destinataire_id=entreprise_id) |
            Q(groupe__membregroupe__entreprise_id=entreprise_id)
        ).distinct()
    
    @action(detail=False, methods=['post'])
    def envoyer(self, request):
        """Envoie un nouveau message"""
        serializer = EnvoyerMessageSerializer(data=request.data)
        
        if serializer.is_valid():
            # Récupérer l'entreprise expéditrice (à adapter selon votre système d'auth)
            entreprise_id = request.data.get('expediteur_id')
            if not entreprise_id:
                return Response({'error': 'expediteur_id requis'}, 
                              status=status.HTTP_400_BAD_REQUEST)
            
            try:
                expediteur = Entreprise.objects.get(id=entreprise_id)
                
                # Créer le message
                message_data = {
                    'expediteur': expediteur,
                    'contenu': serializer.validated_data['contenu'],
                    'type_message': serializer.validated_data['type_message']
                }
                
                # Ajouter le groupe ou destinataire selon le type
                if serializer.validated_data['type_message'] in ['GROUPE_PUBLIC', 'GROUPE_PRIVE']:
                    groupe_id = serializer.validated_data['groupe_id']
                    message_data['groupe'] = get_object_or_404(Groupe, id=groupe_id)
                else:
                    destinataire_id = serializer.validated_data['destinataire_id']
                    message_data['destinataire'] = get_object_or_404(Entreprise, id=destinataire_id)
                
                message = Message.objects.create(**message_data)
                
                # Mettre à jour la conversation directe si c'est un message direct
                if message.type_message == 'DIRECT':
                    conv, created = ConversationDirecte.objects.get_or_create(
                        entreprise1=min(expediteur, message.destinataire, key=lambda e: e.id),
                        entreprise2=max(expediteur, message.destinataire, key=lambda e: e.id)
                    )
                    conv.save()  # Met à jour derniere_activite
                
                response_serializer = MessageSerializer(message)
                return Response(response_serializer.data, status=status.HTTP_201_CREATED)
                
            except Entreprise.DoesNotExist:
                return Response({'error': 'Entreprise expéditrice non trouvée'}, 
                              status=status.HTTP_404_NOT_FOUND)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def conversation(self, request):
        """Récupère les messages d'une conversation directe"""
        entreprise1_id = request.query_params.get('entreprise1_id')
        entreprise2_id = request.query_params.get('entreprise2_id')
        
        if not entreprise1_id or not entreprise2_id:
            return Response({'error': 'entreprise1_id et entreprise2_id requis'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        messages = Message.objects.filter(
            type_message='DIRECT',
            expediteur_id__in=[entreprise1_id, entreprise2_id],
            destinataire_id__in=[entreprise1_id, entreprise2_id]
        ).order_by('-date_envoi')
        
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)


class ConversationDirecteViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet pour les conversations directes (lecture seule)"""
    queryset = ConversationDirecte.objects.all()
    serializer_class = ConversationDirecteSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filtre les conversations selon l'entreprise"""
        entreprise_id = self.request.query_params.get('entreprise_id')
        if entreprise_id:
            return self.queryset.filter(
                Q(entreprise1_id=entreprise_id) | Q(entreprise2_id=entreprise_id)
            )
        return self.queryset