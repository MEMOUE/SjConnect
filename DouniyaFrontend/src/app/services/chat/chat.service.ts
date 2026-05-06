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
  private wsUrl  = environment.apiUrl.replace('/api', '') + '/ws';

  private isConnectedSubject        = new BehaviorSubject<boolean>(false);
  public  isConnected$              = this.isConnectedSubject.asObservable();
  private messageReceivedSubject    = new Subject<ChatNotification>();
  public  onMessageReceived$        = this.messageReceivedSubject.asObservable();
  private typingNotificationSubject = new Subject<ChatNotification>();
  public  onTypingNotification$     = this.typingNotificationSubject.asObservable();
  private userStatusChangeSubject   = new Subject<ChatNotification>();
  public  onUserStatusChange$       = this.userStatusChangeSubject.asObservable();
  // Nouveaux sujets pour édition/suppression temps réel
  private messageEditedSubject      = new Subject<ChatNotification>();
  public  onMessageEdited$          = this.messageEditedSubject.asObservable();
  private messageDeletedSubject     = new Subject<ChatNotification>();
  public  onMessageDeleted$         = this.messageDeletedSubject.asObservable();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private stompClient: any = null;
  private subscribedConversations = new Set<number>();

  constructor(private http: HttpClient) {}

  // ============================================
  // CONVERSATIONS
  // ============================================

  getConversations(page = 0, size = 30): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', 'updatedAt,desc');
    return this.http.get<any>(`${this.apiUrl}/conversations`, { params });
  }

  createConversation(
    participantIds: number[],
    isGroup = false,
    name?: string
  ): Observable<ApiResponse<Conversation>> {
    return this.http.post<ApiResponse<Conversation>>(
      `${this.apiUrl}/conversations`,
      { name: name || 'Nouvelle conversation', isGroup, participantIds }
    );
  }

  searchConversations(searchTerm: string): Observable<Conversation[]> {
    const params = new HttpParams().set('q', searchTerm);
    return this.http.get<Conversation[]>(`${this.apiUrl}/conversations/search`, { params });
  }

  // ============================================
  // GESTION DE GROUPE (NOUVEAU)
  // ============================================

  /**
   * Mettre à jour une conversation (nom, etc.)
   * Backend requis : PUT /api/chat/conversations/{id}
   */
  updateConversation(
    conversationId: number,
    data: { name?: string }
  ): Observable<ApiResponse<Conversation>> {
    return this.http.put<ApiResponse<Conversation>>(
      `${this.apiUrl}/conversations/${conversationId}`,
      data
    );
  }

  /**
   * Ajouter des participants à une conversation de groupe
   * Backend requis : POST /api/chat/conversations/{id}/participants
   */
  addParticipants(
    conversationId: number,
    participantIds: number[]
  ): Observable<ApiResponse<Conversation>> {
    return this.http.post<ApiResponse<Conversation>>(
      `${this.apiUrl}/conversations/${conversationId}/participants`,
      { participantIds }
    );
  }

  /**
   * Retirer un participant d'un groupe
   * Backend requis : DELETE /api/chat/conversations/{id}/participants/{userId}
   */
  removeParticipant(
    conversationId: number,
    userId: number
  ): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(
      `${this.apiUrl}/conversations/${conversationId}/participants/${userId}`
    );
  }

  /**
   * Quitter une conversation de groupe
   * Backend requis : POST /api/chat/conversations/{id}/leave
   */
  leaveConversation(conversationId: number): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(
      `${this.apiUrl}/conversations/${conversationId}/leave`,
      null
    );
  }

  /**
   * Supprimer une conversation (admin/créateur uniquement)
   * Backend requis : DELETE /api/chat/conversations/{id}
   */
  deleteConversation(conversationId: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(
      `${this.apiUrl}/conversations/${conversationId}`
    );
  }

  // ============================================
  // B2B — Contacter une entreprise depuis le Marketplace
  // ============================================

  contacterEntreprise(entrepriseId: number): Observable<ApiResponse<Conversation>> {
    return this.http.post<ApiResponse<Conversation>>(
      `${this.apiUrl}/b2b/${entrepriseId}`,
      null
    );
  }

  startPrivateConversation(targetUserId: number): Observable<ApiResponse<Conversation>> {
    return this.http.post<ApiResponse<Conversation>>(
      `${this.apiUrl}/private/${targetUserId}`,
      null
    );
  }

  // ============================================
  // MESSAGES
  // ============================================

  getMessages(conversationId: number, page = 0, size = 50): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', 'createdAt,desc');
    return this.http.get<any>(
      `${this.apiUrl}/conversations/${conversationId}/messages`,
      { params }
    );
  }

  sendMessage(
    conversationId: number,
    content: string,
    type = 'TEXT',
    fileUrl?: string,
    fileName?: string,
    parentMessageId?: number
  ): Observable<ApiResponse<Message>> {
    let params = new HttpParams()
      .set('content', content)
      .set('type', type);
    if (fileUrl)         params = params.set('fileUrl', fileUrl);
    if (fileName)        params = params.set('fileName', fileName);
    if (parentMessageId) params = params.set('parentMessageId', parentMessageId.toString());
    return this.http.post<ApiResponse<Message>>(
      `${this.apiUrl}/conversations/${conversationId}/messages`,
      null,
      { params }
    );
  }

  /**
   * Modifier un message existant
   * Backend requis : PUT /api/chat/messages/{messageId}
   */
  editMessage(messageId: number, content: string): Observable<ApiResponse<Message>> {
    return this.http.put<ApiResponse<Message>>(
      `${this.apiUrl}/messages/${messageId}`,
      null,
      { params: new HttpParams().set('content', content) }
    );
  }

  /**
   * Supprimer un message
   * Backend requis : DELETE /api/chat/messages/{messageId}
   */
  deleteMessage(messageId: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(
      `${this.apiUrl}/messages/${messageId}`
    );
  }

  uploadFile(file: File): Observable<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/upload`, formData);
  }

  markAsRead(conversationId: number, messageIds?: number[]): Observable<ApiResponse<void>> {
    let params = new HttpParams();
    messageIds?.forEach(id => { params = params.append('messageIds', id.toString()); });
    return this.http.post<ApiResponse<void>>(
      `${this.apiUrl}/conversations/${conversationId}/read`,
      null,
      { params }
    );
  }

  // ============================================
  // WEBSOCKET
  // ============================================

  connect(): void {
    import('@stomp/stompjs')
      .then(({ Client }) =>
        import('sockjs-client').then(SockJSModule => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const SockJS = (SockJSModule as any).default ?? SockJSModule;
          this.initStomp(Client, SockJS);
        }).catch(() => this.fallbackConnect())
      )
      .catch(() => this.fallbackConnect());
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private initStomp(Client: any, SockJS: any): void {
    const token = localStorage.getItem('accessToken');

    this.stompClient = new Client({
      webSocketFactory: () => new SockJS(this.wsUrl),
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,

      onConnect: () => {
        this.isConnectedSubject.next(true);
        console.log('✅ WebSocket STOMP connecté');

        this.stompClient.subscribe('/user/queue/messages', (msg: { body: string }) => {
          try {
            const notif: ChatNotification = JSON.parse(msg.body);
            switch (notif.type) {
              case 'NEW_MESSAGE':
                this.messageReceivedSubject.next(notif);
                break;
              case 'MESSAGE_EDITED':
                this.messageEditedSubject.next(notif);
                break;
              case 'MESSAGE_DELETED':
                this.messageDeletedSubject.next(notif);
                break;
            }
          } catch { /* ignore */ }
        });

        this.stompClient.subscribe('/topic/public', (msg: { body: string }) => {
          try {
            const notif: ChatNotification = JSON.parse(msg.body);
            if (notif.type === 'USER_ONLINE' || notif.type === 'USER_OFFLINE') {
              this.userStatusChangeSubject.next(notif);
            }
          } catch { /* ignore */ }
        });
      },

      onDisconnect: () => { this.isConnectedSubject.next(false); },
      onStompError:  () => { this.isConnectedSubject.next(false); },
      onWebSocketError: () => { this.fallbackConnect(); }
    });

    this.stompClient.activate();
  }

  private fallbackConnect(): void {
    console.warn(
      '⚠️ WebSocket temps réel désactivé.\n' +
      '   Pour l\'activer :\n' +
      '   npm install @stomp/stompjs sockjs-client\n' +
      '   npm install --save-dev @types/sockjs-client'
    );
    setTimeout(() => this.isConnectedSubject.next(true), 400);
  }

  disconnect(): void {
    if (this.stompClient?.active) this.stompClient.deactivate();
    this.isConnectedSubject.next(false);
    this.subscribedConversations.clear();
  }

  subscribeToConversation(conversationId: number): void {
    if (!this.stompClient?.active || this.subscribedConversations.has(conversationId)) return;

    this.stompClient.subscribe(
      `/topic/conversation/${conversationId}`,
      (msg: { body: string }) => {
        try {
          const notif: ChatNotification = JSON.parse(msg.body);
          switch (notif.type) {
            case 'NEW_MESSAGE':
              this.messageReceivedSubject.next(notif);
              break;
            case 'USER_TYPING':
            case 'USER_STOP_TYPING':
              this.typingNotificationSubject.next(notif);
              break;
            case 'MESSAGE_EDITED':
              this.messageEditedSubject.next(notif);
              break;
            case 'MESSAGE_DELETED':
              this.messageDeletedSubject.next(notif);
              break;
          }
        } catch { /* ignore */ }
      }
    );
    this.subscribedConversations.add(conversationId);
  }

  sendTypingNotification(conversationId: number): void {
    if (!this.stompClient?.active) return;
    try {
      this.stompClient.publish({
        destination: '/app/chat.typing',
        body: JSON.stringify({ conversationId })
      });
    } catch { /* ignore */ }
  }

  sendStopTypingNotification(conversationId: number): void {
    if (!this.stompClient?.active) return;
    try {
      this.stompClient.publish({
        destination: '/app/chat.stopTyping',
        body: JSON.stringify({ conversationId })
      });
    } catch { /* ignore */ }
  }
}
