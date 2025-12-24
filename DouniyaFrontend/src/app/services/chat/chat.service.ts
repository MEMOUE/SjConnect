import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, ChatNotification, Conversation, Message } from '../../models/chat.model';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = environment.apiUrl + '/chat';

  // Observables pour WebSocket
  private isConnectedSubject = new BehaviorSubject<boolean>(false);
  public isConnected$ = this.isConnectedSubject.asObservable();

  private messageReceivedSubject = new Subject<ChatNotification>();
  public onMessageReceived$ = this.messageReceivedSubject.asObservable();

  private typingNotificationSubject = new Subject<ChatNotification>();
  public onTypingNotification$ = this.typingNotificationSubject.asObservable();

  private userStatusChangeSubject = new Subject<ChatNotification>();
  public onUserStatusChange$ = this.userStatusChangeSubject.asObservable();

  // WebSocket connection (TODO: implémenter avec STOMP)
  private stompClient: any = null;

  constructor(private http: HttpClient) {
    console.log('💬 ChatService initialized with API URL:', this.apiUrl);
  }

  // ============================================
  // GESTION DES CONVERSATIONS
  // ============================================

  /**
   * Obtenir la liste des conversations (paginée)
   */
  getConversations(page: number = 0, size: number = 20): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', 'updatedAt,desc');

    return this.http.get<any>(`${this.apiUrl}/conversations`, { params });
  }

  /**
   * Créer une nouvelle conversation
   */
  createConversation(
    participantIds: number[],
    isGroup: boolean = false,
    name?: string
  ): Observable<ApiResponse<Conversation>> {
    return this.http.post<ApiResponse<Conversation>>(
      `${this.apiUrl}/conversations`,
      {
        name: name || 'Nouvelle conversation',
        isGroup: isGroup,
        participantIds: participantIds
      }
    );
  }

  /**
   * Rechercher des conversations
   */
  searchConversations(searchTerm: string): Observable<Conversation[]> {
    const params = new HttpParams().set('q', searchTerm);
    return this.http.get<Conversation[]>(`${this.apiUrl}/conversations/search`, { params });
  }

  // ============================================
  // GESTION DES MESSAGES
  // ============================================

  /**
   * Obtenir les messages d'une conversation (paginé)
   */
  getMessages(conversationId: number, page: number = 0, size: number = 50): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', 'createdAt,desc');

    return this.http.get<any>(
      `${this.apiUrl}/conversations/${conversationId}/messages`,
      { params }
    );
  }

  /**
   * Envoyer un message
   */
  sendMessage(
    conversationId: number,
    content: string,
    type: string = 'TEXT',
    fileUrl?: string,
    fileName?: string,
    parentMessageId?: number
  ): Observable<ApiResponse<Message>> {
    let params = new HttpParams()
      .set('content', content)
      .set('type', type);

    if (fileUrl) {
      params = params.set('fileUrl', fileUrl);
    }
    if (fileName) {
      params = params.set('fileName', fileName);
    }
    if (parentMessageId) {
      params = params.set('parentMessageId', parentMessageId.toString());
    }

    return this.http.post<ApiResponse<Message>>(
      `${this.apiUrl}/conversations/${conversationId}/messages`,
      null,
      { params }
    );
  }

  /**
   * Marquer les messages comme lus
   */
  markAsRead(conversationId: number, messageIds?: number[]): Observable<ApiResponse<void>> {
    let params = new HttpParams();

    if (messageIds && messageIds.length > 0) {
      messageIds.forEach(id => {
        params = params.append('messageIds', id.toString());
      });
    }

    return this.http.post<ApiResponse<void>>(
      `${this.apiUrl}/conversations/${conversationId}/read`,
      null,
      { params }
    );
  }

  // ============================================
  // WEBSOCKET (À implémenter avec STOMP)
  // ============================================

  /**
   * Se connecter au WebSocket
   */
  connect(): void {
    console.log('🔌 WebSocket connection (STOMP)');

    // TODO: Implémenter avec @stomp/stompjs et SockJS
    // const socket = new SockJS(`${environment.apiUrl}/ws`);
    // this.stompClient = Stomp.over(socket);
    // this.stompClient.connect({}, (frame: any) => {
    //   console.log('Connected: ' + frame);
    //   this.isConnectedSubject.next(true);
    //
    //   // S'abonner aux topics globaux
    //   this.stompClient.subscribe('/user/queue/messages', (message: any) => {
    //     const notification = JSON.parse(message.body);
    //     this.messageReceivedSubject.next(notification);
    //   });
    // });

    // Simulation pour l'instant
    setTimeout(() => {
      this.isConnectedSubject.next(true);
      console.log('✅ WebSocket connected (simulated)');
    }, 1000);
  }

  /**
   * Se déconnecter du WebSocket
   */
  disconnect(): void {
    if (this.stompClient) {
      this.stompClient.disconnect();
    }
    this.isConnectedSubject.next(false);
    console.log('🔌 WebSocket disconnected');
  }

  /**
   * S'abonner aux notifications d'une conversation
   */
  subscribeToConversation(conversationId: number): void {
    console.log(`📨 Subscribed to conversation ${conversationId}`);

    // TODO: Implémenter avec STOMP
    // this.stompClient.subscribe(`/topic/conversation/${conversationId}`, (message: any) => {
    //   const notification = JSON.parse(message.body);
    //   if (notification.type === 'NEW_MESSAGE') {
    //     this.messageReceivedSubject.next(notification);
    //   } else if (notification.type === 'USER_TYPING' || notification.type === 'USER_STOP_TYPING') {
    //     this.typingNotificationSubject.next(notification);
    //   }
    // });
  }

  /**
   * Envoyer une notification de frappe
   */
  sendTypingNotification(conversationId: number): void {
    console.log(`⌨️ Typing notification for conversation ${conversationId}`);

    // TODO: Implémenter avec STOMP
    // this.stompClient.send('/app/chat.typing', {}, JSON.stringify({
    //   conversationId: conversationId
    // }));
  }

  /**
   * Arrêter la notification de frappe
   */
  sendStopTypingNotification(conversationId: number): void {
    console.log(`⌨️ Stop typing notification for conversation ${conversationId}`);

    // TODO: Implémenter avec STOMP
    // this.stompClient.send('/app/chat.stopTyping', {}, JSON.stringify({
    //   conversationId: conversationId
    // }));
  }
}
