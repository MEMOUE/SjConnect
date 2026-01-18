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

  showNewFolder = true;
  showUpload = true;

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
}
