import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin, of, Subject } from 'rxjs';
import { catchError, takeUntil } from 'rxjs';

import { AuthService } from '../../services/auth/auth.service';
import { PublicationService, Publication } from '../../services/publication/publication.service';
import { ChatService } from '../../services/chat/chat.service';
import { UserResponse } from '../../models/auth.model';
import { ParticulierNav } from '../particulier-nav/particulier-nav';

@Component({
  selector: 'app-dashboard-particulier',
  standalone: true,
  imports: [CommonModule, RouterLink, ParticulierNav],
  templateUrl: './dashboard-particulier.html',
  styleUrl: './dashboard-particulier.css'
})
export class DashboardParticulier implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();

  isLoading = true;
  currentUser: UserResponse | null = null;

  offresRecentes: Publication[] = [];
  nombreOffres = 0;
  nombreConversations = 0;
  nombreMessagesNonLus = 0;

  readonly quickActions = [
    { label: 'Marketplace', icon: 'pi-shopping-bag', route: '/particulier/marketplace', color: 'orange', description: 'Consulter les offres ouvertes aux particuliers' },
    { label: 'Messagerie',  icon: 'pi-comments',      route: '/particulier/chat',        color: 'blue',   description: 'Échanger avec les entreprises' },
    { label: 'Paramètres',  icon: 'pi-cog',           route: '/particulier/parametres',  color: 'gray',   description: 'Gérer votre profil et votre compte' },
  ];

  constructor(
    private authService: AuthService,
    private publicationService: PublicationService,
    private chatService: ChatService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUserValue();
    this.chargerDonnees();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  chargerDonnees(): void {
    this.isLoading = true;

    forkJoin({
      offres: this.publicationService.getFeed().pipe(catchError(() => of([] as Publication[]))),
      conversations: this.chatService.getConversations(0, 50).pipe(catchError(() => of({ content: [] } as any)))
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ offres, conversations }) => {
          this.offresRecentes = offres.slice(0, 4);
          this.nombreOffres = offres.length;

          const convContent: any[] = conversations?.content ?? [];
          this.nombreConversations = convContent.length;
          this.nombreMessagesNonLus = convContent.reduce(
            (acc: number, c: any) => acc + (Number(c.unreadCount) || 0), 0
          );

          this.isLoading = false;
        },
        error: () => { this.isLoading = false; }
      });
  }

  get userDisplayName(): string {
    const u = this.currentUser;
    if (!u) return '';
    return `${u.prenom ?? ''} ${u.nom ?? ''}`.trim() || u.username || '';
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
}
