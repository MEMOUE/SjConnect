import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { MultiSelectModule } from 'primeng/multiselect';
import { ChatService } from '../../services/chat/chat.service';
import { EmployeService } from '../../services/auth/employe.service';
import { AuthService } from '../../services/auth/auth.service';
import { Conversation, Message, ChatNotification } from '../../models/chat.model';
import { Subscription } from 'rxjs';
import {EmployeSimple} from '../../models/auth.model';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    MultiSelectModule
  ],
  templateUrl: './chat.html',
  styleUrl: './chat.css'
})
export class Chat implements OnInit, OnDestroy {
  @ViewChild('messageContainer') private messageContainer!: ElementRef;

  conversations: Conversation[] = [];
  filteredConversations: Conversation[] = [];
  selectedConversation: Conversation | null = null;
  messages: Message[] = [];

  newMessage = '';
  searchTerm = '';

  isLoading = false;
  isConnected = false;

  // Dialog nouvelle conversation
  showNewConversationDialog = false;
  newConversationName = '';
  isGroupConversation = false;
  selectedParticipants: EmployeSimple[] = [];
  availableEmployes: EmployeSimple[] = [];
  isLoadingEmployes = false;

  // Indicateur de frappe
  typingUsers: Map<number, string[]> = new Map();
  typingTimeout: any;

  // ID de l'utilisateur actuel
  currentUserId: number = 1;

  private subscriptions: Subscription[] = [];

  constructor(
    private chatService: ChatService,
    private employeService: EmployeService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Récupérer l'utilisateur actuel
    const currentUser = this.authService.getCurrentUserValue();
    if (currentUser) {
      this.currentUserId = currentUser.id;
    }

    this.loadConversations();
    this.connectToWebSocket();
    this.setupWebSocketListeners();
    this.loadEmployes();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.chatService.disconnect();
  }

  // ============================================
  // CHARGEMENT DES DONNÉES
  // ============================================

  loadConversations() {
    this.isLoading = true;
    const sub = this.chatService.getConversations().subscribe({
      next: (page) => {
        this.conversations = page.content.map((conv: any) => ({
          id: conv.id,
          name: conv.name,
          avatar: conv.avatar,
          lastMessage: conv.lastMessage?.content || '',
          lastMessageTime: conv.lastMessage?.createdAt ? new Date(conv.lastMessage.createdAt) : new Date(),
          unreadCount: conv.unreadCount || 0,
          isOnline: conv.isOnline || false,
          isGroup: conv.isGroup,
          participants: conv.participants || []
        }));
        this.filteredConversations = [...this.conversations];
        this.isLoading = false;

        if (this.conversations.length > 0 && !this.selectedConversation) {
          this.selectConversation(this.conversations[0]);
        }
      },
      error: (error) => {
        console.error('Erreur lors du chargement des conversations:', error);
        this.isLoading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  loadEmployes() {
    this.isLoadingEmployes = true;
    const sub = this.employeService.getAllEmployesForChat().subscribe({
      next: (employes) => {
        this.availableEmployes = employes;
        this.isLoadingEmployes = false;
        console.log('✅ Employés chargés:', employes.length);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des employés:', error);
        this.isLoadingEmployes = false;
      }
    });
    this.subscriptions.push(sub);
  }

  loadMessages(conversationId: number) {
    const sub = this.chatService.getMessages(conversationId).subscribe({
      next: (page) => {
        this.messages = page.content.map((msg: any) => ({
          id: msg.id,
          senderId: msg.senderId,
          senderName: msg.senderName,
          senderAvatar: msg.senderAvatar,
          content: msg.content,
          timestamp: new Date(msg.createdAt || Date.now()),
          isRead: msg.isRead,
          type: msg.type?.toLowerCase() || 'text',
          fileUrl: msg.fileUrl,
          fileName: msg.fileName,
          conversationId: conversationId
        })).reverse();

        this.chatService.markAsRead(conversationId).subscribe();
        setTimeout(() => this.scrollToBottom(), 100);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des messages:', error);
      }
    });
    this.subscriptions.push(sub);
  }

  // ============================================
  // WEBSOCKET
  // ============================================

  connectToWebSocket() {
    this.chatService.connect();

    const sub = this.chatService.isConnected$.subscribe(connected => {
      this.isConnected = connected;
      console.log('WebSocket status:', connected ? 'Connecté' : 'Déconnecté');
    });
    this.subscriptions.push(sub);
  }

  setupWebSocketListeners() {
    const msgSub = this.chatService.onMessageReceived$.subscribe({
      next: (notification: ChatNotification) => {
        this.handleNewMessage(notification);
      }
    });
    this.subscriptions.push(msgSub);

    const typingSub = this.chatService.onTypingNotification$.subscribe({
      next: (notification: ChatNotification) => {
        this.handleTypingNotification(notification);
      }
    });
    this.subscriptions.push(typingSub);

    const statusSub = this.chatService.onUserStatusChange$.subscribe({
      next: (notification: ChatNotification) => {
        this.handleUserStatusChange(notification);
      }
    });
    this.subscriptions.push(statusSub);
  }

  // ============================================
  // GESTION DES CONVERSATIONS
  // ============================================

  selectConversation(conversation: Conversation) {
    this.selectedConversation = conversation;
    conversation.unreadCount = 0;
    this.loadMessages(conversation.id);
    this.chatService.subscribeToConversation(conversation.id);
  }

  searchConversations() {
    if (this.searchTerm.trim()) {
      const sub = this.chatService.searchConversations(this.searchTerm).subscribe({
        next: (results) => {
          this.filteredConversations = results.map((conv: any) => ({
            id: conv.id,
            name: conv.name,
            avatar: conv.avatar,
            lastMessage: conv.lastMessage?.content || '',
            lastMessageTime: conv.lastMessage?.createdAt ? new Date(conv.lastMessage.createdAt) : new Date(),
            unreadCount: conv.unreadCount || 0,
            isOnline: conv.isOnline || false,
            isGroup: conv.isGroup,
            participants: conv.participants || []
          }));
        },
        error: () => {
          this.filteredConversations = this.conversations.filter(conv =>
            conv.name.toLowerCase().includes(this.searchTerm.toLowerCase())
          );
        }
      });
      this.subscriptions.push(sub);
    } else {
      this.filteredConversations = [...this.conversations];
    }
  }

  openNewConversationDialog() {
    this.showNewConversationDialog = true;
    this.newConversationName = '';
    this.isGroupConversation = false;
    this.selectedParticipants = [];

    // Recharger les employés si nécessaire
    if (this.availableEmployes.length === 0) {
      this.loadEmployes();
    }
  }

  createConversation() {
    if (!this.newConversationName.trim() || this.selectedParticipants.length === 0) {
      return;
    }

    const participantIds = this.selectedParticipants.map(p => p.id);

    const sub = this.chatService.createConversation(
      participantIds,
      this.isGroupConversation,
      this.newConversationName
    ).subscribe({
      next: (response) => {
        console.log('✅ Conversation créée:', response);
        this.showNewConversationDialog = false;
        this.newConversationName = '';
        this.isGroupConversation = false;
        this.selectedParticipants = [];
        this.loadConversations();
      },
      error: (error) => {
        console.error('❌ Erreur lors de la création:', error);
        alert('Erreur lors de la création de la conversation. Veuillez réessayer.');
      }
    });
    this.subscriptions.push(sub);
  }

  // ============================================
  // GESTION DES MESSAGES
  // ============================================

  sendMessage() {
    if (!this.newMessage.trim() || !this.selectedConversation) {
      return;
    }

    const content = this.newMessage;
    this.newMessage = '';

    this.chatService.sendStopTypingNotification(this.selectedConversation.id);

    const sub = this.chatService.sendMessage(
      this.selectedConversation.id,
      content
    ).subscribe({
      next: (response) => {
        const msgData = response.data;
        const message: Message = {
          id: msgData.id,
          senderId: msgData.senderId,
          senderName: msgData.senderName,
          senderAvatar: msgData.senderAvatar,
          content: msgData.content,
          timestamp: new Date(msgData.createdAt || Date.now()),
          isRead: false,
          type: 'text',
          conversationId: this.selectedConversation!.id
        };

        this.messages.push(message);

        if (this.selectedConversation) {
          this.selectedConversation.lastMessage = content;
          this.selectedConversation.lastMessageTime = new Date();
        }

        setTimeout(() => this.scrollToBottom(), 100);
      },
      error: (error) => {
        console.error('Erreur lors de l\'envoi du message:', error);
        this.newMessage = content;
      }
    });
    this.subscriptions.push(sub);
  }

  onTyping() {
    if (this.selectedConversation && this.newMessage.trim()) {
      this.chatService.sendTypingNotification(this.selectedConversation.id);

      clearTimeout(this.typingTimeout);
      this.typingTimeout = setTimeout(() => {
        if (this.selectedConversation) {
          this.chatService.sendStopTypingNotification(this.selectedConversation.id);
        }
      }, 3000);
    }
  }

  // ============================================
  // GESTION DES NOTIFICATIONS
  // ============================================

  handleNewMessage(notification: ChatNotification) {
    if (!notification.message) return;

    const msgData = notification.message;
    const message: Message = {
      id: msgData.id,
      senderId: msgData.senderId,
      senderName: msgData.senderName,
      senderAvatar: msgData.senderAvatar,
      content: msgData.content,
      timestamp: new Date(msgData.createdAt || msgData.timestamp || Date.now()),
      isRead: false,
      type: msgData.type,
      conversationId: notification.conversationId
    };

    if (this.selectedConversation?.id === notification.conversationId) {
      this.messages.push(message);
      setTimeout(() => this.scrollToBottom(), 100);
      this.chatService.markAsRead(notification.conversationId).subscribe();
    } else {
      const conversation = this.conversations.find(c => c.id === notification.conversationId);
      if (conversation) {
        conversation.unreadCount++;
        conversation.lastMessage = message.content;
        conversation.lastMessageTime = message.timestamp;
      }
    }
  }

  handleTypingNotification(notification: ChatNotification) {
    if (!this.selectedConversation || notification.conversationId !== this.selectedConversation.id) {
      return;
    }

    if (!this.typingUsers.has(notification.conversationId)) {
      this.typingUsers.set(notification.conversationId, []);
    }

    const users = this.typingUsers.get(notification.conversationId)!;

    if (notification.type === 'USER_TYPING' && notification.username) {
      if (!users.includes(notification.username)) {
        users.push(notification.username);
      }
    } else if (notification.type === 'USER_STOP_TYPING' && notification.username) {
      const index = users.indexOf(notification.username);
      if (index > -1) {
        users.splice(index, 1);
      }
    }
  }

  handleUserStatusChange(notification: ChatNotification) {
    this.conversations.forEach(conv => {
      if (!conv.isGroup && conv.participants) {
        const participant = conv.participants.find(p => p.username === notification.username);
        if (participant) {
          conv.isOnline = notification.type === 'USER_ONLINE';
        }
      }
    });
  }

  getTypingIndicator(conversationId: number): string {
    const users = this.typingUsers.get(conversationId) || [];
    if (users.length === 0) return '';
    if (users.length === 1) return `${users[0]} est en train d'écrire...`;
    return `${users.length} personnes sont en train d'écrire...`;
  }

  // ============================================
  // UTILITAIRES
  // ============================================

  formatTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes}min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;

    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  }

  getConversationColor(name: string): string {
    const colors = ['blue', 'purple', 'green', 'orange', 'pink', 'indigo'];
    const index = name.length % colors.length;
    return colors[index];
  }

  scrollToBottom(): void {
    try {
      if (this.messageContainer) {
        this.messageContainer.nativeElement.scrollTop =
          this.messageContainer.nativeElement.scrollHeight;
      }
    } catch (err) {
      console.error('Erreur lors du scroll:', err);
    }
  }
}
