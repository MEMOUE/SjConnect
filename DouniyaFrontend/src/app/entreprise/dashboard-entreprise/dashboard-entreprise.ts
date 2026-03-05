import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin, Subject, of } from 'rxjs';
import { takeUntil, catchError } from 'rxjs';

import { AuthService } from '../../services/auth/auth.service';
import { EmployeService } from '../../services/auth/employe.service';
import { ProjetB2BService } from '../../services/projet-b2b/projet-b2b.service';
import { MeetingService } from '../../services/meeting/meeting.service';
import { PublicationService } from '../../services/publication/publication.service';
import { ChatService } from '../../services/chat/chat.service';
import { UserResponse } from '../../models/auth.model';
import { ProjetB2B } from '../../models/projet-b2b.model';
import { Meeting } from '../../services/meeting/meeting.service';
import { Publication } from '../../services/publication/publication.service';

@Component({
  selector: 'app-dashboard-entreprise',
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard-entreprise.html',
  styleUrl: './dashboard-entreprise.css'
})
export class DashboardEntreprise implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();

  isLoading = true;
  currentUser: UserResponse | null = null;

  nombreEmployes       = 0;
  nombreProjets        = 0;
  nombreMeetings       = 0;
  nombrePublications   = 0;
  nombreConversations  = 0;
  nombreMessagesNonLus = 0;

  projetsCollaboratifs: ProjetB2B[]  = [];
  meetingsRecents: Meeting[]          = [];
  publicationsRecentes: Publication[] = [];

  hasError: boolean = false;
  nombrePublicationsFeed: number = 0;

  // ── Rôle ─────────────────────────────────────────────────────────────────
  get isEntreprise(): boolean { return this.currentUser?.role === 'ENTREPRISE'; }
  get isEmploye():    boolean { return this.currentUser?.role === 'EMPLOYE'; }

  // ── Infos entreprise (compatible Entreprise + Employé) ───────────────────
  get entreprise() {
    const u = this.currentUser;
    if (!u) return { nom: 'Mon compte', logo: 'DC', plan: 'Standard', secteur: '', type: '' };

    if (u.role === 'EMPLOYE') {
      const nom = u.entrepriseNom ?? 'Mon entreprise';
      return { nom, logo: nom.substring(0, 2).toUpperCase(), plan: 'Employé', secteur: '', type: '' };
    }

    const nom = u.nomEntreprise ?? 'Mon entreprise';
    return {
      nom,
      logo:    nom.substring(0, 2).toUpperCase(),
      plan:    'Premium',
      secteur: u.secteurActivite ?? '',
      type:    u.typeEntreprise  ?? ''
    };
  }

  // ── Nom affiché de l'utilisateur connecté ─────────────────────────────────
  get userDisplayName(): string {
    const u = this.currentUser;
    if (!u) return '';
    if (u.role === 'EMPLOYE' || u.role === 'PARTICULIER')
      return `${u.prenom ?? ''} ${u.nom ?? ''}`.trim();
    return u.nomEntreprise ?? u.username ?? '';
  }

  // ── Stats dynamiques ──────────────────────────────────────────────────────
  get stats() {
    const list: any[] = [];

    if (this.isEntreprise) {
      list.push({
        label: 'Employés actifs',
        value: this.nombreEmployes.toString(),
        icon: 'pi-users', color: 'blue',
        trend: this.nombreEmployes > 0 ? `${this.nombreEmployes} inscrits` : 'Aucun',
        description: 'Collaboration interne'
      });
    }

    list.push(
      {
        label: 'Projets B2B',
        value: this.nombreProjets.toString(),
        icon: 'pi-building', color: 'purple',
        trend: `${this.projetsActifs} actifs`,
        description: 'Collaborations en cours'
      },
      {
        label: 'Réunions',
        value: this.nombreMeetings.toString(),
        icon: 'pi-video', color: 'green',
        trend: this.meetingsEnCours > 0
          ? `${this.meetingsEnCours} en cours`
          : `${this.meetingsPlanifies} planifiées`,
        description: 'Visioconférences'
      },
      {
        label: 'Publications',
        value: this.nombrePublications.toString(),
        icon: 'pi-shopping-cart', color: 'orange',
        trend: 'Marketplace',
        description: 'Offres publiées'
      }
    );

    // 4e carte pour les employés : conversations / messages non lus
    if (!this.isEntreprise) {
      list.push({
        label: 'Conversations',
        value: this.nombreConversations.toString(),
        icon: 'pi-comments', color: 'blue',
        trend: this.nombreMessagesNonLus > 0
          ? `${this.nombreMessagesNonLus} non lus`
          : 'À jour',
        description: 'Messagerie B2B'
      });
    }

    return list;
  }

  get projetsActifs()    { return this.projetsCollaboratifs.filter(p => p.statut === 'ACTIF').length; }
  get meetingsPlanifies(){ return this.meetingsRecents.filter(m => m.statut === 'PLANIFIE').length; }
  get meetingsEnCours()  { return this.meetingsRecents.filter(m => m.statut === 'EN_COURS').length; }

  // ── Activités récentes ────────────────────────────────────────────────────
  get recentActivities() {
    const activities: any[] = [];

    this.meetingsRecents.slice(0, 2).forEach(m => {
      activities.push({
        user:   m.organisateurNom ?? 'Organisateur',
        action: m.statut === 'EN_COURS' ? 'a lancé une visioconférence' : 'a planifié',
        target: m.titre,
        time:   this.formatDate(m.dateDebut),
        icon:   'pi-video',
        color:  m.statut === 'EN_COURS' ? 'green' : 'blue'
      });
    });

    this.publicationsRecentes.slice(0, 2).forEach(p => {
      activities.push({
        user:   p.auteurNom ?? 'Auteur',
        action: 'a publié une offre sur',
        target: 'Marketplace',
        time:   this.formatDate(p.createdAt),
        icon:   'pi-shopping-cart',
        color:  'orange'
      });
    });

    if (activities.length === 0) {
      activities.push({
        user: this.entreprise.nom, action: 'a rejoint', target: 'DouniyaConnect',
        time: 'Bienvenue !', icon: 'pi-star', color: 'blue'
      });
    }

    return activities.slice(0, 4);
  }

  // ── Notifications dynamiques ──────────────────────────────────────────────
  get notifications() {
    const notifs: any[] = [];

    this.meetingsRecents.filter(m => m.statut === 'EN_COURS').forEach(m => {
      notifs.push({
        message: `Réunion en cours : "${m.titre}"`,
        time: 'Maintenant', type: 'warning', icon: 'pi-video'
      });
    });

    if (this.nombreMessagesNonLus > 0) {
      notifs.push({
        message: `${this.nombreMessagesNonLus} message(s) non lu(s)`,
        time: 'Récemment', type: 'warning', icon: 'pi-comments'
      });
    }

    if (this.projetsActifs > 0) {
      notifs.push({
        message: `${this.projetsActifs} projet(s) B2B en cours`,
        time: 'En cours', type: 'info', icon: 'pi-building'
      });
    }

    if (this.nombrePublications > 0) {
      notifs.push({
        message: `${this.nombrePublications} publication(s) sur le marketplace`,
        time: 'Récemment', type: 'success', icon: 'pi-shopping-cart'
      });
    }

    if (notifs.length === 0) {
      notifs.push({ message: 'Bienvenue sur DouniyaConnect !', time: "Aujourd'hui", type: 'info', icon: 'pi-info-circle' });
    }

    return notifs.slice(0, 4);
  }

  // ── Actions rapides (adaptées au rôle) ───────────────────────────────────
  get quickActions(): any[] {
    const actions: any[] = [];

    if (this.isEntreprise) {
      actions.push({
        label: 'Ajouter un employé', icon: 'pi-user-plus',
        route: '/entreprise/equipe', color: 'blue',
        description: 'Gérer votre équipe'
      });
    }

    actions.push(
      { label: 'Espace B2B',      icon: 'pi-building',     route: '/entreprise/espace-b2b', color: 'purple', description: 'Collaboration inter-entreprises' },
      { label: 'Visioconférence', icon: 'pi-video',        route: '/entreprise/visio',      color: 'green',  description: "Jusqu'à 500 participants" },
      { label: 'Marketplace',     icon: 'pi-shopping-bag', route: '/entreprise/marketplace',color: 'orange', description: "Appels d'offres & services" }
    );

    return actions.slice(0, 4);
  }

  modulesAvances = [
    { titre: 'Visioconférence HD',     description: "Jusqu'à 500 participants avec cryptage E2E",        icon: 'pi-video',     statut: 'Actif' },
    { titre: 'Traduction automatique', description: 'Français, anglais, portugais, arabe',               icon: 'pi-language',  statut: 'Actif' },
    { titre: 'Sécurité MFA',           description: 'Authentification multi-facteurs, hébergement local',icon: 'pi-shield',    statut: 'Actif' },
    { titre: 'Analytics & KPI',        description: "Tableaux de bord et suivi d'activité",              icon: 'pi-chart-bar', statut: 'Actif' }
  ];

  infoUEMOA = {
    pays: ['Bénin', 'Burkina Faso', "Côte d'Ivoire", 'Guinée-Bissau', 'Mali', 'Niger', 'Sénégal', 'Togo'],
    entreprisesConnectees: 1250,
    objectifUtilisateurs: '100K+'
  };

  sidebarOpen = true;

  constructor(
    private authService: AuthService,
    private employeService: EmployeService,
    private projetService: ProjetB2BService,
    private meetingService: MeetingService,
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

    // Appels communs à tous les rôles authentifiés
    const appelsCommuns = {
      projets:       this.projetService.getMesProjets().pipe(catchError(() => of([] as ProjetB2B[]))),
      meetings:      this.meetingService.getMesMeetings().pipe(catchError(() => of([] as Meeting[]))),
      publications:  this.publicationService.getMesPublications().pipe(catchError(() => of([] as Publication[]))),
      conversations: this.chatService.getConversations(0, 50).pipe(catchError(() => of({ content: [] } as any)))
    };

    if (this.isEntreprise) {
      // L'endpoint /entreprise/employes/count est restreint au rôle ENTREPRISE
      forkJoin({
        ...appelsCommuns,
        employes: this.employeService.getEmployeCount().pipe(catchError(() => of(0)))
      })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => this.appliquerResultats({ ...res, employes: res.employes as number }),
          error: () => { this.isLoading = false; }
        });
    } else {
      // Employés, Particuliers : pas accès à l'endpoint employés
      forkJoin(appelsCommuns)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => this.appliquerResultats({ ...res, employes: 0 }),
          error: () => { this.isLoading = false; }
        });
    }
  }

  private appliquerResultats(res: {
    employes: number;
    projets: ProjetB2B[];
    meetings: Meeting[];
    publications: Publication[];
    conversations: any;
  }): void {
    this.nombreEmployes       = Number(res.employes) || 0;
    this.projetsCollaboratifs = (res.projets ?? []).slice(0, 3);
    this.nombreProjets        = (res.projets ?? []).length;
    this.meetingsRecents      = res.meetings ?? [];
    this.nombreMeetings       = this.meetingsRecents.length;
    this.publicationsRecentes = res.publications ?? [];
    this.nombrePublications   = this.publicationsRecentes.length;

    // Conversations & messages non lus
    const convContent: any[] = res.conversations?.content ?? [];
    this.nombreConversations  = convContent.length;
    this.nombreMessagesNonLus = convContent.reduce(
      (acc: number, c: any) => acc + (Number(c.unreadCount) || 0), 0
    );

    this.isLoading = false;
  }

  toggleSidebar(): void { this.sidebarOpen = !this.sidebarOpen; }

  getProgressColor(progress: number): string {
    if (progress >= 75) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-yellow-500';
    return 'bg-red-500';
  }

  getStatutBadge(statut: string): string {
    const map: Record<string, string> = {
      ACTIF:      'bg-green-100 text-green-700',
      EN_ATTENTE: 'bg-yellow-100 text-yellow-700',
      TERMINE:    'bg-gray-100 text-gray-600',
      EN_PAUSE:   'bg-orange-100 text-orange-700',
      ARCHIVE:    'bg-red-100 text-red-600'
    };
    return map[statut] ?? 'bg-gray-100 text-gray-600';
  }

  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '';
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (diff < 1)    return "À l'instant";
    if (diff < 60)   return `Il y a ${diff} min`;
    if (diff < 1440) return `Il y a ${Math.floor(diff / 60)}h`;
    return `Il y a ${Math.floor(diff / 1440)} j`;
  }
}
