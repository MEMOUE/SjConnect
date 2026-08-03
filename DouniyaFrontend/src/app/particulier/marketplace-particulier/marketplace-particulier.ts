import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Publication, PublicationService, CreatePublicationRequest } from '../../services/publication/publication.service';
import { ChatService } from '../../services/chat/chat.service';
import { AuthService } from '../../services/auth/auth.service';
import { environment } from '../../../environments/environment';
import { ParticulierNav } from '../particulier-nav/particulier-nav';

@Component({
  selector: 'app-marketplace-particulier',
  standalone: true,
  imports: [CommonModule, FormsModule, ParticulierNav],
  templateUrl: './marketplace-particulier.html',
  styleUrl: './marketplace-particulier.css'
})
export class MarketplaceParticulier implements OnInit {

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  publications: Publication[] = [];
  loadingFeed = false;
  onglet: 'feed' | 'mes-publications' = 'feed';
  searchQuery = '';
  searching = false;

  // ── Formulaire de publication ────────────────────────────────────────────
  titre = '';
  contenu = '';
  showForm = false;
  submitting = false;
  charCount = 0;
  readonly MAX_CHARS = 2000;

  mediaFichier: File | null = null;
  mediaUrl?: string;
  mediaType?: string;
  mediaNom?: string;
  uploadingMedia = false;

  currentUserId: number = 0;

  private contactingMap = new Map<number, boolean>();

  toast: { type: 'success' | 'error' | 'info'; message: string } | null = null;
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private publicationService: PublicationService,
    private chatService: ChatService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUserValue();
    if (user) this.currentUserId = user.id;
    this.loadFeed();
  }

  loadFeed(): void {
    this.loadingFeed = true;
    this.publicationService.getFeed().subscribe({
      next: pubs => {
        this.publications = pubs;
        this.loadingFeed = false;
      },
      error: () => {
        this.loadingFeed = false;
        this.showToast('error', 'Impossible de charger les offres');
      }
    });
  }

  switchOnglet(o: 'feed' | 'mes-publications'): void {
    this.onglet = o;
    if (o === 'mes-publications') {
      this.loadingFeed = true;
      this.publicationService.getMesPublications().subscribe({
        next: pubs => {
          this.publications = pubs;
          this.loadingFeed = false;
        },
        error: () => {
          this.loadingFeed = false;
          this.showToast('error', 'Impossible de charger vos publications');
        }
      });
    } else {
      this.loadFeed();
    }
  }

  onSearch(): void {
    if (!this.searchQuery.trim()) { this.loadFeed(); return; }
    this.searching = true;
    this.publicationService.search(this.searchQuery).subscribe({
      next: pubs => {
        // Le back-end ne filtre pas la recherche par autoriseParticuliers : on filtre côté client.
        this.publications = pubs.filter(p => p.autoriseParticuliers);
        this.searching = false;
      },
      error: () => {
        this.searching = false;
        this.showToast('error', 'Erreur lors de la recherche');
      }
    });
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.loadFeed();
  }

  // ── Formulaire de publication ────────────────────────────────────────────

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) this.resetForm();
  }

  onContenuChange(): void {
    this.charCount = this.contenu.length;
  }

  triggerFileInput(): void { this.fileInput.nativeElement.click(); }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];

    if (file.size > 10 * 1024 * 1024) {
      this.showToast('error', 'Fichier trop volumineux (max 10 MB)');
      return;
    }

    this.uploadingMedia = true;
    this.publicationService.uploadMedia(file).subscribe({
      next: res => {
        this.mediaUrl  = res.data?.fileUrl;
        this.mediaType = res.data?.fileType;
        this.mediaNom  = file.name;
        this.mediaFichier = file;
        this.uploadingMedia = false;
      },
      error: () => {
        this.uploadingMedia = false;
        this.showToast('error', "Impossible d'uploader ce fichier");
        input.value = '';
      }
    });
  }

  removeMedia(): void {
    this.mediaFichier = null;
    this.mediaUrl  = undefined;
    this.mediaType = undefined;
    this.mediaNom  = undefined;
    if (this.fileInput) this.fileInput.nativeElement.value = '';
  }

  isMediaImage(): boolean {
    if (!this.mediaFichier) return false;
    return this.mediaFichier.type.startsWith('image') ||
      !!this.mediaNom?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  }

  publier(): void {
    if (!this.contenu.trim()) { this.showToast('error', 'Le contenu est requis'); return; }
    if (this.contenu.length > this.MAX_CHARS) {
      this.showToast('error', `Maximum ${this.MAX_CHARS} caractères`);
      return;
    }

    this.submitting = true;
    const request: CreatePublicationRequest = {
      titre: this.titre || undefined,
      contenu: this.contenu,
      typesEntreprisesVisibles: [],
      mediaUrl:  this.mediaUrl,
      mediaType: this.mediaType,
      mediaNom:  this.mediaNom,
      // Toujours visible dans le marketplace des particuliers : c'est l'auteur.
      autoriseParticuliers: true,
    };

    this.publicationService.createPublication(request).subscribe({
      next: res => {
        this.submitting = false;
        if (res.success && res.data) {
          this.publications.unshift(res.data);
          this.showToast('success', 'Publication créée avec succès !');
          this.toggleForm();
        } else {
          this.showToast('error', res.message || 'Erreur lors de la publication');
        }
      },
      error: err => {
        this.submitting = false;
        this.showToast('error', err.error?.message || 'Impossible de créer la publication');
      }
    });
  }

  resetForm(): void {
    this.titre = '';
    this.contenu = '';
    this.charCount = 0;
    this.removeMedia();
  }

  isOwnPublication(pub: Publication): boolean {
    return !!pub.auteurId && pub.auteurId === this.currentUserId;
  }

  supprimerPublication(pub: Publication, index: number): void {
    if (!confirm('Supprimer cette publication ?')) return;
    if (!pub.id) return;

    this.publicationService.delete(pub.id).subscribe({
      next: () => {
        this.publications.splice(index, 1);
        this.showToast('success', 'Publication supprimée');
      },
      error: err => {
        this.showToast('error', err.error?.message || 'Impossible de supprimer cette publication');
      }
    });
  }

  canContact(pub: Publication): boolean {
    return !!pub.auteurEntrepriseId;
  }

  isContactingPublication(pub: Publication): boolean {
    return pub.id ? (this.contactingMap.get(pub.id) ?? false) : false;
  }

  contacterEntreprise(pub: Publication): void {
    if (!pub.auteurEntrepriseId || !pub.id) return;

    this.contactingMap.set(pub.id, true);
    this.showToast('info', `Ouverture de la conversation avec ${pub.auteurNom}...`);

    this.chatService.contacterEntreprise(pub.auteurEntrepriseId).subscribe({
      next: res => {
        pub.id && this.contactingMap.set(pub.id, false);
        if (res.success && res.data) {
          this.router.navigate(['/particulier/chat'], {
            queryParams: { conversationId: res.data.id }
          });
        } else {
          this.showToast('error', "Impossible d'ouvrir la conversation");
        }
      },
      error: err => {
        pub.id && this.contactingMap.set(pub.id, false);
        this.showToast('error', err.error?.message || 'Impossible de contacter cette entreprise');
      }
    });
  }

  getInitiales(pub: Publication): string {
    if (pub.auteurInitiales) return pub.auteurInitiales;
    if (pub.auteurNom) {
      const p = pub.auteurNom.trim().split(' ');
      return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : pub.auteurNom.substring(0, 2).toUpperCase();
    }
    return 'DC';
  }

  getMediaUrl(pub: Publication): string {
    if (!pub.mediaUrl) return '';
    if (pub.mediaUrl.startsWith('http')) return pub.mediaUrl;
    return `${environment.apiUrl.replace('/api', '')}${pub.mediaUrl}`;
  }

  isImage(pub: Publication): boolean {
    return pub.mediaType?.startsWith('image') ?? pub.mediaUrl?.match(/\.(jpg|jpeg|png|gif|webp)$/i) != null;
  }

  openMedia(pub: Publication): void {
    window.open(this.getMediaUrl(pub), '_blank');
  }

  getTimeAgo(dateStr?: string): string {
    if (!dateStr) return 'Maintenant';
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "À l'instant";
    if (m < 60) return `il y a ${m} min`;
    const h = Math.floor(m / 60);
    if (h < 24) return `il y a ${h}h`;
    return `il y a ${Math.floor(h / 24)}j`;
  }

  showToast(type: 'success' | 'error' | 'info', message: string): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toast = { type, message };
    this.toastTimer = setTimeout(() => { this.toast = null; }, 4000);
  }
}
