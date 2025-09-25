# sjconnect/entreprise/urls.py - VERSION MISE À JOUR
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from . import auth_views

# Configuration du router pour l'API REST
router = DefaultRouter()
router.register(r'entreprises', views.EntrepriseViewSet)
router.register(r'groupes', views.GroupeViewSet)
router.register(r'demandes-integration', views.DemandeIntegrationViewSet)
router.register(r'messages', views.MessageViewSet)
router.register(r'conversations', views.ConversationDirecteViewSet)

app_name = 'entreprise'

urlpatterns = [
    # API d'authentification
    path('csrf/', auth_views.get_csrf_token, name='csrf_token'),
    path('auth/login/', auth_views.login_view, name='auth_login'),
    path('auth/register/', auth_views.register_view, name='auth_register'),
    path('auth/logout/', auth_views.logout_view, name='auth_logout'),
    path('auth/user/', auth_views.current_user_view, name='current_user'),
    path('auth/profile/', auth_views.update_profile_view, name='update_profile'),
    path('auth/change-password/', auth_views.change_password_view, name='change_password'),

    # API REST - toutes les autres routes
    path('', include(router.urls)),

    # API d'authentification DRF (optionnel, pour le browsable API)
    path('auth/', include('rest_framework.urls')),
]