import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Publication, PublicationService, CreatePublicationRequest } from '../../services/publication/publication.service';
import { ChatService } from '../../services/chat/chat.service';
import { AuthService } from '../../services/auth/auth.service';
import { environment } from '../../../environments/environment';

export interface TypeEntreprise {
  code: string;
  libelle: string;
  icone: string;
  couleur: string;
  checked: boolean;
}

@Component({
  selector: 'app-market-pace',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './market-pace.html',
  styleUrl: './market-pace.css'
})
export class MarketPace implements OnInit {

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  // ── Feed ─────────────────────────────────────────────────────────────────
  publications: Publication[] = [];
  loadingFeed = false;
  onglet: 'feed' | 'mes-publications' = 'feed';

  // ── Formulaire ────────────────────────────────────────────────────────────
  titre = '';
  contenu = '';
  showForm = false;
  submitting = false;
  charCount = 0;
  readonly MAX_CHARS = 2000;

  showTypeDropdown = false;
  typesEntreprises: TypeEntreprise[] = [
    { code: 'BANQUES',              libelle: 'Banques',                icone: '🏦', couleur: '#1e40af', checked: false },
    { code: 'ASSURANCES',          libelle: 'Assurances',              icone: '🛡️', couleur: '#059669', checked: false },
    { code: 'SGI',                  libelle: 'SGI',                    icone: '💼', couleur: '#7c3aed', checked: false },
    { code: 'SGO',                  libelle: 'SGO',                    icone: '📊', couleur: '#dc2626', checked: false },
    { code: 'FONDS_INVESTISSEMENT', libelle: "Fonds d'investissement", icone: '💰', couleur: '#b45309', checked: false },
    { code: 'MICROFINANCE',        libelle: 'Microfinance',            icone: '🏘️', couleur: '#0891b2', checked: false },
    { code: 'SOCIETES_BOURSE',     libelle: 'Sociétés de bourse',      icone: '📈', couleur: '#be185d', checked: false },
    { code: 'COURTIERS',           libelle: 'Courtiers',               icone: '🤝', couleur: '#4d7c0f', checked: false },
  ];

  // ── Pièce jointe ──────────────────────────────────────────────────────────
  mediaFichier: File | null = null;
  mediaUrl?: string;
  mediaType?: string;
  mediaNom?: string;
  uploadingMedia = false;

  // ── Toast ─────────────────────────────────────────────────────────────────
  toast: { type: 'success' | 'error' | 'info'; message: string } | null = null;
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  // ── Recherche ─────────────────────────────────────────────────────────────
  searchQuery = '';
  searching = false;

  // ── Utilisateur courant ───────────────────────────────────────────────────
  currentUserId: number = 0;
  currentEntrepriseId: number | null = null;

  // ── Contact B2B ───────────────────────────────────────────────────────────
  private contactingMap = new Map<number, boolean>();

  constructor(
    private publicationService: PublicationService,
    private chatService: ChatService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUserValue();
    if (user) {
      this.currentUserId = user.id;
      this.currentEntrepriseId = (user as any).entrepriseId ?? null;
    }
    this.loadFeed();
  }

  // ── Feed ──────────────────────────────────────────────────────────────────

  loadFeed(): void {
    this.loadingFeed = true;
    this.publicationService.getFeed().subscribe({
      next: pubs => {
        this.publications = pubs;
        this.loadingFeed = false;
      },
      error: err => {
        console.error('Erreur chargement feed:', err);
        this.loadingFeed = false;
        this.showToast('error', 'Impossible de charger les publications');
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
        error: err => {
          console.error('Erreur mes publications:', err);
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
        this.publications = pubs;
        this.searching = false;
      },
      error: err => {
        console.error('Erreur recherche:', err);
        this.searching = false;
        this.showToast('error', 'Erreur lors de la recherche');
      }
    });
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.loadFeed();
  }

  // ── Formulaire ────────────────────────────────────────────────────────────

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) this.resetForm();
  }

  onContenuChange(): void {
    this.charCount = this.contenu.length;
  }

  toggleTypeDropdown(): void { this.showTypeDropdown = !this.showTypeDropdown; }
  closeTypeDropdown(): void  { this.showTypeDropdown = false; }

  getTypesSelectionnes(): TypeEntreprise[] {
    return this.typesEntreprises.filter(t => t.checked);
  }

  getTypesLabel(): string {
    const sel = this.getTypesSelectionnes();
    if (sel.length === 0) return 'Tous (public)';
    if (sel.length <= 2) return sel.map(t => t.libelle).join(', ');
    return `${sel.length} types sélectionnés`;
  }

  toutDeselectionner(): void { this.typesEntreprises.forEach(t => t.checked = false); }
  deselectType(type: TypeEntreprise): void { type.checked = false; }
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
      error: err => {
        console.error('Erreur upload média:', err);
        this.uploadingMedia = false;
        this.showToast('error', 'Impossible d\'uploader ce fichier');
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
      typesEntreprisesVisibles: this.getTypesSelectionnes().map(t => t.code),
      mediaUrl:  this.mediaUrl,
      mediaType: this.mediaType,
      mediaNom:  this.mediaNom,
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
        console.error('Erreur publication:', err);
        this.submitting = false;
        this.showToast('error', err.error?.message || 'Impossible de créer la publication');
      }
    });
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
        console.error('Erreur suppression:', err);
        this.showToast('error', err.error?.message || 'Impossible de supprimer cette publication');
      }
    });
  }

  // ── Contact B2B ───────────────────────────────────────────────────────────

  canContact(pub: Publication): boolean {
    if (!pub.auteurEntrepriseId) return false;
    if (this.currentEntrepriseId && pub.auteurEntrepriseId === this.currentEntrepriseId) return false;
    return true;
  }

  isOwnPublication(pub: Publication): boolean {
    if (pub.auteurId && pub.auteurId === this.currentUserId) return true;
    if (this.currentEntrepriseId && pub.auteurEntrepriseId === this.currentEntrepriseId) return true;
    return false;
  }

  isContactingPublication(pub: Publication): boolean {
    return pub.id ? (this.contactingMap.get(pub.id) ?? false) : false;
  }

  contacterEntreprise(pub: Publication, event: Event): void {
    event.stopPropagation();
    if (!pub.auteurEntrepriseId || !pub.id) return;

    this.contactingMap.set(pub.id, true);
    this.showToast('info', `Ouverture de la conversation avec ${pub.auteurNom}...`);

    this.chatService.contacterEntreprise(pub.auteurEntrepriseId).subscribe({
      next: res => {
        pub.id && this.contactingMap.set(pub.id, false);
        if (res.success && res.data) {
          this.router.navigate(['/entreprise/chat'], {
            queryParams: { conversationId: res.data.id }
          });
        } else {
          this.showToast('error', 'Impossible d\'ouvrir la conversation');
        }
      },
      error: err => {
        console.error('Erreur contact entreprise:', err);
        pub.id && this.contactingMap.set(pub.id, false);
        this.showToast('error', err.error?.message || 'Impossible de contacter cette entreprise');
      }
    });
  }

  resetForm(): void {
    this.titre = '';
    this.contenu = '';
    this.charCount = 0;
    this.typesEntreprises.forEach(t => t.checked = false);
    this.removeMedia();
    this.showTypeDropdown = false;
  }

  // ── Helpers affichage ─────────────────────────────────────────────────────

  getInitiales(pub: Publication): string {
    if (pub.auteurInitiales) return pub.auteurInitiales;
    if (pub.auteurNom) {
      const p = pub.auteurNom.trim().split(' ');
      return p.length >= 2
        ? (p[0][0] + p[1][0]).toUpperCase()
        : pub.auteurNom.substring(0, 2).toUpperCase();
    }
    return 'DC';
  }

  getBadgeVisibilite(pub: Publication): string {
    if (pub.visibleParTous || !pub.typesEntreprisesVisibles?.length) return '🌍 Public';
    if (pub.typesEntreprisesVisibles.length === 1)
      return `🎯 ${this.getLibelleType(pub.typesEntreprisesVisibles[0])}`;
    return `🎯 ${pub.typesEntreprisesVisibles.length} types`;
  }

  getLibelleType(code: string): string {
    return this.typesEntreprises.find(t => t.code === code)?.libelle ?? code;
  }
  getIconeType(code: string): string {
    return this.typesEntreprises.find(t => t.code === code)?.icone ?? '🏢';
  }
  getCouleurType(code: string): string {
    return this.typesEntreprises.find(t => t.code === code)?.couleur ?? '#6b7280';
  }

  getTimeAgo(dateStr?: string): string {
    if (!dateStr) return 'Maintenant';
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'À l\'instant';
    if (m < 60) return `il y a ${m} min`;
    const h = Math.floor(m / 60);
    if (h < 24) return `il y a ${h}h`;
    return `il y a ${Math.floor(h / 24)}j`;
  }

  isMediaImage(): boolean {
    if (!this.mediaFichier) return false;
    return this.mediaFichier.type.startsWith('image') ||
      !!this.mediaNom?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  }

  getMediaUrl(pub: Publication): string {
    if (!pub.mediaUrl) return '';
    if (pub.mediaUrl.startsWith('http')) return pub.mediaUrl;
    return `${environment.apiUrl.replace('/api', '')}${pub.mediaUrl}`;
  }

  openMedia(pub: Publication): void {
    window.open(this.getMediaUrl(pub), '_blank');
  }

  getFileIcon(pub: Publication): string {
    const nom = (pub.mediaNom ?? '').toLowerCase();
    const type = (pub.mediaType ?? '').toLowerCase();
    if (type.includes('pdf') || nom.endsWith('.pdf'))                return 'pi pi-file-pdf text-red-500';
    if (nom.match(/\.(doc|docx)$/) || type.includes('word'))         return 'pi pi-file-word text-blue-600';
    if (nom.match(/\.(xls|xlsx)$/) || type.includes('sheet'))        return 'pi pi-file-excel text-green-600';
    if (nom.match(/\.(ppt|pptx)$/) || type.includes('presentation')) return 'pi pi-file text-orange-500';
    if (nom.match(/\.(zip|rar|7z)$/) || type.includes('zip'))        return 'pi pi-file-import text-purple-500';
    return 'pi pi-file text-gray-500';
  }

  getFileIconBg(pub: Publication): string {
    const nom = (pub.mediaNom ?? '').toLowerCase();
    const type = (pub.mediaType ?? '').toLowerCase();
    if (type.includes('pdf') || nom.endsWith('.pdf'))                return 'bg-red-100';
    if (nom.match(/\.(doc|docx)$/) || type.includes('word'))         return 'bg-blue-100';
    if (nom.match(/\.(xls|xlsx)$/) || type.includes('sheet'))        return 'bg-green-100';
    if (nom.match(/\.(ppt|pptx)$/) || type.includes('presentation')) return 'bg-orange-100';
    return 'bg-gray-100';
  }

  getFileTypeLabel(pub: Publication): string {
    const nom = (pub.mediaNom ?? '').toLowerCase();
    const type = (pub.mediaType ?? '').toLowerCase();
    if (type.includes('pdf') || nom.endsWith('.pdf'))                return 'Document PDF';
    if (nom.match(/\.(doc|docx)$/) || type.includes('word'))         return 'Document Word';
    if (nom.match(/\.(xls|xlsx)$/) || type.includes('sheet'))        return 'Feuille Excel';
    if (nom.match(/\.(ppt|pptx)$/) || type.includes('presentation')) return 'Présentation';
    if (nom.match(/\.(zip|rar|7z)$/))                                return 'Archive';
    return 'Fichier joint';
  }

  isImage(pub: Publication): boolean {
    return pub.mediaType?.startsWith('image') ??
      pub.mediaUrl?.match(/\.(jpg|jpeg|png|gif|webp)$/i) != null;
  }

  // ── Toast ─────────────────────────────────────────────────────────────────

  showToast(type: 'success' | 'error' | 'info', message: string): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toast = { type, message };
    this.toastTimer = setTimeout(() => { this.toast = null; }, 4000);
  }
}
