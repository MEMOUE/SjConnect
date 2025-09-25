# sjconnect/entreprise/auth_views.py
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.middleware.csrf import get_token
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.http import JsonResponse
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from .models import Entreprise, ProfilUtilisateur
import json

# Imports pour drf-spectacular
from drf_spectacular.utils import extend_schema, OpenApiResponse
from drf_spectacular.types import OpenApiTypes


@extend_schema(
    summary="Obtenir le token CSRF",
    description="Retourne le token CSRF nécessaire pour les requêtes frontend",
    responses={200: OpenApiResponse(description="Token CSRF retourné")},
    tags=["Authentification"]
)
@api_view(['GET'])
@permission_classes([AllowAny])
def get_csrf_token(request):
    """Retourne le token CSRF pour les requêtes frontend"""
    return JsonResponse({'csrfToken': get_token(request)})


@extend_schema(
    summary="Connexion utilisateur",
    description="Connecte un utilisateur et retourne ses informations avec celles de son entreprise",
    request={
        'application/json': {
            'type': 'object',
            'properties': {
                'username': {'type': 'string', 'description': 'Nom d\'utilisateur'},
                'password': {'type': 'string', 'description': 'Mot de passe'}
            },
            'required': ['username', 'password']
        }
    },
    responses={
        200: OpenApiResponse(description="Connexion réussie"),
        400: OpenApiResponse(description="Données manquantes ou invalides"),
        401: OpenApiResponse(description="Identifiants incorrects")
    },
    tags=["Authentification"]
)
@api_view(['POST'])
@permission_classes([AllowAny])
@method_decorator(csrf_exempt, name='dispatch')
def login_view(request):
    """Connexion utilisateur - retourne aussi les infos entreprise"""
    try:
        data = json.loads(request.body)
        username = data.get('username')
        password = data.get('password')

        if not username or not password:
            return JsonResponse({
                'error': 'Nom d\'utilisateur et mot de passe requis'
            }, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(request, username=username, password=password)

        if user is not None:
            if user.is_active:
                login(request, user)

                # Récupérer le profil utilisateur
                try:
                    profil = ProfilUtilisateur.objects.get(user=user)
                    entreprise_data = {
                        'id': profil.entreprise.id,
                        'nom': profil.entreprise.nom,
                        'email': profil.entreprise.email,
                        'description': profil.entreprise.description,
                        'est_active': profil.entreprise.est_active,
                    }

                    return JsonResponse({
                        'message': 'Connexion réussie',
                        'user': {
                            'id': user.id,
                            'username': user.username,
                            'email': user.email,
                            'first_name': user.first_name,
                            'last_name': user.last_name,
                        },
                        'profil': {
                            'role': profil.role,
                            'poste': profil.poste,
                            'entreprise': entreprise_data
                        }
                    })
                except ProfilUtilisateur.DoesNotExist:
                    return JsonResponse({
                        'error': 'Profil utilisateur non trouvé. Contactez votre administrateur.'
                    }, status=status.HTTP_400_BAD_REQUEST)
            else:
                return JsonResponse({
                    'error': 'Compte désactivé'
                }, status=status.HTTP_401_UNAUTHORIZED)
        else:
            return JsonResponse({
                'error': 'Nom d\'utilisateur ou mot de passe incorrect'
            }, status=status.HTTP_401_UNAUTHORIZED)

    except json.JSONDecodeError:
        return JsonResponse({
            'error': 'Données JSON invalides'
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return JsonResponse({
            'error': f'Erreur serveur: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@extend_schema(
    summary="Inscription nouvelle entreprise",
    description="Crée une nouvelle entreprise avec un compte administrateur",
    request={
        'application/json': {
            'type': 'object',
            'properties': {
                'nom_entreprise': {'type': 'string', 'description': 'Nom de l\'entreprise'},
                'email_entreprise': {'type': 'string', 'format': 'email', 'description': 'Email de l\'entreprise'},
                'description_entreprise': {'type': 'string', 'description': 'Description de l\'entreprise'},
                'username': {'type': 'string', 'description': 'Nom d\'utilisateur admin'},
                'email': {'type': 'string', 'format': 'email', 'description': 'Email de l\'administrateur'},
                'password': {'type': 'string', 'minLength': 8, 'description': 'Mot de passe (min 8 caractères)'},
                'first_name': {'type': 'string', 'description': 'Prénom'},
                'last_name': {'type': 'string', 'description': 'Nom'},
                'poste': {'type': 'string', 'description': 'Poste dans l\'entreprise'}
            },
            'required': ['nom_entreprise', 'email_entreprise', 'username', 'email', 'password']
        }
    },
    responses={
        201: OpenApiResponse(description="Entreprise et compte créés avec succès"),
        400: OpenApiResponse(description="Erreur de validation ou données manquantes")
    },
    tags=["Authentification"]
)
@api_view(['POST'])
@permission_classes([AllowAny])
@method_decorator(csrf_exempt, name='dispatch')
def register_entreprise_view(request):
    """Inscription d'une nouvelle entreprise et création du compte administrateur"""
    try:
        data = json.loads(request.body)

        # Données entreprise
        nom_entreprise = data.get('nom_entreprise')
        email_entreprise = data.get('email_entreprise')
        description_entreprise = data.get('description_entreprise', '')

        # Données utilisateur admin
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        first_name = data.get('first_name', '')
        last_name = data.get('last_name', '')
        poste = data.get('poste', 'Administrateur')

        # Validations
        if not all([nom_entreprise, email_entreprise, username, email, password]):
            return JsonResponse({
                'error': 'Tous les champs obligatoires doivent être remplis'
            }, status=status.HTTP_400_BAD_REQUEST)

        if len(password) < 8:
            return JsonResponse({
                'error': 'Le mot de passe doit faire au moins 8 caractères'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Vérifier si l'entreprise existe déjà
        if Entreprise.objects.filter(nom=nom_entreprise).exists():
            return JsonResponse({
                'error': 'Cette entreprise existe déjà'
            }, status=status.HTTP_400_BAD_REQUEST)

        if Entreprise.objects.filter(email=email_entreprise).exists():
            return JsonResponse({
                'error': 'Cette adresse email d\'entreprise est déjà utilisée'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Vérifier si l'utilisateur existe déjà
        if User.objects.filter(username=username).exists():
            return JsonResponse({
                'error': 'Ce nom d\'utilisateur existe déjà'
            }, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=email).exists():
            return JsonResponse({
                'error': 'Cette adresse email est déjà utilisée'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Créer l'utilisateur administrateur
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name
        )

        # Créer l'entreprise
        entreprise = Entreprise.objects.create(
            nom=nom_entreprise,
            email=email_entreprise,
            description=description_entreprise,
            createur=user
        )

        # Créer le profil utilisateur
        profil = ProfilUtilisateur.objects.create(
            user=user,
            entreprise=entreprise,
            role='ADMIN',
            poste=poste
        )

        # Connecter automatiquement l'utilisateur
        login(request, user)

        return JsonResponse({
            'message': 'Entreprise et compte créés avec succès',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
            },
            'profil': {
                'role': profil.role,
                'poste': profil.poste,
                'entreprise': {
                    'id': entreprise.id,
                    'nom': entreprise.nom,
                    'email': entreprise.email,
                    'description': entreprise.description,
                    'est_active': entreprise.est_active,
                }
            }
        }, status=status.HTTP_201_CREATED)

    except json.JSONDecodeError:
        return JsonResponse({
            'error': 'Données JSON invalides'
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return JsonResponse({
            'error': f'Erreur serveur: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@extend_schema(
    summary="Créer un compte employé",
    description="Permet à un administrateur de créer un compte employé dans son entreprise",
    request={
        'application/json': {
            'type': 'object',
            'properties': {
                'username': {'type': 'string', 'description': 'Nom d\'utilisateur'},
                'email': {'type': 'string', 'format': 'email', 'description': 'Email de l\'employé'},
                'password': {'type': 'string', 'minLength': 8, 'description': 'Mot de passe (min 8 caractères)'},
                'first_name': {'type': 'string', 'description': 'Prénom'},
                'last_name': {'type': 'string', 'description': 'Nom'},
                'poste': {'type': 'string', 'description': 'Poste dans l\'entreprise'}
            },
            'required': ['username', 'email', 'password']
        }
    },
    responses={
        201: OpenApiResponse(description="Compte employé créé avec succès"),
        400: OpenApiResponse(description="Erreur de validation"),
        403: OpenApiResponse(description="Seuls les administrateurs peuvent créer des employés")
    },
    tags=["Gestion des employés"]
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_employe_view(request):
    """Création d'un compte employé par l'administrateur de l'entreprise"""
    try:
        data = json.loads(request.body)

        # Vérifier que l'utilisateur est admin de son entreprise
        try:
            profil_admin = ProfilUtilisateur.objects.get(user=request.user)
            if profil_admin.role != 'ADMIN':
                return JsonResponse({
                    'error': 'Seuls les administrateurs peuvent créer des comptes employés'
                }, status=status.HTTP_403_FORBIDDEN)
        except ProfilUtilisateur.DoesNotExist:
            return JsonResponse({
                'error': 'Profil administrateur non trouvé'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Données utilisateur
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        first_name = data.get('first_name', '')
        last_name = data.get('last_name', '')
        poste = data.get('poste', '')

        # Validations
        if not all([username, email, password]):
            return JsonResponse({
                'error': 'Nom d\'utilisateur, email et mot de passe requis'
            }, status=status.HTTP_400_BAD_REQUEST)

        if len(password) < 8:
            return JsonResponse({
                'error': 'Le mot de passe doit faire au moins 8 caractères'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Vérifier unicité
        if User.objects.filter(username=username).exists():
            return JsonResponse({
                'error': 'Ce nom d\'utilisateur existe déjà'
            }, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=email).exists():
            return JsonResponse({
                'error': 'Cette adresse email est déjà utilisée'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Créer l'utilisateur employé
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name
        )

        # Créer le profil utilisateur dans la même entreprise
        profil = ProfilUtilisateur.objects.create(
            user=user,
            entreprise=profil_admin.entreprise,
            role='EMPLOYE',
            poste=poste
        )

        return JsonResponse({
            'message': 'Compte employé créé avec succès',
            'employe': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'poste': profil.poste,
            }
        }, status=status.HTTP_201_CREATED)

    except json.JSONDecodeError:
        return JsonResponse({
            'error': 'Données JSON invalides'
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return JsonResponse({
            'error': f'Erreur serveur: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@extend_schema(
    summary="Déconnexion utilisateur",
    description="Déconnecte l'utilisateur actuellement connecté",
    responses={
        200: OpenApiResponse(description="Déconnexion réussie"),
        500: OpenApiResponse(description="Erreur serveur")
    },
    tags=["Authentification"]
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """Déconnexion utilisateur"""
    try:
        logout(request)
        return JsonResponse({'message': 'Déconnexion réussie'})
    except Exception as e:
        return JsonResponse({
            'error': f'Erreur lors de la déconnexion: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@extend_schema(
    summary="Utilisateur actuellement connecté",
    description="Retourne les informations de l'utilisateur connecté avec son profil entreprise",
    responses={
        200: OpenApiResponse(description="Informations utilisateur retournées"),
        400: OpenApiResponse(description="Profil utilisateur non trouvé")
    },
    tags=["Authentification"]
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user_view(request):
    """Retourne les informations de l'utilisateur connecté avec son profil"""
    try:
        user = request.user
        profil = ProfilUtilisateur.objects.get(user=user)

        return JsonResponse({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'profil': {
                'role': profil.role,
                'poste': profil.poste,
                'entreprise': {
                    'id': profil.entreprise.id,
                    'nom': profil.entreprise.nom,
                    'email': profil.entreprise.email,
                    'description': profil.entreprise.description,
                    'est_active': profil.entreprise.est_active,
                }
            }
        })
    except ProfilUtilisateur.DoesNotExist:
        return JsonResponse({
            'error': 'Profil utilisateur non trouvé'
        }, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(
    summary="Liste des employés de l'entreprise",
    description="Retourne la liste de tous les employés de l'entreprise de l'utilisateur connecté",
    responses={
        200: OpenApiResponse(description="Liste des employés retournée"),
        400: OpenApiResponse(description="Profil utilisateur non trouvé")
    },
    tags=["Gestion des employés"]
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_employes_view(request):
    """Liste les employés de l'entreprise de l'utilisateur connecté"""
    try:
        profil_user = ProfilUtilisateur.objects.get(user=request.user)
        employes = ProfilUtilisateur.objects.filter(entreprise=profil_user.entreprise)

        employes_data = []
        for employe in employes:
            employes_data.append({
                'id': employe.user.id,
                'username': employe.user.username,
                'email': employe.user.email,
                'first_name': employe.user.first_name,
                'last_name': employe.user.last_name,
                'role': employe.role,
                'poste': employe.poste,
                'date_embauche': employe.date_embauche,
                'est_actif': employe.est_actif,
            })

        return JsonResponse({
            'employes': employes_data,
            'total': len(employes_data)
        })
    except ProfilUtilisateur.DoesNotExist:
        return JsonResponse({
            'error': 'Profil utilisateur non trouvé'
        }, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(
    summary="Mettre à jour le profil utilisateur",
    description="Permet à un utilisateur de mettre à jour son profil",
    request={
        'application/json': {
            'type': 'object',
            'properties': {
                'first_name': {'type': 'string', 'description': 'Prénom'},
                'last_name': {'type': 'string', 'description': 'Nom'},
                'email': {'type': 'string', 'format': 'email', 'description': 'Email'},
                'poste': {'type': 'string', 'description': 'Poste dans l\'entreprise'}
            }
        }
    },
    responses={
        200: OpenApiResponse(description="Profil mis à jour avec succès"),
        400: OpenApiResponse(description="Erreur de validation")
    },
    tags=["Profil utilisateur"]
)
@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_profile_view(request):
    """Met à jour le profil de l'utilisateur connecté"""
    try:
        data = json.loads(request.body)
        user = request.user
        profil = ProfilUtilisateur.objects.get(user=user)

        # Mise à jour des données utilisateur
        if 'first_name' in data:
            user.first_name = data['first_name']
        if 'last_name' in data:
            user.last_name = data['last_name']
        if 'email' in data:
            # Vérifier l'unicité de l'email
            if User.objects.filter(email=data['email']).exclude(id=user.id).exists():
                return JsonResponse({
                    'error': 'Cette adresse email est déjà utilisée'
                }, status=status.HTTP_400_BAD_REQUEST)
            user.email = data['email']

        user.save()

        # Mise à jour du profil
        if 'poste' in data:
            profil.poste = data['poste']

        profil.save()

        return JsonResponse({
            'message': 'Profil mis à jour avec succès',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
            },
            'profil': {
                'role': profil.role,
                'poste': profil.poste,
            }
        })

    except ProfilUtilisateur.DoesNotExist:
        return JsonResponse({
            'error': 'Profil utilisateur non trouvé'
        }, status=status.HTTP_400_BAD_REQUEST)
    except json.JSONDecodeError:
        return JsonResponse({
            'error': 'Données JSON invalides'
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return JsonResponse({
            'error': f'Erreur serveur: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@extend_schema(
    summary="Changer le mot de passe",
    description="Permet à un utilisateur de changer son mot de passe",
    request={
        'application/json': {
            'type': 'object',
            'properties': {
                'current_password': {'type': 'string', 'description': 'Mot de passe actuel'},
                'new_password': {'type': 'string', 'minLength': 8, 'description': 'Nouveau mot de passe (min 8 caractères)'}
            },
            'required': ['current_password', 'new_password']
        }
    },
    responses={
        200: OpenApiResponse(description="Mot de passe changé avec succès"),
        400: OpenApiResponse(description="Erreur de validation ou mot de passe incorrect")
    },
    tags=["Profil utilisateur"]
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password_view(request):
    """Change le mot de passe de l'utilisateur connecté"""
    try:
        data = json.loads(request.body)
        user = request.user

        current_password = data.get('current_password')
        new_password = data.get('new_password')

        if not current_password or not new_password:
            return JsonResponse({
                'error': 'Mot de passe actuel et nouveau mot de passe requis'
            }, status=status.HTTP_400_BAD_REQUEST)

        if len(new_password) < 8:
            return JsonResponse({
                'error': 'Le nouveau mot de passe doit faire au moins 8 caractères'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Vérifier le mot de passe actuel
        if not user.check_password(current_password):
            return JsonResponse({
                'error': 'Mot de passe actuel incorrect'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Changer le mot de passe
        user.set_password(new_password)
        user.save()

        return JsonResponse({
            'message': 'Mot de passe changé avec succès'
        })

    except json.JSONDecodeError:
        return JsonResponse({
            'error': 'Données JSON invalides'
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return JsonResponse({
            'error': f'Erreur serveur: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)