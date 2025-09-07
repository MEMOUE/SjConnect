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
    # API REST
    path('api/', include(router.urls)),
    
    # API d'authentification DRF (optionnel)
    path('api-auth/', include('rest_framework.urls')),
]