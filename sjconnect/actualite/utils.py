import os
import mimetypes
from PIL import Image
from django.core.files.storage import default_storage
from django.conf import settings
from moviepy.editor import VideoFileClip
import tempfile


def validate_file_type(file):
    """Valide le type d'un fichier uploadé"""
    allowed_types = {
        'image': ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        'video': ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm'],
        'document': ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    }

    mime_type, _ = mimetypes.guess_type(file.name)

    for category, types in allowed_types.items():
        if mime_type in types:
            return category, mime_type

    return None, mime_type


def generate_thumbnail(video_path, time_offset=1.0):
    """Génère une miniature pour une vidéo"""
    try:
        with VideoFileClip(video_path) as clip:
            # Prendre une capture à time_offset secondes (ou à la moitié si plus court)
            time = min(time_offset, clip.duration / 2)

            # Générer la miniature
            thumbnail = clip.get_frame(time)

            # Convertir en PIL Image
            image = Image.fromarray(thumbnail)

            # Redimensionner à 300x200 max
            image.thumbnail((300, 200), Image.Resampling.LANCZOS)

            return image
    except Exception as e:
        print(f"Erreur lors de la génération de miniature: {e}")
        return None


def compress_image(image_path, quality=85, max_size=(1920, 1080)):
    """Compresse une image pour optimiser la taille"""
    try:
        with Image.open(image_path) as img:
            # Convertir en RGB si nécessaire
            if img.mode in ('RGBA', 'LA', 'P'):
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'RGBA':
                    background.paste(img, mask=img.split()[-1])
                else:
                    background.paste(img)
                img = background

            # Redimensionner si trop grand
            img.thumbnail(max_size, Image.Resampling.LANCZOS)

            # Sauvegarder avec compression
            img.save(image_path, 'JPEG', quality=quality, optimize=True)

    except Exception as e:
        print(f"Erreur lors de la compression d'image: {e}")


def get_video_duration(video_path):
    """Récupère la durée d'une vidéo"""
    try:
        with VideoFileClip(video_path) as clip:
            return clip.duration
    except Exception:
        return None


def clean_filename(filename):
    """Nettoie un nom de fichier pour éviter les problèmes"""
    import re
    import unicodedata

    # Normaliser les caractères unicode
    filename = unicodedata.normalize('NFKD', filename)

    # Supprimer les caractères non-ASCII
    filename = filename.encode('ascii', 'ignore').decode('ascii')

    # Remplacer les espaces et caractères spéciaux
    filename = re.sub(r'[^\w\-_\.]', '_', filename)

    # Supprimer les underscores multiples
    filename = re.sub(r'_+', '_', filename)

    return filename