import { ElementRef, Injectable, signal } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { MessageService } from 'primeng/api';
import { AuthService } from '../auth/auth.service';
import { TranslationService } from '../translation/translation.service';
import { TtsService } from '../tts/tts.service';
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
 * Langues parlées / de sous-titres proposées pendant un appel.
 * - bcp47 : code envoyé au transcriber (reconnaissance vocale Google Cloud), doit
 *   exister dans transcriber-langs.json de Jitsi.
 * - code : langue de traduction, doit matcher LT_LOAD_ONLY du service LibreTranslate (docker-compose.yml).
 */
export const LANGUES_APPEL = [
  { code: 'fr', label: 'Français', bcp47: 'fr-FR' },
  { code: 'en', label: 'English', bcp47: 'en-US' },
  { code: 'ar', label: 'العربية', bcp47: 'ar-SA' },
  { code: 'es', label: 'Español', bcp47: 'es-ES' },
  { code: 'de', label: 'Deutsch', bcp47: 'de-DE' },
  { code: 'it', label: 'Italiano', bcp47: 'it-IT' },
  { code: 'tr', label: 'Türkçe', bcp47: 'tr-TR' },
];

export interface SousTitre {
  id: string;
  nom: string;
  texte: string;
}

const CLE_LANGUE_PARLEE = 'sjc.call.langueParlee';
const CLE_LANGUE_SOUS_TITRES = 'sjc.call.langueSousTitres';
const DUREE_AFFICHAGE_SOUS_TITRE_MS = 8000;
const MAX_SOUS_TITRES = 3;
const CLE_LECTURE_VOCALE = 'sjc.call.lectureVocale';
const MAX_PHRASES_LUES_EN_ATTENTE = 3;
/** WAV silencieux : sert à débloquer la lecture audio au clic de l'utilisateur. */
const SILENCE_WAV = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
const DELAI_TRADUCTION_PROVISOIRE_MS = 700;

function lireLangue(cle: string): string | null {
  try { return localStorage.getItem(cle); } catch { return null; }
}

function ecrireLangue(cle: string, code: string): void {
  try { localStorage.setItem(cle, code); } catch { /* stockage indisponible */ }
}

/** Langue du navigateur si elle est proposée, sinon le français. */
function langueParDefaut(): string {
  const primaire = (navigator.language || 'fr').split('-')[0].toLowerCase();
  return LANGUES_APPEL.some(l => l.code === primaire) ? primaire : 'fr';
}

function langueValide(code: string | null): string | null {
  return code && LANGUES_APPEL.some(l => l.code === code) ? code : null;
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

  readonly languesAppel = LANGUES_APPEL;
  sousTitresActifs = signal(false);
  /** Langue que parle ce participant : détermine la reconnaissance vocale de sa voix. */
  langueParlee = signal(langueValide(lireLangue(CLE_LANGUE_PARLEE)) ?? langueParDefaut());
  /** Langue dans laquelle ce participant lit les sous-titres, quelle que soit la langue de l'orateur. */
  langueSousTitres = signal(langueValide(lireLangue(CLE_LANGUE_SOUS_TITRES)) ?? this.langueParlee());
  sousTitres = signal<SousTitre[]>([]);
  transcriptionEnCours = signal(false);
  /** Lecture à voix haute des sous-titres traduits (Google Text-to-Speech, voix du navigateur en secours). */
  readonly lectureVocaleDisponible = typeof Audio !== 'undefined';
  lectureVocaleActive = signal(this.lectureVocaleDisponible && lireLangue(CLE_LECTURE_VOCALE) === '1');
  private lecteur = typeof Audio !== 'undefined' ? new Audio() : (null as unknown as HTMLAudioElement);
  private fileLecture: { texte: string; codeLangue: string; audio: Promise<string | null> }[] = [];
  private lectureEnCours = false;
  /** Incrémenté à chaque arrêt : invalide les lectures/synthèses en vol. */
  private generationLecture = 0;
  /** Identifiant Jitsi du participant local : on ne relit pas sa propre voix. */
  private idLocal: string | null = null;
  private sousTitresTimers = new Map<string, any>();
  /** Horodatage de la dernière traduction provisoire lancée, par phrase (messageID). */
  private dernierePartielle = new Map<string, number>();
  /** Numéro de la dernière requête de traduction par phrase : ignore les réponses obsolètes. */
  private versionsSousTitres = new Map<string, number>();

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
  /** Évite de rappeler onJoined lors d'une reconnexion (changement de langue parlée, Réessayer). */
  private dejaRejoint = false;

  private onInviteFn: ((email: string) => Observable<unknown>) | null = null;
  private onJoinedFn?: () => void;
  private onEndedFn?: () => void;

  constructor(
    private authService: AuthService,
    private messageService: MessageService,
    private translationService: TranslationService,
    private ttsService: TtsService
  ) {
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
    this.dejaRejoint = false;
    this.minimized.set(false);
    this.jitsiPret.set(false);
    this.jitsiErreur.set(null);
    this.jitsiScriptAttentAttempts = 0;
    this.microActif.set(true);
    this.cameraActive.set(options.callType === 'video');
    this.partageEcran.set(false);
    this.sousTitresActifs.set(false);
    this.viderSousTitres();
    this.transcriptionEnCours.set(false);
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
      'chat', 'tileview', 'select-background', 'closedcaptions', 'hangup'
    ];
    if (this.isScreenShareSupported()) toolbarButtons.splice(2, 0, 'desktop');

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
        toolbarButtons,
        transcription: {
          enabled: true,
          translationEnabled: true,
          // Doit matcher LT_LOAD_ONLY du service LibreTranslate (docker-compose.yml)
          translationLanguages: ['en', 'fr', 'ar', 'it', 'es', 'de', 'tr'],
          translationLanguagesHead: ['fr', 'en'],
          // La langue parlée choisie par le participant (et non celle de
          // l'interface) sert à la reconnaissance vocale Google Cloud de sa voix.
          useAppLanguage: false,
          preferredLanguage: this.bcp47LangueParlee()
        }
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

      this.jitsiApi.addEventListener('videoConferenceJoined', (e: any) => {
        this.idLocal = e?.id ?? null;
        const dejaConnecte = this.dejaRejoint;
        this.dejaRejoint = true;
        this.jitsiPret.set(true);
        this.jitsiErreur.set(null);
        this.participantsCount.set(1);
        if (this.jitsiJoinTimeoutId) { clearTimeout(this.jitsiJoinTimeoutId); this.jitsiJoinTimeoutId = null; }
        if (!dejaConnecte) this.onJoinedFn?.();
        // Reconnexion après un changement de langue parlée : on redemande le transcriber.
        if (this.sousTitresActifs()) this.appliquerSousTitres();
      });
      this.jitsiApi.addEventListener('participantJoined', () => this.participantsCount.update(n => n + 1));
      this.jitsiApi.addEventListener('participantLeft', () => {
        this.participantsCount.update(n => Math.max(0, n - 1));
      });
      this.jitsiApi.addEventListener('audioMuteStatusChanged', (e: any) => this.microActif.set(!e.muted));
      this.jitsiApi.addEventListener('videoMuteStatusChanged', (e: any) => this.cameraActive.set(!e.muted));
      this.jitsiApi.addEventListener('screenSharingStatusChanged', (e: any) => this.partageEcran.set(e.on));
      this.jitsiApi.addEventListener('transcribingStatusChanged', (e: any) => this.transcriptionEnCours.set(!!e.on));
      this.jitsiApi.addEventListener('transcriptionChunkReceived', (e: any) => this.recevoirTranscription(e?.data ?? e));
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
    this.viderSousTitres();
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
  togglePartageEcran(): void {
    if (!this.isScreenShareSupported()) {
      this.messageService.add({
        severity: 'info',
        summary: 'Partage d\'écran indisponible',
        detail: 'Safari sur iPhone/iPad ne permet pas le partage d\'écran depuis un navigateur (limitation d\'Apple, pas de l\'application). Utilisez un ordinateur ou un appareil Android pour partager votre écran.',
        life: 6000
      });
      return;
    }
    if (this.jitsiApi) this.jitsiApi.executeCommand('toggleShareScreen');
  }

  /** Active/désactive les sous-titres : le premier participant qui les demande démarre le transcriber Jigasi. */
  toggleSousTitres(): void {
    if (!this.jitsiApi) return;
    this.sousTitresActifs.update(v => !v);
    if (!this.sousTitresActifs()) this.viderSousTitres();
    this.appliquerSousTitres();
  }

  changerLangueSousTitres(code: string): void {
    this.langueSousTitres.set(code);
    ecrireLangue(CLE_LANGUE_SOUS_TITRES, code);
    this.viderSousTitres();
    if (!this.sousTitresActifs()) {
      this.sousTitresActifs.set(true);
      this.appliquerSousTitres();
    }
  }

  /**
   * La langue parlée est lue par Jitsi à l'entrée dans la conférence : la
   * changer en cours d'appel impose une reconnexion rapide.
   */
  changerLangueParlee(code: string): void {
    if (code === this.langueParlee()) return;
    this.langueParlee.set(code);
    ecrireLangue(CLE_LANGUE_PARLEE, code);
    if (this.active() && this.jitsiApi) {
      this.jitsiScriptAttentAttempts = 0;
      this.initialiserJitsi();
    }
  }

  private bcp47LangueParlee(): string {
    return LANGUES_APPEL.find(l => l.code === this.langueParlee())?.bcp47 ?? 'fr-FR';
  }

  /**
   * Demande (ou arrête) le transcriber sans l'affichage natif de Jitsi : les
   * sous-titres sont rendus par CallOverlay, traduits dans la langue de chacun.
   */
  private appliquerSousTitres(): void {
    if (!this.jitsiApi) return;
    this.jitsiApi.executeCommand('setSubtitles', this.sousTitresActifs(), false, null);
  }

  /**
   * Chaque fragment de transcription arrive dans la langue de l'orateur. Les
   * fragments intermédiaires ne sont affichés que s'ils sont déjà dans la langue
   * du lecteur ; les phrases finales sont traduites via LibreTranslate.
   */
  private recevoirTranscription(chunk: any): void {
    if (!this.sousTitresActifs() || !chunk?.messageID) return;
    const estFinal = chunk.final !== undefined;
    const texte: string = (estFinal ? chunk.final : `${chunk.stable ?? ''}${chunk.unstable ?? ''}`).trim();
    if (!texte) return;

    const id = String(chunk.messageID);
    const nom = chunk.participant?.name || 'Participant';
    const estMoi = !!chunk.participant?.id && chunk.participant.id === this.idLocal;
    const cible = this.langueSousTitres();
    const source = String(chunk.language ?? '').split(/[-_]/)[0].toLowerCase();

    if (source === cible) {
      this.afficherSousTitre({ id, nom, texte }, estFinal);
      return;
    }

    // Traduction au fil de l'eau : sans elle, le lecteur attendait la phrase
    // finale de Google (plusieurs secondes). Les fragments provisoires sont
    // traduits au plus toutes les DELAI_TRADUCTION_PROVISOIRE_MS par phrase.
    const maintenant = Date.now();
    if (!estFinal) {
      if (maintenant - (this.dernierePartielle.get(id) ?? 0) < DELAI_TRADUCTION_PROVISOIRE_MS) return;
      this.dernierePartielle.set(id, maintenant);
    } else {
      this.dernierePartielle.delete(id);
    }

    const version = (this.versionsSousTitres.get(id) ?? 0) + 1;
    this.versionsSousTitres.set(id, version);
    this.translationService.translate(texte, cible).subscribe(traduit => {
      // Le lecteur a pu changer de langue ou couper les sous-titres entre-temps,
      // ou une réponse plus récente (ou la version finale) est déjà arrivée.
      if (!this.sousTitresActifs() || this.langueSousTitres() !== cible) return;
      if (this.versionsSousTitres.get(id) !== version) return;
      if (estFinal) this.versionsSousTitres.delete(id);
      this.afficherSousTitre({ id, nom, texte: traduit }, estFinal);
      // Seules les phrases traduites sont lues : dans la langue du lecteur, on
      // entend déjà l'orateur, la lecture ferait doublon.
      if (estFinal && !estMoi) this.lireAVoixHaute(traduit, cible);
    });
  }

  /** Active/désactive la lecture à voix haute des sous-titres traduits (Google Text-to-Speech). */
  toggleLectureVocale(): void {
    if (!this.lectureVocaleDisponible) return;
    const actif = !this.lectureVocaleActive();
    this.lectureVocaleActive.set(actif);
    ecrireLangue(CLE_LECTURE_VOCALE, actif ? '1' : '0');
    if (actif) {
      // Les navigateurs (surtout iOS) n'autorisent la lecture audio qu'après un geste de
      // l'utilisateur : ce clic « débloque » le lecteur réutilisé ensuite pour chaque phrase.
      this.lecteur.src = SILENCE_WAV;
      this.lecteur.play().catch(() => { /* débloquage best-effort */ });
      if (typeof speechSynthesis !== 'undefined') speechSynthesis.speak(new SpeechSynthesisUtterance(''));
    } else {
      this.arreterLecture();
    }
  }

  private lireAVoixHaute(texte: string, codeLangue: string): void {
    if (!this.lectureVocaleActive() || !texte.trim()) return;
    // File d'attente bornée : en cas de retard, on sacrifie les phrases les plus anciennes.
    while (this.fileLecture.length >= MAX_PHRASES_LUES_EN_ATTENTE) this.fileLecture.shift();
    // La synthèse démarre dès l'arrivée de la phrase (pendant que la précédente est lue).
    const audio = firstValueFrom(this.ttsService.synthesize(texte, codeLangue)).catch(() => null);
    this.fileLecture.push({ texte, codeLangue, audio });
    this.lireSuivante();
  }

  private async lireSuivante(): Promise<void> {
    if (this.lectureEnCours) return;
    const phrase = this.fileLecture.shift();
    if (!phrase) return;
    this.lectureEnCours = true;
    const generation = this.generationLecture;
    let terminee = false;
    const finie = () => {
      if (terminee || generation !== this.generationLecture) return; // déjà passée, ou lecture arrêtée
      terminee = true;
      this.lectureEnCours = false;
      this.lireSuivante();
    };

    const url = await phrase.audio;
    if (generation !== this.generationLecture) return;
    if (url) {
      this.lecteur.src = url;
      this.lecteur.onended = finie;
      let secours = false;
      const basculer = () => { if (!secours) { secours = true; this.lireAvecVoixNavigateur(phrase, finie); } };
      this.lecteur.onerror = basculer;
      this.lecteur.play().catch(basculer);
    } else {
      // Google indisponible (clé absente, quota, réseau) : voix intégrée au navigateur.
      this.lireAvecVoixNavigateur(phrase, finie);
    }
  }

  private lireAvecVoixNavigateur(phrase: { texte: string; codeLangue: string }, finie: () => void): void {
    if (typeof speechSynthesis === 'undefined') { finie(); return; }
    const bcp47 = LANGUES_APPEL.find(l => l.code === phrase.codeLangue)?.bcp47 ?? 'fr-FR';
    const u = new SpeechSynthesisUtterance(phrase.texte);
    u.lang = bcp47;
    const voix = speechSynthesis.getVoices().find(v => v.lang.replace('_', '-').toLowerCase().startsWith(phrase.codeLangue));
    if (voix) u.voice = voix;
    u.onend = u.onerror = finie;
    speechSynthesis.speak(u);
  }

  private arreterLecture(): void {
    this.generationLecture++;
    this.fileLecture = [];
    this.lectureEnCours = false;
    this.lecteur.onended = null;
    this.lecteur.onerror = null;
    this.lecteur.pause();
    if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
  }

  private afficherSousTitre(sousTitre: SousTitre, estFinal: boolean): void {
    this.sousTitres.update(liste => {
      const autres = liste.filter(s => s.id !== sousTitre.id);
      return [...autres, sousTitre].slice(-MAX_SOUS_TITRES);
    });

    clearTimeout(this.sousTitresTimers.get(sousTitre.id));
    if (estFinal) {
      this.sousTitresTimers.set(sousTitre.id, setTimeout(() => {
        this.sousTitresTimers.delete(sousTitre.id);
        this.sousTitres.update(liste => liste.filter(s => s.id !== sousTitre.id));
      }, DUREE_AFFICHAGE_SOUS_TITRE_MS));
    }
  }

  private viderSousTitres(): void {
    this.sousTitresTimers.forEach(t => clearTimeout(t));
    this.sousTitresTimers.clear();
    this.arreterLecture();
    this.dernierePartielle.clear();
    this.versionsSousTitres.clear();
    this.sousTitres.set([]);
  }

  isMobileDevice(): boolean {
    return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
      || window.matchMedia('(max-width: 768px)').matches;
  }

  /** Détection par capacité réelle plutôt que par UA : certains Android récents
   * supportent le partage d'écran (au moins l'onglet/appli en cours) alors
   * qu'iOS Safari ne l'implémente pas du tout — un simple isMobileDevice()
   * masquait le bouton pour tout le monde, y compris les téléphones qui le supportent. */
  isScreenShareSupported(): boolean {
    return !!(navigator.mediaDevices && typeof navigator.mediaDevices.getDisplayMedia === 'function');
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
