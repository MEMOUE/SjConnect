import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, Subject, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

// ============================================
// INTERFACES
// ============================================

export interface Conversation {
  id: number;
  name: string;
  avatar: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  isOnline: boolean;
  isGroup: boolean;
  participants?: Participant[];
}

export interface Participant {
  id: number;
  username: string;
  fullName: string;
  avatar?: string;
  isOnline: boolean;
}

export interface Message {
  id: number;
  senderId: number;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  type: string;
  fileUrl?: string;
  fileName?: string;
  conversationId: number;
  createdAt?: string;
}

export interface ChatNotification {
  type: string;
  conversationId: number;
  username?: string;
  message?: {
    id: number;
    senderId: number;
    senderName: string;
    senderAvatar?: string;
    content: string;
    timestamp: string;
    type: string;
    conversationId: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  content: T[];
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = environment.apiUrl + '/chat';

  // Observables pour WebSocket (simulation pour l'instant)
  private isConnectedSubject = new BehaviorSubject<boolean>(false);
  public isConnected$ = this.isConnectedSubject.asObservable();

  private messageReceivedSubject = new Subject<ChatNotification>();
  public onMessageReceived$ = this.messageReceivedSubject.asObservable();

  private typingNotificationSubject = new Subject<ChatNotification>();
  public onTypingNotification$ = this.typingNotificationSubject.asObservable();

  private userStatusChangeSubject = new Subject<ChatNotification>();
  public onUserStatusChange$ = this.userStatusChangeSubject.asObservable();

  // Données de démonstration
  private demoConversations: any[] = [
    {
      id: 1,
      name: 'Équipe Marketing',
      avatar: 'EM',
      lastMessage: { content: 'La campagne est prête pour validation', createdAt: new Date(Date.now() - 5 * 60000) },
      unreadCount: 3,
      isOnline: true,
      isGroup: true,
      participants: []
    },
    {
      id: 2,
      name: 'Jean Dupont',
      avatar: 'JD',
      lastMessage: { content: 'Merci pour les documents', createdAt: new Date(Date.now() - 30 * 60000) },
      unreadCount: 0,
      isOnline: true,
      isGroup: false,
      participants: []
    },
    {
      id: 3,
      name: 'Projet Alpha',
      avatar: 'PA',
      lastMessage: { content: 'Réunion à 15h', createdAt: new Date(Date.now() - 2 * 3600000) },
      unreadCount: 1,
      isOnline: false,
      isGroup: true,
      participants: []
    }
  ];

  private demoMessages: any[] = [
    {
      id: 1,
      senderId: 2,
      senderName: 'Jean Dupont',
      senderAvatar: 'JD',
      content: 'Bonjour, avez-vous reçu mon dernier email ?',
      createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
      isRead: true,
      type: 'TEXT',
      conversationId: 1
    },
    {
      id: 2,
      senderId: 1,
      senderName: 'Moi',
      senderAvatar: 'ME',
      content: 'Oui, je l\'ai bien reçu. Je vais le traiter cet après-midi.',
      createdAt: new Date(Date.now() - 1.5 * 3600000).toISOString(),
      isRead: true,
      type: 'TEXT',
      conversationId: 1
    },
    {
      id: 3,
      senderId: 2,
      senderName: 'Jean Dupont',
      senderAvatar: 'JD',
      content: 'Parfait, merci ! N\'hésitez pas si vous avez des questions.',
      createdAt: new Date(Date.now() - 1 * 3600000).toISOString(),
      isRead: true,
      type: 'TEXT',
      conversationId: 1
    }
  ];

  constructor(private http: HttpClient) {
    console.log('💬 ChatService initialized with API URL:', this.apiUrl);
    console.log('⚠️  Using demo data - WebSocket not implemented yet');
  }

  // ============================================
  // GESTION DES CONVERSATIONS
  // ============================================

  /**
   * Obtenir la liste des conversations
   */
  getConversations(page: number = 0, size: number = 20): Observable<ApiResponse<Conversation>> {
    console.log('📥 Loading conversations (demo data)');

    // Retourner les données de démo pour l'instant
    const response: ApiResponse<Conversation> = {
      success: true,
      message: 'Conversations chargées avec succès',
      data: this.demoConversations[0] as any,
      content: this.demoConversations as any,
      timestamp: new Date().toISOString()
    };

    return of(response).pipe(delay(500)); // Simuler un délai réseau
  }

  /**
   * Créer une nouvelle conversation
   */
  createConversation(participants: number[], isGroup: boolean = false, name?: string): Observable<ApiResponse<Conversation>> {
    console.log('📤 Creating conversation (not implemented yet)');

    const newConv = {
      id: Date.now(),
      name: name || 'Nouvelle conversation',
      avatar: 'NC',
      lastMessage: { content: '', createdAt: new Date() },
      unreadCount: 0,
      isOnline: false,
      isGroup: isGroup,
      participants: []
    };

    const response: ApiResponse<Conversation> = {
      success: true,
      message: 'Conversation créée',
      data: newConv as any,
      content: [newConv as any],
      timestamp: new Date().toISOString()
    };

    return of(response).pipe(delay(300));
  }

  // ============================================
  // GESTION DES MESSAGES
  // ============================================

  /**
   * Obtenir les messages d'une conversation
   */
  getMessages(conversationId: number, page: number = 0, size: number = 50): Observable<ApiResponse<Message>> {
    console.log(`📥 Loading messages for conversation ${conversationId} (demo data)`);

    const response: ApiResponse<Message> = {
      success: true,
      message: 'Messages chargés avec succès',
      data: this.demoMessages[0] as any,
      content: this.demoMessages as any,
      timestamp: new Date().toISOString()
    };

    return of(response).pipe(delay(300));
  }

  /**
   * Envoyer un message
   */
  sendMessage(conversationId: number, content: string, type: string = 'TEXT'): Observable<ApiResponse<Message>> {
    console.log(`📤 Sending message to conversation ${conversationId} (demo)`);

    const newMessage = {
      id: Date.now(),
      senderId: 1,
      senderName: 'Moi',
      senderAvatar: 'ME',
      content: content,
      createdAt: new Date().toISOString(),
      isRead: false,
      type: type,
      conversationId: conversationId
    };

    // Ajouter aux messages de démo
    this.demoMessages.push(newMessage);

    const response: ApiResponse<Message> = {
      success: true,
      message: 'Message envoyé',
      data: newMessage as any,
      content: [newMessage as any],
      timestamp: new Date().toISOString()
    };

    return of(response).pipe(delay(200));
  }

  /**
   * Marquer les messages comme lus
   */
  markAsRead(conversationId: number): Observable<ApiResponse<void>> {
    console.log(`✅ Marking messages as read for conversation ${conversationId}`);

    const response: ApiResponse<void> = {
      success: true,
      message: 'Messages marqués comme lus',
      data: undefined as any,
      content: [] as any,
      timestamp: new Date().toISOString()
    };

    return of(response).pipe(delay(100));
  }

  // ============================================
  // WEBSOCKET (Simulation pour l'instant)
  // ============================================

  /**
   * Se connecter au WebSocket
   * TODO: Implémenter la vraie connexion WebSocket plus tard
   */
  connect(): void {
    console.log('🔌 WebSocket connection (simulated)');
    // Simuler une connexion réussie après 1 seconde
    setTimeout(() => {
      this.isConnectedSubject.next(true);
      console.log('✅ WebSocket connected (simulated)');
    }, 1000);
  }

  /**
   * Se déconnecter du WebSocket
   */
  disconnect(): void {
    console.log('🔌 WebSocket disconnection (simulated)');
    this.isConnectedSubject.next(false);
  }

  /**
   * S'abonner aux notifications d'une conversation
   */
  subscribeToConversation(conversationId: number): void {
    console.log(`📨 Subscribed to conversation ${conversationId} (simulated)`);
    // TODO: Implémenter l'abonnement WebSocket réel
  }

  /**
   * Envoyer une notification de frappe
   */
  sendTypingNotification(conversationId: number): void {
    console.log(`⌨️ Typing notification sent for conversation ${conversationId} (simulated)`);
    // TODO: Envoyer via WebSocket
  }

  /**
   * Arrêter la notification de frappe
   */
  sendStopTypingNotification(conversationId: number): void {
    console.log(`⌨️ Stop typing notification sent for conversation ${conversationId} (simulated)`);
    // TODO: Envoyer via WebSocket
  }
}
