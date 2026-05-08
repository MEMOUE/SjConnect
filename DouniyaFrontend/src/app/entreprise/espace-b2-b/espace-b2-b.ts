import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MultiSelectModule } from 'primeng/multiselect';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';

import { SharedService, Resource, Stats, ShareUser } from '../../services/shared/shared.service';

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
    TooltipModule,
    MultiSelectModule,
    ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './espace-b2-b.html'
})
export class EspaceB2B implements OnInit {

  resources: Resource[] = [];
  currentFolder: Resource | null = null;
  stats: Stats = { folders: 0, files: 0, storage: 0 };

  // ── Dialogs ─────────────────────────────────────────────────────────────
  showNewFolder = false;
  showUpload = false;
  showShareDialog = false;
  showRenameDialog = false;

  folderName = '';
  searchQuery = '';
  selectedFile: File | null = null;
  loading = false;

  // ── Partage ─────────────────────────────────────────────────────────────
  shareResource: Resource | null = null;
  shareEmployees: ShareUser[] = [];
  selectedShareUsers: ShareUser[] = [];
  sharedWithUsers: ShareUser[] = [];
  isLoadingShare = false;

  // ── Renommer ────────────────────────────────────────────────────────────
  renameResource: Resource | null = null;
  renameValue = '';

  constructor(
    private service: SharedService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.loadRoot();
    this.loadStats();
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  loadRoot(): void {
    this.loading = true;
    this.service.getRootResources().subscribe({
      next: (r) => { this.resources = r; this.currentFolder = null; this.loading = false; },
      error: () => {
        this.loading = false;
        this.toast('error', 'Erreur', 'Impossible de charger les ressources');
      }
    });
  }

  loadFolder(folder: Resource): void {
    this.loading = true;
    this.service.getChildren(folder.id).subscribe({
      next: (r) => { this.resources = r; this.currentFolder = folder; this.loading = false; },
      error: () => {
        this.loading = false;
        this.toast('error', 'Erreur', 'Impossible d\'ouvrir le dossier');
      }
    });
  }

  // ── Créer dossier ─────────────────────────────────────────────────────────

  createFolder(): void {
    if (!this.folderName.trim()) {
      this.toast('warn', 'Attention', 'Veuillez saisir un nom de dossier');
      return;
    }
    this.service.createFolder(this.folderName, '', this.currentFolder?.id).subscribe({
      next: () => {
        this.showNewFolder = false;
        this.folderName = '';
        this.refresh();
        this.toast('success', 'Succès', 'Dossier créé avec succès');
      },
      error: () => this.toast('error', 'Erreur', 'Impossible de créer le dossier')
    });
  }

  // ── Upload ────────────────────────────────────────────────────────────────

  onFileSelect(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.selectedFile = files[0];
    }
  }

  upload(): void {
    if (!this.selectedFile) {
      this.toast('warn', 'Attention', 'Veuillez sélectionner un fichier');
      return;
    }
    this.service.uploadFile(this.selectedFile, '', this.currentFolder?.id).subscribe({
      next: () => {
        this.selectedFile = null;
        this.refresh();
        this.toast('success', 'Succès', 'Fichier uploadé avec succès');
      },
      error: (err) => this.toast('error', 'Erreur',
        'Impossible d\'uploader: ' + (err.error?.message || err.message))
    });
  }

  // ── Télécharger (via Blob — le token auth est inclus par l'interceptor) ──

  downloadFile(resource: Resource): void {
    this.toast('info', 'Téléchargement', `Préparation de ${resource.name}...`);

    this.service.downloadFile(resource.id).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = resource.name || 'download';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        this.toast('success', 'Succès', `${resource.name} téléchargé`);
      },
      error: () => this.toast('error', 'Erreur', 'Impossible de télécharger le fichier')
    });
  }

  // ── Visualiser (via Blob — le token auth est inclus par l'interceptor) ────

  viewFile(resource: Resource): void {
    this.service.viewFile(resource.id).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        // Libérer l'URL après un délai (le navigateur a besoin de temps pour l'ouvrir)
        setTimeout(() => window.URL.revokeObjectURL(url), 60000);
      },
      error: () => this.toast('error', 'Erreur', 'Impossible de visualiser le fichier')
    });
  }

  // ── Partager ──────────────────────────────────────────────────────────────

  openShareDialog(resource: Resource): void {
    this.shareResource = resource;
    this.selectedShareUsers = [];
    this.sharedWithUsers = [];
    this.isLoadingShare = true;
    this.showShareDialog = true;

    // Charger en parallèle : employés disponibles + déjà partagés
    this.service.getEmployeesForShare().subscribe({
      next: (employees) => {
        this.shareEmployees = employees;
        this.isLoadingShare = false;
      },
      error: () => {
        this.isLoadingShare = false;
        this.toast('error', 'Erreur', 'Impossible de charger les employés');
      }
    });

    this.service.getSharedWith(resource.id).subscribe({
      next: (users) => this.sharedWithUsers = users,
      error: () => {} // silencieux
    });
  }

  confirmShare(): void {
    if (!this.shareResource || this.selectedShareUsers.length === 0) return;

    const userIds = this.selectedShareUsers.map(u => u.id);
    this.service.share(this.shareResource.id, userIds).subscribe({
      next: () => {
        this.showShareDialog = false;
        this.toast('success', 'Succès',
          `Ressource partagée avec ${userIds.length} personne(s)`);
      },
      error: () => this.toast('error', 'Erreur', 'Impossible de partager')
    });
  }

  removeShare(user: ShareUser): void {
    if (!this.shareResource) return;
    this.service.unshare(this.shareResource.id, user.id).subscribe({
      next: () => {
        this.sharedWithUsers = this.sharedWithUsers.filter(u => u.id !== user.id);
        this.toast('success', 'Succès', `Partage retiré pour ${user.name}`);
      },
      error: () => this.toast('error', 'Erreur', 'Impossible de retirer le partage')
    });
  }

  // ── Renommer ──────────────────────────────────────────────────────────────

  openRenameDialog(resource: Resource): void {
    this.renameResource = resource;
    this.renameValue = resource.name;
    this.showRenameDialog = true;
  }

  confirmRename(): void {
    if (!this.renameResource || !this.renameValue.trim()) return;
    this.service.rename(this.renameResource.id, this.renameValue.trim()).subscribe({
      next: () => {
        this.showRenameDialog = false;
        this.refresh();
        this.toast('success', 'Succès', 'Ressource renommée');
      },
      error: () => this.toast('error', 'Erreur', 'Impossible de renommer')
    });
  }

  // ── Supprimer ─────────────────────────────────────────────────────────────

  confirmDelete(resource: Resource): void {
    this.confirmationService.confirm({
      message: `Voulez-vous vraiment supprimer "${resource.name}" ?`,
      header: 'Confirmer la suppression',
      icon: 'pi pi-trash',
      acceptLabel: 'Supprimer',
      rejectLabel: 'Annuler',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.service.delete(resource.id).subscribe({
          next: () => {
            this.refresh();
            this.toast('success', 'Succès', 'Ressource supprimée');
          },
          error: () => this.toast('error', 'Erreur', 'Impossible de supprimer')
        });
      }
    });
  }

  // ── Recherche ─────────────────────────────────────────────────────────────

  doSearch(): void {
    if (!this.searchQuery.trim()) { this.refresh(); return; }
    this.service.search(this.searchQuery).subscribe({
      next: (r) => this.resources = r,
      error: () => this.toast('error', 'Erreur', 'Erreur de recherche')
    });
  }

  // ── Stats & Refresh ───────────────────────────────────────────────────────

  loadStats(): void {
    this.service.getStats().subscribe({
      next: (s) => this.stats = s,
      error: () => {}
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

  // ── Utilitaires ───────────────────────────────────────────────────────────

  formatSize(bytes: number): string {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  getFileIcon(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const iconMap: Record<string, string> = {
      pdf: 'pi-file-pdf text-red-500', doc: 'pi-file-word text-blue-500',
      docx: 'pi-file-word text-blue-500', xls: 'pi-file-excel text-green-600',
      xlsx: 'pi-file-excel text-green-600', csv: 'pi-file-excel text-green-600',
      ppt: 'pi-file text-orange-500', pptx: 'pi-file text-orange-500',
      jpg: 'pi-image text-pink-500', jpeg: 'pi-image text-pink-500',
      png: 'pi-image text-pink-500', gif: 'pi-image text-pink-500',
      svg: 'pi-image text-pink-500', webp: 'pi-image text-pink-500',
      zip: 'pi-file text-gray-500', rar: 'pi-file text-gray-500',
      mp4: 'pi-video text-purple-500', avi: 'pi-video text-purple-500',
      mp3: 'pi-volume-up text-green-500', wav: 'pi-volume-up text-green-500',
      txt: 'pi-file text-gray-400', md: 'pi-file text-gray-400',
      js: 'pi-file text-yellow-500', ts: 'pi-file text-blue-600',
      java: 'pi-file text-red-600', py: 'pi-file text-blue-400',
      html: 'pi-file text-orange-600', css: 'pi-file text-blue-500',
      json: 'pi-file text-yellow-600',
    };
    return iconMap[ext] || 'pi-file text-blue-400';
  }

  isViewable(filename: string): boolean {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    return ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'pdf', 'txt', 'html'].includes(ext);
  }

  private toast(severity: string, summary: string, detail: string): void {
    this.messageService.add({ severity, summary, detail, life: 3000 });
  }
}
