import { ElementRef, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { MessageService } from 'primeng/api';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../../environments/environment';

declare var JitsiMeetExternalAPI: any;

export interface StartCallOptions {
  /** Nom de salle Jitsi déjà pleinement qualifié (ex: "DouniyaConnect-xxx"). */
  roomName: string;
  title: string;
  callType: 'audio' | 'video';
  /** Envoie une invitation par email ; dépend du contexte d'origine (chat ou réunion planifiée). */
  onInvite: (email: string) => Observable<unknown>;
  /** Appelé une fois la connexion Jitsi établie (ex: notifier une conversation). */
  onJoined?: () => void;
  /** Appelé à la fin de l'appel (ex: marquer une réunion comme terminée). */
  onEnded?: () => void;
}

/**
 * Appel Jitsi global, monté en dehors du router-outlet (voir CallOverlay et
 * app.html) : survit à la navigation entre pages au lieu d'être détruit avec
 * le composant Chat/VisioConference qui l'a démarré.
 */
@Injectable({ providedIn: 'root' })
export class CallService {
  active = signal(false);
  minimized = signal(false);
  title = signal('');
  callType = signal<'audio' | 'video'>('video');
  participantsCount = signal(0);
  microActif = signal(true);
  cameraActive = signal(true);
  partageEcran = signal(false);
  jitsiPret = signal(false);
  jitsiErreur = signal<string | null>(null);

  showInvitePanel = signal(false);
  inviteEmail = '';
  isInviting = signal(false);
  lienCopie = signal(false);

  private roomName = '';
  private jitsiApi: any = null;
  private jitsiLoaded = false;
  private jitsiScriptAttentAttempts = 0;
  private jitsiScriptLoadAttempts = 0;
  private jitsiJoinTimeoutId: any = null;
  private containerEl: HTMLDivElement | null = null;

  private onInviteFn: ((email: string) => Observable<unknown>) | null = null;
  private onJoinedFn?: () => void;
  private onEndedFn?: () => void;

  constructor(private authService: AuthService, private messageService: MessageService) {
    this.chargerJitsiScript();
  }

  /** Appelé par CallOverlay quand le conteneur #jitsiContainer apparaît/disparaît du DOM. */
  registerContainer(el: HTMLDivElement | null): void {
    this.containerEl = el;
    if (el && this.active() && !this.jitsiApi) {
      this.initialiserJitsi();
    }
  }

  startCall(options: StartCallOptions): void {
    // Un appel réduit tourne déjà en arrière-plan : on le rouvre plutôt que
    // d'en démarrer un second par-dessus.
    if (this.active()) {
      this.minimized.set(false);
      return;
    }

    this.roomName = options.roomName;
    this.title.set(options.title);
    this.callType.set(options.callType);
    this.onInviteFn = options.onInvite;
    this.onJoinedFn = options.onJoined;
    this.onEndedFn = options.onEnded;

    this.active.set(true);
    this.minimized.set(false);
    this.jitsiPret.set(false);
    this.jitsiErreur.set(null);
    this.jitsiScriptAttentAttempts = 0;
    this.microActif.set(true);
    this.cameraActive.set(options.callType === 'video');
    this.partageEcran.set(false);
    this.participantsCount.set(1);
    this.showInvitePanel.set(false);
    this.inviteEmail = '';

    setTimeout(() => this.initialiserJitsi(), 300);
  }

  reessayer(): void {
    if (!this.active()) return;
    this.jitsiErreur.set(null);
    this.jitsiScriptAttentAttempts = 0;
    if (!this.jitsiLoaded) {
      this.jitsiScriptLoadAttempts = 0;
      this.chargerJitsiScript();
    }
    this.initialiserJitsi();
  }

  private initialiserJitsi(): void {
    if (!this.jitsiLoaded || !this.containerEl) {
      this.jitsiScriptAttentAttempts++;
      if (this.jitsiScriptAttentAttempts > 30) {
        this.jitsiErreur.set('Impossible de charger le module d\'appel. Vérifiez votre connexion internet et réessayez.');
        return;
      }
      setTimeout(() => this.initialiserJitsi(), 500);
      return;
    }
    this.detruireJitsiApi();
    this.jitsiErreur.set(null);

    if (this.jitsiJoinTimeoutId) clearTimeout(this.jitsiJoinTimeoutId);
    this.jitsiJoinTimeoutId = setTimeout(() => {
      if (!this.jitsiPret()) {
        this.jitsiErreur.set('La connexion à l\'appel prend trop de temps. Vérifiez votre réseau ou réessayez.');
      }
    }, 20000);

    const currentUser = this.authService.getCurrentUserValue();
    const displayName = currentUser?.nomEntreprise
      || (currentUser?.prenom && currentUser?.nom ? `${currentUser.prenom} ${currentUser.nom}` : currentUser?.username)
      || 'Utilisateur';

    const toolbarButtons = [
      'microphone', 'camera', 'participants-pane',
      'chat', 'tileview', 'select-background', 'hangup'
    ];
    if (!this.isMobileDevice()) toolbarButtons.splice(2, 0, 'desktop');

    const options = {
      roomName: this.roomName,
      width: '100%',
      height: '100%',
      parentNode: this.containerEl,
      lang: 'fr',
      userInfo: {
        displayName,
        email: currentUser?.email ?? ''
      },
      configOverwrite: {
        startWithAudioMuted: false,
        startWithVideoMuted: this.callType() === 'audio',
        disableDeepLinking: true,
        enableWelcomePage: false,
        prejoinPageEnabled: false,
        prejoinConfig: { enabled: false },
        toolbarButtons
      },
      interfaceConfigOverwrite: {
        SHOW_JITSI_WATERMARK: true,
        SHOW_WATERMARK_FOR_GUESTS: true,
        DEFAULT_LOGO_URL: 'images/logo-douniya.png',
        JITSI_WATERMARK_LINK: 'https://duniyaconnect.com',
        SHOW_BRAND_WATERMARK: false,
        SHOW_POWERED_BY: false,
        APP_NAME: 'DouniyaConnect',
        DEFAULT_BACKGROUND: '#0f2855',
        TOOLBAR_ALWAYS_VISIBLE: false,
        MOBILE_APP_PROMO: false
      }
    };

    try {
      this.jitsiApi = new JitsiMeetExternalAPI(environment.jitsiDomain, options);

      this.jitsiApi.addEventListener('videoConferenceJoined', () => {
        const dejaConnecte = this.jitsiPret();
        this.jitsiPret.set(true);
        this.jitsiErreur.set(null);
        this.participantsCount.set(1);
        if (this.jitsiJoinTimeoutId) { clearTimeout(this.jitsiJoinTimeoutId); this.jitsiJoinTimeoutId = null; }
        if (!dejaConnecte) this.onJoinedFn?.();
      });
      this.jitsiApi.addEventListener('participantJoined', () => this.participantsCount.update(n => n + 1));
      this.jitsiApi.addEventListener('participantLeft', () => {
        this.participantsCount.update(n => Math.max(0, n - 1));
      });
      this.jitsiApi.addEventListener('audioMuteStatusChanged', (e: any) => this.microActif.set(!e.muted));
      this.jitsiApi.addEventListener('videoMuteStatusChanged', (e: any) => this.cameraActive.set(!e.muted));
      this.jitsiApi.addEventListener('screenSharingStatusChanged', (e: any) => this.partageEcran.set(e.on));
      this.jitsiApi.addEventListener('readyToClose', () => this.endCall());
      this.jitsiApi.addEventListener('connectionFailed', () => {
        this.jitsiErreur.set('La connexion à l\'appel a échoué. Réessayez.');
      });
      this.jitsiApi.addEventListener('errorOccurred', () => {
        this.jitsiErreur.set('Une erreur est survenue lors de la connexion à l\'appel.');
      });
      this.jitsiApi.addEventListener('videoConferenceLeft', () => {
        if (!this.jitsiPret()) this.jitsiErreur.set('La connexion à l\'appel a été interrompue.');
      });
    } catch {
      this.jitsiErreur.set('Erreur lors du lancement de l\'appel');
      this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de démarrer l\'appel' });
    }
  }

  private detruireJitsiApi(): void {
    if (this.jitsiJoinTimeoutId) { clearTimeout(this.jitsiJoinTimeoutId); this.jitsiJoinTimeoutId = null; }
    if (this.jitsiApi) {
      try { this.jitsiApi.dispose(); } catch { /* ignore */ }
      this.jitsiApi = null;
    }
    this.jitsiPret.set(false);
  }

  endCall(): void {
    if (!this.active()) return;
    this.detruireJitsiApi();
    const onEnded = this.onEndedFn;
    this.active.set(false);
    this.minimized.set(false);
    this.showInvitePanel.set(false);
    this.onInviteFn = null;
    this.onJoinedFn = undefined;
    this.onEndedFn = undefined;
    onEnded?.();
  }

  toggleMinimize(): void {
    this.minimized.update(v => !v);
  }

  /** Réduit automatiquement l'appel (navigation vers une autre page) sans jamais le fermer. */
  minimizeForNavigation(): void {
    if (this.active() && !this.minimized()) {
      this.minimized.set(true);
    }
  }

  toggleMicro(): void { if (this.jitsiApi) this.jitsiApi.executeCommand('toggleAudio'); }
  toggleCamera(): void { if (this.jitsiApi) this.jitsiApi.executeCommand('toggleVideo'); }
  togglePartageEcran(): void { if (this.jitsiApi) this.jitsiApi.executeCommand('toggleShareScreen'); }

  isMobileDevice(): boolean {
    return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
      || window.matchMedia('(max-width: 768px)').matches;
  }

  getCallLink(): string {
    return this.roomName ? `https://${environment.jitsiDomain}/${this.roomName}` : '';
  }

  copierLien(): void {
    const lien = this.getCallLink();
    if (!lien) return;
    navigator.clipboard.writeText(lien).then(() => {
      this.lienCopie.set(true);
      this.messageService.add({ severity: 'success', summary: 'Copié', detail: 'Lien de l\'appel copié !' });
      setTimeout(() => this.lienCopie.set(false), 2000);
    });
  }

  toggleInvitePanel(): void {
    this.showInvitePanel.update(v => !v);
  }

  envoyerInvitation(): void {
    const email = this.inviteEmail.trim();
    if (!email || !this.onInviteFn) return;

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      this.messageService.add({ severity: 'error', summary: 'Email invalide', detail: 'Veuillez saisir une adresse email valide' });
      return;
    }

    this.isInviting.set(true);
    this.onInviteFn(email).subscribe({
      next: () => {
        this.isInviting.set(false);
        this.messageService.add({ severity: 'success', summary: 'Invitation envoyée', detail: `Un lien de connexion a été envoyé à ${email}` });
        this.inviteEmail = '';
        this.showInvitePanel.set(false);
      },
      error: (err) => {
        this.isInviting.set(false);
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err.error?.message || 'Impossible d\'envoyer l\'invitation' });
      }
    });
  }

  private chargerJitsiScript(): void {
    if (typeof JitsiMeetExternalAPI !== 'undefined') { this.jitsiLoaded = true; return; }
    const script = document.createElement('script');
    script.src = `https://${environment.jitsiDomain}/external_api.js`;
    script.onload = () => { this.jitsiLoaded = true; };
    script.onerror = () => {
      script.remove();
      this.jitsiScriptLoadAttempts++;
      if (this.jitsiScriptLoadAttempts <= 5) {
        setTimeout(() => this.chargerJitsiScript(), 2000);
      } else {
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger Jitsi Meet' });
      }
    };
    document.head.appendChild(script);
  }
}
