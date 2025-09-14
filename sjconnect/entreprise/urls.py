# entreprise/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Configuration du router pour l'API REST
router = DefaultRouter()
router.register(r'entreprises', views.EntrepriseViewSet)
router.register(r'groupes', views.GroupeViewSet)
router.register(r'demandes-integration', views.DemandeIntegrationViewSet)
router.register(r'messages', views.MessageViewSet)
router.register(r'conversations', views.ConversationDirecteViewSet)

app_name = 'entreprise'

urlpatterns = [
    # API REST - toutes les routes sont sous /api/ grâce à l'inclusion dans le urls.py principal
    path('', include(router.urls)),
    
    # API d'authentification DRF (optionnel)
    path('auth/', include('rest_framework.urls')),
]