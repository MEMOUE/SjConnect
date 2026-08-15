import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ChatService } from '../chat/chat.service';
import { AuthService } from '../auth/auth.service';
import { ChatNotification } from '../../models/chat.model';

/**
 * Centralise les notifications temps réel (nouveaux messages, appels démarrés)
 * indépendamment de la page affichée : la connexion WebSocket est démarrée
 * une fois au niveau racine de l'app (voir App) et reste active tant que
 * l'utilisateur est connecté, contrairement à celle du composant Chat qui
 * se coupe quand on quitte la page.
 */
@Injectable({
  providedIn: 'root'
})
export class NotificationCenterService {

  private started = false;
  private notificationPermissionRequested = false;
  private activeConversationId: number | null = null;

  constructor(
    private chatService: ChatService,
    private authService: AuthService,
    private messageService: MessageService,
    private router: Router,
    private ngZone: NgZone
  ) {}

  start(): void {
    if (this.started || !this.authService.isAuthenticated()) return;
    this.started = true;

    this.chatService.connect();
    this.requestBrowserNotificationPermission();

    this.chatService.onMessageReceived$.subscribe(notif => this.handleNewMessage(notif));
    this.chatService.onCallStarted$.subscribe(notif => this.handleCallStarted(notif));
  }

  stop(): void {
    this.started = false;
    this.chatService.disconnect();
  }

  /** Le composant Chat indique quelle conversation est actuellement affichée, pour éviter les doublons. */
  setActiveConversationId(id: number | null): void {
    this.activeConversationId = id;
  }

  private handleNewMessage(notif: ChatNotification): void {
    if (this.isViewingConversation(notif.conversationId)) return;

    const senderName = notif.message?.senderName || 'Nouveau message';
    const content = notif.message?.content || 'Vous a envoyé un fichier';

    this.ngZone.run(() => {
      this.messageService.add({
        severity: 'info',
        summary: senderName,
        detail: content,
        life: 6000,
        data: { conversationId: notif.conversationId }
      });
    });

    this.showBrowserNotification(senderName, content);
  }

  private handleCallStarted(notif: ChatNotification): void {
    // Le composant Chat gère déjà en interne, pour toutes les conversations,
    // la notification d'appel + le bouton "Rejoindre" tant qu'il est monté.
    if (this.router.url.includes('/chat')) return;

    const callerName = notif.username || 'Quelqu\'un';
    const detail = `${callerName} a démarré un appel`;

    this.ngZone.run(() => {
      this.messageService.add({
        severity: 'info',
        summary: 'Appel entrant',
        detail,
        sticky: true,
        data: { conversationId: notif.conversationId }
      });
    });

    this.showBrowserNotification('Appel entrant', detail);
  }

  private isViewingConversation(conversationId: number): boolean {
    return conversationId === this.activeConversationId && this.router.url.includes('/chat');
  }

  private requestBrowserNotificationPermission(): void {
    if (this.notificationPermissionRequested) return;
    this.notificationPermissionRequested = true;

    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => { /* ignore */ });
    }
  }

  private showBrowserNotification(title: string, body: string): void {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    if (document.visibilityState === 'visible') return; // l'onglet est actif, le toast suffit

    const notification = new Notification(title, { body, icon: '/logo.png' });
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }
}
