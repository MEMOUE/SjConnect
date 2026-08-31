import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { throwError } from 'rxjs';
import { MeetingService, Meeting, CreateMeetingRequest } from '../../services/meeting/meeting.service';
import { CallService } from '../../services/call/call.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-visio-conference',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './visio-conference.html',
  styleUrl: './visio-conference.css'
})
export class VisioConference implements OnInit {

  // ── Vue active ─────────────────────────────────────────────────────────
  vue: 'liste' | 'creer' | 'rejoindre' = 'liste';

  // ── Meetings ───────────────────────────────────────────────────────────
  meetings: Meeting[] = [];
  loading = false;

  // ── Formulaire création ────────────────────────────────────────────────
  form = {
    titre: '',
    description: '',
    dateDebut: '',
    dateFin: '',
    maintenant: false
  };
  submitting = false;

  // ── Rejoindre par lien ─────────────────────────────────────────────────
  lienOuCode = '';

  // ── Toast ──────────────────────────────────────────────────────────────
  toast: { type: 'success' | 'error' | 'info'; message: string } | null = null;
  lienCopie = false;

  features = [
    { icon: 'pi pi-video',       color: 'text-blue-600',   bg: 'bg-blue-50',   label: 'Vidéo HD temps réel'     },
    { icon: 'pi pi-desktop',     color: 'text-purple-600', bg: 'bg-purple-50', label: 'Partage d\'écran'         },
    { icon: 'pi pi-comments',    color: 'text-green-600',  bg: 'bg-green-50',  label: 'Messagerie instantanée'   },
    { icon: 'pi pi-shield',      color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Chiffrement bout en bout' },
    { icon: 'pi pi-circle-fill', color: 'text-red-600',    bg: 'bg-red-50',    label: 'Enregistrement de séance' },
    { icon: 'pi pi-users',       color: 'text-indigo-600', bg: 'bg-indigo-50', label: 'Jusqu\'à 100 participants' }
  ];

  constructor(
    private meetingService: MeetingService,
    private callService: CallService
  ) {}

  ngOnInit(): void {
    this.chargerMeetings();
  }

  // ── Meetings ───────────────────────────────────────────────────────────
  chargerMeetings(): void {
    this.loading = true;
    this.meetingService.getMesMeetings().subscribe({
      next: m  => { this.meetings = m; this.loading = false; },
      error: () => { this.meetings = this.demoMeetings(); this.loading = false; }
    });
  }

  creerMeeting(): void {
    if (!this.form.titre.trim()) { this.showToast('error', 'Le titre est requis'); return; }
    if (!this.form.maintenant && !this.form.dateDebut) {
      this.showToast('error', 'La date de début est requise'); return;
    }
    this.submitting = true;

    const dateDebut = this.form.maintenant
      ? new Date().toISOString()
      : new Date(this.form.dateDebut).toISOString();

    const payload: CreateMeetingRequest = {
      titre:       this.form.titre,
      description: this.form.description || undefined,
      dateDebut,
      dateFin:     this.form.dateFin ? new Date(this.form.dateFin).toISOString() : undefined
    };

    this.meetingService.creerMeeting(payload).subscribe({
      next: meeting => {
        this.meetings.unshift(meeting);
        this.showToast('success', 'Réunion créée !');
        this.submitting = false;
        if (this.form.maintenant) {
          this.lancerAppel(meeting);
        } else {
          this.vue = 'liste';
          this.resetForm();
        }
      },
      error: () => {
        // Mode démo si backend indisponible
        const meeting: Meeting = {
          id: Date.now(),
          titre: this.form.titre,
          description: this.form.description,
          roomName: this.genererRoomName(this.form.titre),
          dateDebut,
          dateFin: this.form.dateFin || undefined,
          organisateurNom: 'Vous',
          participants: [],
          statut: this.form.maintenant ? 'EN_COURS' : 'PLANIFIE',
          createdAt: new Date().toISOString()
        };
        this.meetings.unshift(meeting);
        this.showToast('success', 'Réunion créée (mode démo) !');
        this.submitting = false;
        if (this.form.maintenant) { this.lancerAppel(meeting); }
        else { this.vue = 'liste'; this.resetForm(); }
      }
    });
  }

  // ── Appel Jitsi ────────────────────────────────────────────────────────
  // L'iframe Jitsi et son état (micro/caméra/partage, minimiser...) vivent
  // dans CallService, rendus globalement par <app-call-overlay> en dehors du
  // router-outlet — voir call.service.ts. Ce composant fournit seulement le
  // contexte propre à la réunion : la salle, le titre, et les effets de bord
  // (marquer la réunion terminée, inviter par email).
  lancerAppel(meeting: Meeting): void {
    this.callService.startCall({
      roomName: `DouniyaConnect-${meeting.roomName}`,
      title: meeting.titre,
      callType: 'video',
      onInvite: (email) => {
        if (!meeting.id) {
          return throwError(() => new Error('Impossible d\'inviter : réunion non enregistrée côté serveur'));
        }
        return this.meetingService.inviterParEmail(meeting.id, email, this.getLienPartage(meeting));
      },
      onEnded: () => {
        if (meeting.id) {
          this.meetingService.terminerMeeting(meeting.id).subscribe();
          meeting.statut = 'TERMINE';
        }
      }
    });
  }

  rejoindreParLien(): void {
    const code = this.extraireRoomName(this.lienOuCode.trim());
    if (!code) { this.showToast('error', 'Lien ou code invalide'); return; }
    const meeting: Meeting = {
      titre: 'Réunion', roomName: code,
      dateDebut: new Date().toISOString(),
      participants: [], statut: 'EN_COURS'
    };
    this.lancerAppel(meeting);
  }

  // ── Lien partage ───────────────────────────────────────────────────────
  getLienPartage(meeting: Meeting): string {
    return `https://${environment.jitsiDomain}/DouniyaConnect-${meeting.roomName}`;
  }

  copierLien(meeting: Meeting): void {
    navigator.clipboard.writeText(this.getLienPartage(meeting)).then(() => {
      this.lienCopie = true;
      this.showToast('success', 'Lien copié !');
      setTimeout(() => this.lienCopie = false, 2000);
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────
  private genererRoomName(titre: string): string {
    const slug = titre.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 30);
    return `${slug}-${Date.now().toString(36)}`;
  }

  private extraireRoomName(lien: string): string {
    if (lien.includes(`${environment.jitsiDomain}/`))
      return lien.split(`${environment.jitsiDomain}/`)[1]?.replace('DouniyaConnect-', '') ?? '';
    return lien;
  }

  resetForm(): void {
    this.form = { titre: '', description: '', dateDebut: '', dateFin: '', maintenant: false };
  }

  setMaintenant(val: boolean): void {
    this.form.maintenant = val;
    if (val) { this.form.dateDebut = ''; this.form.dateFin = ''; }
  }

  getStatutClass(statut: string): string {
    switch (statut) {
      case 'EN_COURS':  return 'bg-green-100 text-green-700 border-green-200';
      case 'PLANIFIE':  return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'TERMINE':   return 'bg-gray-100 text-gray-500 border-gray-200';
      default:          return 'bg-gray-100 text-gray-500 border-gray-200';
    }
  }

  getStatutLabel(statut: string): string {
    switch (statut) {
      case 'EN_COURS': return 'En cours';
      case 'PLANIFIE': return 'Planifiée';
      case 'TERMINE':  return 'Terminée';
      default:         return statut;
    }
  }

  getStatutIcon(statut: string): string {
    switch (statut) {
      case 'EN_COURS': return 'pi pi-circle-fill text-green-500';
      case 'PLANIFIE': return 'pi pi-clock text-blue-500';
      case 'TERMINE':  return 'pi pi-check-circle text-gray-400';
      default:         return 'pi pi-circle';
    }
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  countMeetings(statut: string): number {
    return this.meetings.filter(m => m.statut === statut).length;
  }

  showToast(type: 'success' | 'error' | 'info', message: string): void {
    this.toast = { type, message };
    setTimeout(() => this.toast = null, 4000);
  }

  demarrerMaintenant(): void {
    this.form.titre     = 'Réunion instantanée';
    this.form.maintenant = true;
    this.creerMeeting();
  }

  private demoMeetings(): Meeting[] {
    return [
      {
        id: 1, titre: 'Revue portefeuille Q1 2025',
        description: 'Analyse des performances du premier trimestre',
        roomName: 'revue-portefeuille-q1',
        dateDebut: new Date(Date.now() + 3600000).toISOString(),
        organisateurNom: 'SGCI Capital',
        participants: [{ nom: 'Koné Mamadou', statut: 'ACCEPTE' }],
        statut: 'PLANIFIE'
      },
      {
        id: 2, titre: 'Partenariat Banques — Assureurs',
        description: 'Discussion des modalités de la convention',
        roomName: 'partenariat-banques-assureurs',
        dateDebut: new Date(Date.now() - 7200000).toISOString(),
        organisateurNom: 'ABI Asset Management',
        participants: [{ nom: 'Ibrahim Coulibaly', statut: 'PRESENT' }],
        statut: 'TERMINE'
      }
    ];
  }
}
