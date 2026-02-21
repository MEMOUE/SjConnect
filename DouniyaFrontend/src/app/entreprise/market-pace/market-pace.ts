import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Publication, PublicationService, CreatePublicationRequest } from '../../services/publication/publication.service';
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

  // ── Feed ────────────────────────────────────────────────────────────────
  publications: Publication[] = [];
  loadingFeed = false;
  onglet: 'feed' | 'mes-publications' = 'feed';

  // ── Formulaire ───────────────────────────────────────────────────────────
  titre = '';
  contenu = '';
  showForm = false;
  submitting = false;
  charCount = 0;
  readonly MAX_CHARS = 2000;

  // Visibilité multi-type (optionnel)
  showTypeDropdown = false;
  typesEntreprises: TypeEntreprise[] = [
    { code: 'BANQUES',              libelle: 'Banques',                 icone: '🏦', couleur: '#1e40af', checked: false },
    { code: 'ASSURANCES',          libelle: 'Assurances',               icone: '🛡️', couleur: '#059669', checked: false },
    { code: 'SGI',                  libelle: 'SGI',                     icone: '💼', couleur: '#7c3aed', checked: false },
    { code: 'SGO',                  libelle: 'SGO',                     icone: '📊', couleur: '#dc2626', checked: false },
    { code: 'FONDS_INVESTISSEMENT', libelle: "Fonds d'investissement",  icone: '💰', couleur: '#b45309', checked: false },
    { code: 'MICROFINANCE',        libelle: 'Microfinance',             icone: '🏘️', couleur: '#0891b2', checked: false },
    { code: 'SOCIETES_BOURSE',     libelle: 'Sociétés de bourse',       icone: '📈', couleur: '#be185d', checked: false },
    { code: 'COURTIERS',           libelle: 'Courtiers',                icone: '🤝', couleur: '#4d7c0f', checked: false },
  ];

  // Pièce jointe
  mediaFichier: File | null = null;
  mediaUrl?: string;
  mediaType?: string;
  mediaNom?: string;
  uploadingMedia = false;

  // Toast
  toast: { type: 'success' | 'error'; message: string } | null = null;

  // Recherche
  searchQuery = '';
  searching = false;

  constructor(private publicationService: PublicationService) {}

  ngOnInit(): void {
    this.loadFeed();
  }

  // ── Feed ────────────────────────────────────────────────────────────────
  loadFeed(): void {
    this.loadingFeed = true;
    this.publicationService.getFeed().subscribe({
      next: pubs => { this.publications = pubs; this.loadingFeed = false; },
      error: () => {
        // Mode démo si pas de backend
        this.publications = this.demoPublications();
        this.loadingFeed = false;
      }
    });
  }

  switchOnglet(o: 'feed' | 'mes-publications'): void {
    this.onglet = o;
    if (o === 'mes-publications') {
      this.loadingFeed = true;
      this.publicationService.getMesPublications().subscribe({
        next: pubs => { this.publications = pubs; this.loadingFeed = false; },
        error: () => { this.publications = this.demoPublications().slice(0, 2); this.loadingFeed = false; }
      });
    } else {
      this.loadFeed();
    }
  }

  onSearch(): void {
    if (!this.searchQuery.trim()) { this.loadFeed(); return; }
    this.searching = true;
    this.publicationService.search(this.searchQuery).subscribe({
      next: pubs => { this.publications = pubs; this.searching = false; },
      error: () => { this.searching = false; }
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

  // Visibilité
  toggleTypeDropdown(): void {
    this.showTypeDropdown = !this.showTypeDropdown;
  }

  closeTypeDropdown(): void {
    this.showTypeDropdown = false;
  }

  getTypesSelectionnes(): TypeEntreprise[] {
    return this.typesEntreprises.filter(t => t.checked);
  }

  getTypesLabel(): string {
    const sel = this.getTypesSelectionnes();
    if (sel.length === 0) return 'Tous (public)';
    if (sel.length <= 2) return sel.map(t => t.libelle).join(', ');
    return `${sel.length} types sélectionnés`;
  }

  toutDeselectionner(): void {
    this.typesEntreprises.forEach(t => t.checked = false);
  }

  deselectType(type: TypeEntreprise): void {
    type.checked = false;
  }

  // Pièce jointe
  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

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
        // Mode démo
        this.mediaNom  = file.name;
        this.mediaFichier = file;
        this.uploadingMedia = false;
      }
    });
  }

  removeMedia(): void {
    this.mediaFichier = null;
    this.mediaUrl = undefined;
    this.mediaType = undefined;
    this.mediaNom = undefined;
    if (this.fileInput) this.fileInput.nativeElement.value = '';
  }

  // Publier
  publier(): void {
    if (!this.contenu.trim()) { this.showToast('error', 'Le contenu est requis'); return; }
    if (this.contenu.length > this.MAX_CHARS) { this.showToast('error', `Maximum ${this.MAX_CHARS} caractères`); return; }

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
        } else {
          // Mode démo — ajouter localement
          this.publications.unshift(this.buildDemoPublication(request));
        }
        this.showToast('success', 'Publication créée avec succès !');
        this.toggleForm();
      },
      error: () => {
        // Mode démo
        this.publications.unshift(this.buildDemoPublication(request));
        this.showToast('success', 'Publication créée avec succès !');
        this.submitting = false;
        this.toggleForm();
      }
    });
  }

  supprimerPublication(pub: Publication, index: number): void {
    if (!pub.id) { this.publications.splice(index, 1); return; }
    this.publicationService.delete(pub.id).subscribe({
      next: () => {
        this.publications.splice(index, 1);
        this.showToast('success', 'Publication supprimée');
      },
      error: () => {
        this.publications.splice(index, 1);
        this.showToast('success', 'Publication supprimée');
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

  // ── Helpers affichage ────────────────────────────────────────────────────
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
    const d = Math.floor(h / 24);
    return `il y a ${d}j`;
  }

  isMediaImage(): boolean {
    if (!this.mediaFichier) return false;
    return this.mediaFichier.type.startsWith('image') ||
      !!this.mediaNom?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  }

  /** Construit l'URL absolue vers le fichier servi par le backend */
  getMediaUrl(pub: Publication): string {
    if (!pub.mediaUrl) return '';
    // Si déjà absolue, on la retourne telle quelle
    if (pub.mediaUrl.startsWith('http')) return pub.mediaUrl;
    // Sinon on préfixe avec le host du backend (sans /api)
    const base = environment.apiUrl.replace('/api', '');
    return `${base}${pub.mediaUrl}`;
  }

  /** Ouvre le fichier dans un nouvel onglet */
  openMedia(pub: Publication): void {
    window.open(this.getMediaUrl(pub), '_blank');
  }

  /** Retourne la classe PrimeIcon selon le type de fichier */
  getFileIcon(pub: Publication): string {
    const nom = (pub.mediaNom ?? '').toLowerCase();
    const type = (pub.mediaType ?? '').toLowerCase();
    if (type.includes('pdf') || nom.endsWith('.pdf'))                          return 'pi pi-file-pdf text-red-500';
    if (nom.match(/\.(doc|docx)$/) || type.includes('word'))                  return 'pi pi-file-word text-blue-600';
    if (nom.match(/\.(xls|xlsx)$/) || type.includes('sheet'))                 return 'pi pi-file-excel text-green-600';
    if (nom.match(/\.(ppt|pptx)$/) || type.includes('presentation'))          return 'pi pi-file text-orange-500';
    if (nom.match(/\.(zip|rar|7z)$/) || type.includes('zip'))                 return 'pi pi-file-import text-purple-500';
    return 'pi pi-file text-gray-500';
  }

  /** Fond de l'icône selon le type */
  getFileIconBg(pub: Publication): string {
    const nom = (pub.mediaNom ?? '').toLowerCase();
    const type = (pub.mediaType ?? '').toLowerCase();
    if (type.includes('pdf') || nom.endsWith('.pdf'))                return 'bg-red-100';
    if (nom.match(/\.(doc|docx)$/) || type.includes('word'))         return 'bg-blue-100';
    if (nom.match(/\.(xls|xlsx)$/) || type.includes('sheet'))        return 'bg-green-100';
    if (nom.match(/\.(ppt|pptx)$/) || type.includes('presentation')) return 'bg-orange-100';
    return 'bg-gray-100';
  }

  /** Label lisible du type de fichier */
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
    return pub.mediaType?.startsWith('image') ?? pub.mediaUrl?.match(/\.(jpg|jpeg|png|gif|webp)$/i) != null;
  }

  // ── Toast ────────────────────────────────────────────────────────────────
  showToast(type: 'success' | 'error', message: string): void {
    this.toast = { type, message };
    setTimeout(() => this.toast = null, 4000);
  }

  // ── Données de démo ──────────────────────────────────────────────────────
  private buildDemoPublication(req: CreatePublicationRequest): Publication {
    return {
      id: Date.now(),
      titre: req.titre,
      contenu: req.contenu,
      auteurNom: 'Mon Entreprise',
      auteurInitiales: 'ME',
      auteurType: 'ENTREPRISE',
      typesEntreprisesVisibles: req.typesEntreprisesVisibles,
      visibleParTous: req.typesEntreprisesVisibles.length === 0,
      nombreVues: 0,
      mediaUrl: this.mediaUrl,
      mediaNom: this.mediaNom,
      createdAt: new Date().toISOString(),
    };
  }

  private demoPublications(): Publication[] {
    return [
      {
        id: 1,
        titre: 'Nouvelles opportunités d\'investissement — T1 2025',
        contenu: 'Nous avons identifié plusieurs opportunités prometteuses dans le secteur des infrastructures en Côte d\'Ivoire et dans la zone UEMOA. ROI estimé entre 12% et 18% sur 5 ans. Notre équipe d\'analystes reste disponible pour tout renseignement complémentaire.',
        auteurNom: 'SGCI Capital',
        auteurInitiales: 'SC',
        auteurType: 'ENTREPRISE',
        typesEntreprisesVisibles: ['BANQUES', 'FONDS_INVESTISSEMENT'],
        visibleParTous: false,
        nombreVues: 142,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 2,
        titre: 'Appel d\'offres : Couverture risques industriels',
        contenu: 'Groupe industriel implanté en Afrique de l\'Ouest recherche assureur pour couverture globale risques industriels. Capacité souhaitée : 50 Mds FCFA. Dossiers à soumettre avant le 15 mars 2025. Contact : risques@groupecigl.ci',
        auteurNom: 'Groupe CIGL',
        auteurInitiales: 'GC',
        auteurType: 'ENTREPRISE',
        typesEntreprisesVisibles: ['ASSURANCES', 'COURTIERS'],
        visibleParTous: false,
        nombreVues: 87,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 3,
        titre: 'Lancement fonds obligataire Abidjan Finance 2025',
        contenu: 'ABI Asset Management est fier d\'annoncer le lancement de son nouveau fonds obligataire ciblant les émissions souveraines et quasi-souveraines de la zone UEMOA. Ticket minimum : 25 millions FCFA. Rendement cible annuel : 7,5%.',
        auteurNom: 'ABI Asset Management',
        auteurInitiales: 'AA',
        auteurType: 'ENTREPRISE',
        typesEntreprisesVisibles: [],
        visibleParTous: true,
        nombreVues: 310,
        createdAt: new Date(Date.now() - 172800000).toISOString(),
      },
    ];
  }
}
