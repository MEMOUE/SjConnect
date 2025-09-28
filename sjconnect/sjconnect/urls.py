# sjconnect/urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)
from django.http import JsonResponse


def api_root(request):
    """Vue racine de l'API avec informations de base"""
    return JsonResponse({
        'message': 'Bienvenue sur l\'API SJConnect',
        'version': '1.0.0',
        'documentation': {
            'swagger': '/api/docs/',
            'redoc': '/api/redoc/',
            'schema': '/api/schema/'
        },
        'endpoints': {
            'authentification': '/api/auth/',
            'entreprises': '/api/entreprises/',
            'groupes': '/api/groupes/',
            'messages': '/api/messages/',
            'actualites': '/api/actualites/',
            'admin': '/admin/'
        }
    })


urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),

    # API Root
    path('api/', api_root, name='api-root'),

    # Apps APIs
    path('api/', include('entreprise.urls')),
    path('api/', include('actualite.urls')),

    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    # DRF Auth (for browsable API)
    path('api/auth/', include('rest_framework.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)