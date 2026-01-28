import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';

import { SharedService, Resource, Stats } from '../../services/shared/shared.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-espace-b2-b',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    ToastModule,
    TooltipModule
  ],
  providers: [MessageService],
  templateUrl: './espace-b2-b.html'
})
export class EspaceB2B implements OnInit {

  resources: Resource[] = [];
  currentFolder: Resource | null = null;
  stats: Stats = { folders: 0, files: 0, storage: 0 };

  showNewFolder = false;
  showUpload = false;

  folderName = '';
  searchQuery = '';
  selectedFile: File | null = null;
  loading = false;

  constructor(
    private service: SharedService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadRoot();
    this.loadStats();
  }

  loadRoot(): void {
    this.loading = true;
    this.service.getRootResources().subscribe({
      next: (r: Resource[]) => {
        this.resources = r;
        this.currentFolder = null;
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Erreur chargement:', err);
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de charger les ressources'
        });
      }
    });
  }

  loadFolder(folder: Resource): void {
    this.loading = true;
    this.service.getChildren(folder.id).subscribe({
      next: (r: Resource[]) => {
        this.resources = r;
        this.currentFolder = folder;
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Erreur chargement dossier:', err);
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible d\'ouvrir le dossier'
        });
      }
    });
  }

  createFolder(): void {
    if (!this.folderName.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Attention',
        detail: 'Veuillez saisir un nom de dossier'
      });
      return;
    }

    this.service.createFolder(this.folderName, '', this.currentFolder?.id)
      .subscribe({
        next: () => {
          this.showNewFolder = false;
          this.folderName = '';
          this.refresh();
          this.messageService.add({
            severity: 'success',
            summary: 'Succès',
            detail: 'Dossier créé avec succès'
          });
        },
        error: (err: any) => {
          console.error('Erreur création dossier:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Impossible de créer le dossier'
          });
        }
      });
  }

  onFileSelect(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.selectedFile = files[0];
      console.log('Fichier sélectionné:', this.selectedFile?.name, this.selectedFile?.size);
    }
  }

  upload(): void {
    if (!this.selectedFile) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Attention',
        detail: 'Veuillez sélectionner un fichier'
      });
      return;
    }

    console.log('Upload du fichier:', this.selectedFile.name);

    this.service.uploadFile(this.selectedFile, '', this.currentFolder?.id)
      .subscribe({
        next: () => {
          this.showUpload = false;
          this.selectedFile = null;
          this.refresh();
          this.messageService.add({
            severity: 'success',
            summary: 'Succès',
            detail: 'Fichier uploadé avec succès'
          });
        },
        error: (err: any) => {
          console.error('Erreur upload:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Impossible d\'uploader le fichier: ' + (err.error?.message || err.message)
          });
        }
      });
  }

  confirmDelete(resource: Resource): void {
    if (confirm(`Voulez-vous vraiment supprimer "${resource.name}" ?`)) {
      this.service.delete(resource.id).subscribe({
        next: () => {
          this.refresh();
          this.messageService.add({
            severity: 'success',
            summary: 'Succès',
            detail: 'Ressource supprimée'
          });
        },
        error: (err: any) => {
          console.error('Erreur suppression:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Impossible de supprimer'
          });
        }
      });
    }
  }

  doSearch(): void {
    if (!this.searchQuery.trim()) {
      this.refresh();
      return;
    }

    this.service.search(this.searchQuery)
      .subscribe({
        next: (r: Resource[]) => {
          this.resources = r;
        },
        error: (err: any) => {
          console.error('Erreur recherche:', err);
        }
      });
  }

  loadStats(): void {
    this.service.getStats().subscribe({
      next: (s: Stats) => {
        this.stats = s;
      },
      error: (err: any) => {
        console.error('Erreur stats:', err);
      }
    });
  }

  refresh(): void {
    if (this.currentFolder) {
      this.loadFolder(this.currentFolder);
    } else {
      this.loadRoot();
    }
    this.loadStats();
  }

  formatSize(bytes: number): string {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Télécharger un fichier
   */
  downloadFile(resource: Resource): void {
    console.log('📥 Téléchargement du fichier:', resource.name);

    // Utiliser l'endpoint de téléchargement
    const downloadUrl = `${environment.apiUrl}/shared/download/${resource.id}`;

    // Créer un lien temporaire pour forcer le téléchargement
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = resource.name || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.messageService.add({
      severity: 'info',
      summary: 'Téléchargement',
      detail: `Téléchargement de ${resource.name} en cours...`
    });
  }

  /**
   * Visualiser un fichier
   */
  viewFile(resource: Resource): void {
    console.log('👁️ Visualisation du fichier:', resource.name);

    // Utiliser l'endpoint de visualisation
    const viewUrl = `${environment.apiUrl}/shared/view/${resource.id}`;

    // Ouvrir dans un nouvel onglet
    window.open(viewUrl, '_blank');

    this.messageService.add({
      severity: 'info',
      summary: 'Visualisation',
      detail: `Ouverture de ${resource.name}...`
    });
  }

  /**
   * Partager un fichier
   */
  shareFile(resource: Resource): void {
    console.log('🔗 Partage du fichier:', resource.name);

    // TODO: Implémenter la logique de partage
    // Pour l'instant, on affiche juste une notification
    this.messageService.add({
      severity: 'info',
      summary: 'Partage',
      detail: 'Fonctionnalité de partage en cours de développement'
    });

    // Exemple de ce qu'on pourrait faire :
    // 1. Ouvrir une modal pour sélectionner les utilisateurs
    // 2. Appeler this.service.share(resource.id, userIds)
    // 3. Afficher un message de confirmation
  }

  /**
   * Obtenir l'icône appropriée pour un fichier selon son extension
   */
  getFileIcon(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase() || '';

    const iconMap: { [key: string]: string } = {
      // Documents
      'pdf': 'pi-file-pdf text-red-500',
      'doc': 'pi-file-word text-blue-500',
      'docx': 'pi-file-word text-blue-500',

      // Tableurs
      'xls': 'pi-file-excel text-green-600',
      'xlsx': 'pi-file-excel text-green-600',
      'csv': 'pi-file-excel text-green-600',

      // Présentations
      'ppt': 'pi-file text-orange-500',
      'pptx': 'pi-file text-orange-500',

      // Images
      'jpg': 'pi-image text-pink-500',
      'jpeg': 'pi-image text-pink-500',
      'png': 'pi-image text-pink-500',
      'gif': 'pi-image text-pink-500',
      'svg': 'pi-image text-pink-500',
      'webp': 'pi-image text-pink-500',

      // Archives
      'zip': 'pi-file text-gray-500',
      'rar': 'pi-file text-gray-500',
      '7z': 'pi-file text-gray-500',
      'tar': 'pi-file text-gray-500',
      'gz': 'pi-file text-gray-500',

      // Texte
      'txt': 'pi-file text-gray-400',
      'md': 'pi-file text-gray-400',

      // Code
      'js': 'pi-file text-yellow-500',
      'ts': 'pi-file text-blue-600',
      'java': 'pi-file text-red-600',
      'py': 'pi-file text-blue-400',
      'html': 'pi-file text-orange-600',
      'css': 'pi-file text-blue-500',
      'json': 'pi-file text-yellow-600',
      'xml': 'pi-file text-orange-500',

      // Vidéo
      'mp4': 'pi-video text-purple-500',
      'avi': 'pi-video text-purple-500',
      'mov': 'pi-video text-purple-500',
      'mkv': 'pi-video text-purple-500',

      // Audio
      'mp3': 'pi-volume-up text-green-500',
      'wav': 'pi-volume-up text-green-500',
      'ogg': 'pi-volume-up text-green-500',
    };

    return iconMap[ext] || 'pi-file text-blue-400';
  }

  /**
   * Vérifier si un fichier est une image
   */
  isImage(filename: string): boolean {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    return ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext);
  }

  /**
   * Vérifier si un fichier est un PDF
   */
  isPdf(filename: string): boolean {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    return ext === 'pdf';
  }

  /**
   * Vérifier si un fichier est visualisable dans le navigateur
   */
  isViewable(filename: string): boolean {
    return this.isImage(filename) || this.isPdf(filename);
  }
}
