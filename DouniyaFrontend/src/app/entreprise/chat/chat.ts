import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {ChatService} from '../../services/chat/chat.service';
import { Conversation, Message, ChatNotification } from '../../models/chat.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  // Indicateur de frappe
  typingUsers: Map<number, string[]> = new Map();
  typingTimeout: any;

  private subscriptions: Subscription[] = [];

  constructor(private chatService: ChatService) {}

  ngOnInit() {
    this.loadConversations();
    this.connectToWebSocket();
    this.setupWebSocketListeners();
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
      next: (response) => {
        this.conversations = response.content.map((conv: any) => ({
          id: conv.id,
          name: conv.name,
          avatar: conv.avatar,
          lastMessage: conv.lastMessage?.content || '',
          lastMessageTime: conv.lastMessage?.createdAt ? new Date(conv.lastMessage.createdAt) : new Date(),
          unreadCount: conv.unreadCount,
          isOnline: conv.isOnline,
          isGroup: conv.isGroup,
          participants: conv.participants
        }));
        this.filteredConversations = [...this.conversations];
        this.isLoading = false;

        // Sélectionner la première conversation par défaut
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

  loadMessages(conversationId: number) {
    const sub = this.chatService.getMessages(conversationId).subscribe({
      next: (response) => {
        this.messages = response.content.map((msg: any) => ({
          id: msg.id,
          senderId: msg.senderId,
          senderName: msg.senderName,
          senderAvatar: msg.senderAvatar,
          content: msg.content,
          timestamp: new Date(msg.createdAt || msg.timestamp || Date.now()),
          isRead: msg.isRead,
          type: msg.type.toLowerCase(),
          fileUrl: msg.fileUrl,
          fileName: msg.fileName,
          conversationId: msg.conversationId
        })).reverse(); // Inverser pour avoir les plus récents en bas

        // Marquer comme lus
        this.chatService.markAsRead(conversationId).subscribe();

        // Scroll vers le bas
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
    // Nouveau message reçu
    const msgSub = this.chatService.onMessageReceived$.subscribe({
      next: (notification: ChatNotification) => {
        this.handleNewMessage(notification);
      }
    });
    this.subscriptions.push(msgSub);

    // Notification de frappe
    const typingSub = this.chatService.onTypingNotification$.subscribe({
      next: (notification: ChatNotification) => {
        this.handleTypingNotification(notification);
      }
    });
    this.subscriptions.push(typingSub);

    // Changement de statut utilisateur
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

    // Charger les messages
    this.loadMessages(conversation.id);

    // S'abonner aux notifications de cette conversation
    this.chatService.subscribeToConversation(conversation.id);
  }

  searchConversations() {
    if (this.searchTerm.trim()) {
      this.filteredConversations = this.conversations.filter(conv =>
        conv.name.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    } else {
      this.filteredConversations = [...this.conversations];
    }
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

    // Arrêter l'indicateur de frappe
    this.chatService.sendStopTypingNotification(this.selectedConversation.id);

    const sub = this.chatService.sendMessage(
      this.selectedConversation.id,
      content
    ).subscribe({
      next: (response) => {
        const message: Message = {
          id: response.data["id"],
          senderId: response.data["senderId"],
          senderName: response.data["senderName"],
          senderAvatar: response.data["senderAvatar"],
          content: response.data["content"],
          timestamp: new Date(response.data["createdAt"] || response.data["timestamp"] || Date.now()),
          isRead: false,
          type: 'text',
          conversationId: response.data["conversationId"]
        };

        this.messages.push(message);

        // Mettre à jour la conversation
        if (this.selectedConversation) {
          this.selectedConversation.lastMessage = content;
          this.selectedConversation.lastMessageTime = new Date();
        }

        setTimeout(() => this.scrollToBottom(), 100);
      },
      error: (error) => {
        console.error('Erreur lors de l\'envoi du message:', error);
        this.newMessage = content; // Restaurer le message
      }
    });
    this.subscriptions.push(sub);
  }

  onTyping() {
    if (this.selectedConversation && this.newMessage.trim()) {
      this.chatService.sendTypingNotification(this.selectedConversation.id);

      // Arrêter automatiquement après 3 secondes d'inactivité
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

    const message: Message = {
      id: notification.message.id,
      senderId: notification.message.senderId,
      senderName: notification.message.senderName,
      senderAvatar: notification.message.senderAvatar,
      content: notification.message.content,
      timestamp: new Date(notification.message.timestamp || Date.now()),
      isRead: false,
      type: notification.message.type,
      conversationId: notification.message.conversationId
    };

    // Si c'est la conversation active, ajouter le message
    if (this.selectedConversation?.id === notification.conversationId) {
      this.messages.push(message);
      setTimeout(() => this.scrollToBottom(), 100);

      // Marquer comme lu
      this.chatService.markAsRead(notification.conversationId).subscribe();
    } else {
      // Sinon, incrémenter le compteur de messages non lus
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
    // Mettre à jour le statut en ligne des conversations
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
