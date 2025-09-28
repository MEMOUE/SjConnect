# actualite/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Configuration du router pour l'API REST
router = DefaultRouter()
router.register(r'categories', views.CategorieActualiteViewSet)
router.register(r'tags', views.TagActualiteViewSet)
router.register(r'actualites', views.ActualiteViewSet, basename='actualite')
router.register(r'notifications', views.NotificationActualiteViewSet, basename='notification')

app_name = 'actualite'

urlpatterns = [
    # API REST pour les actualités
    path('', include(router.urls)),
]