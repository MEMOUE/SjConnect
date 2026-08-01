import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Publication, PublicationService } from '../../services/publication/publication.service';
import { ChatService } from '../../services/chat/chat.service';
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

  publications: Publication[] = [];
  loadingFeed = false;
  searchQuery = '';
  searching = false;

  private contactingMap = new Map<number, boolean>();

  toast: { type: 'success' | 'error' | 'info'; message: string } | null = null;
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private publicationService: PublicationService,
    private chatService: ChatService,
    private router: Router
  ) {}

  ngOnInit(): void {
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
