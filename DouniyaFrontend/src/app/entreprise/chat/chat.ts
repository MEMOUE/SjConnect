import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import { MultiSelectModule } from 'primeng/multiselect';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ChatService } from '../../services/chat/chat.service';
import { EmployeService } from '../../services/auth/employe.service';
import { AuthService } from '../../services/auth/auth.service';
import { TranslationService, Language } from '../../services/translation/translation.service';
import { Conversation, Message, ChatNotification } from '../../models/chat.model';
import { Subscription, forkJoin } from 'rxjs';
import { EmployeSimple } from '../../models/auth.model';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    MultiSelectModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './chat.html',
  styleUrl: './chat.css'
})
export class Chat implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messageContainer') private messageContainer!: ElementRef;
  @ViewChild('fileInput') private fileInput!: ElementRef;

  // ── État principal ────────────────────────────────────────────────────────
  conversations: Conversation[] = [];
  filteredConversations: Conversation[] = [];
  selectedConversation: Conversation | null = null;
  messages: Message[] = [];

  newMessage = '';
  searchTerm = '';

  isLoading = false;
  isConnected = false;
  private shouldScrollToBottom = false;

  // Deep-link depuis marketplace
  private targetConversationId: number | null = null;

  // ── Dialog nouvelle conversation ──────────────────────────────────────────
  showNewConversationDialog = false;
  isGroupConversation = false;
  groupName = '';
  selectedParticipants: EmployeSimple[] = [];
  availableEmployes: EmployeSimple[] = [];
  isLoadingEmployes = false;
  isCreatingConversation = false;

  // ── Fichiers & emojis ─────────────────────────────────────────────────────
  selectedFile: File | null = null;
  isUploadingFile = false;
  showEmojiPicker = false;
  isSendingMessage = false;

  popularEmojis = [
    '😀', '😃', '😄', '😁', '😅', '🤣', '😂', '🙂',
    '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😋',
    '😛', '😜', '🤪', '😎', '🥳', '😴', '🤔', '🤗',
    '👍', '👎', '👌', '✌️', '🤞', '🤝', '👏', '🙌',
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
    '✅', '❌', '⭐', '🔥', '💯', '🎉', '🎊', '🎈',
    '📎', '📁', '📊', '📈', '💡', '🔔', '📱', '💻'
  ];

  // ── Indicateur de frappe ──────────────────────────────────────────────────
  typingUsers: Map<number, string[]> = new Map();
  private typingTimeout: ReturnType<typeof setTimeout> | null = null;

  // ── Utilisateur courant ───────────────────────────────────────────────────
  currentUserId: number = 0;

  // ── Traduction ────────────────────────────────────────────────────────────
  selectedLanguageCode = 'original';
  showLanguageSelector = false;
  translatedContents: Map<number, string> = new Map();
  translatingMessages: Set<number> = new Set();
  showOriginalFor: Set<number> = new Set();

  get availableLanguages(): Language[] {
    return this.translationService.languages;
  }

  get currentLanguage(): Language {
    return this.translationService.getLanguageByCode(this.selectedLanguageCode)
      ?? this.availableLanguages[0];
  }

  get isTranslationActive(): boolean {
    return this.selectedLanguageCode !== 'original';
  }

  private subscriptions: Subscription[] = [];

  constructor(
    private chatService: ChatService,
    private employeService: EmployeService,
    private authService: AuthService,
    private messageService: MessageService,
    private route: ActivatedRoute,
    public translationService: TranslationService
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUserValue();
    if (currentUser) {
      this.currentUserId = currentUser.id;
    }

    const sub = this.route.queryParams.subscribe(params => {
      if (params['conversationId']) {
        this.targetConversationId = +params['conversationId'];
      }
    });
    this.subscriptions.push(sub);

    this.loadConversations();
    this.connectToWebSocket();
    this.setupWebSocketListeners();
    this.loadEmployes();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.chatService.disconnect();
    if (this.typingTimeout) clearTimeout(this.typingTimeout);
  }

  // ── Chargement des données ────────────────────────────────────────────────

  loadConversations(): void {
    this.isLoading = true;
    const sub = this.chatService.getConversations().subscribe({
      next: (page) => {
        this.conversations = page.content.map((conv: any) => ({
          id: conv.id,
          name: conv.name,
          avatar: conv.avatar || this.getInitials(conv.name),
          lastMessage: conv.lastMessage?.content || '',
          lastMessageTime: conv.lastMessage?.createdAt
            ? new Date(conv.lastMessage.createdAt)
            : new Date(conv.updatedAt || Date.now()),
          unreadCount: conv.unreadCount || 0,
          isOnline: conv.isOnline || false,
          isGroup: conv.isGroup,
          participants: conv.participants || []
        }));
        this.filteredConversations = [...this.conversations];
        this.isLoading = false;

        if (this.targetConversationId) {
          const target = this.conversations.find(c => c.id === this.targetConversationId);
          if (target) {
            this.selectConversation(target);
          } else if (this.conversations.length > 0) {
            this.selectConversation(this.conversations[0]);
          }
          this.targetConversationId = null;
        } else if (this.conversations.length > 0 && !this.selectedConversation) {
          this.selectConversation(this.conversations[0]);
        }
      },
      error: (error) => {
        console.error('Erreur chargement conversations:', error);
        this.isLoading = false;
        this.showToast('error', 'Erreur', error.error?.message || 'Impossible de charger les conversations');
      }
    });
    this.subscriptions.push(sub);
  }

  loadEmployes(): void {
    if (this.availableEmployes.length > 0) return;
    this.isLoadingEmployes = true;
    const sub = this.employeService.getAllEmployesForChat().subscribe({
      next: (employes) => {
        this.availableEmployes = employes.filter(e => e.id !== this.currentUserId);
        this.isLoadingEmployes = false;
      },
      error: (error) => {
        console.error('Erreur chargement employés:', error);
        this.isLoadingEmployes = false;
      }
    });
    this.subscriptions.push(sub);
  }

  loadMessages(conversationId: number): void {
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
          type: (msg.type || 'TEXT').toUpperCase(),
          fileUrl: msg.fileUrl,
          fileName: msg.fileName,
          conversationId: conversationId
        })).reverse();

        this.chatService.markAsRead(conversationId).subscribe();
        this.shouldScrollToBottom = true;

        if (this.isTranslationActive) {
          this.translateAllMessages();
        }
      },
      error: (error) => {
        console.error('Erreur chargement messages:', error);
        this.showToast('error', 'Erreur', error.error?.message || 'Impossible de charger les messages');
      }
    });
    this.subscriptions.push(sub);
  }

  // ── WebSocket ─────────────────────────────────────────────────────────────

  connectToWebSocket(): void {
    this.chatService.connect();
    const sub = this.chatService.isConnected$.subscribe(connected => {
      this.isConnected = connected;
    });
    this.subscriptions.push(sub);
  }

  setupWebSocketListeners(): void {
    const msgSub = this.chatService.onMessageReceived$.subscribe({
      next: (notification: ChatNotification) => this.handleNewMessage(notification)
    });
    this.subscriptions.push(msgSub);

    const typingSub = this.chatService.onTypingNotification$.subscribe({
      next: (notification: ChatNotification) => this.handleTypingNotification(notification)
    });
    this.subscriptions.push(typingSub);

    const statusSub = this.chatService.onUserStatusChange$.subscribe({
      next: (notification: ChatNotification) => this.handleUserStatusChange(notification)
    });
    this.subscriptions.push(statusSub);
  }

  // ── Gestion des conversations ─────────────────────────────────────────────

  selectConversation(conversation: Conversation): void {
    this.selectedConversation = conversation;
    conversation.unreadCount = 0;
    this.messages = [];
    this.translatedContents.clear();
    this.showOriginalFor.clear();
    this.loadMessages(conversation.id);
    this.chatService.subscribeToConversation(conversation.id);
    this.showEmojiPicker = false;
    this.showLanguageSelector = false;
  }

  searchConversations(): void {
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      this.filteredConversations = this.conversations.filter(conv =>
        conv.name.toLowerCase().includes(term)
      );
    } else {
      this.filteredConversations = [...this.conversations];
    }
  }

  openNewConversationDialog(): void {
    this.showNewConversationDialog = true;
    this.isGroupConversation = false;
    this.groupName = '';
    this.selectedParticipants = [];
    if (this.availableEmployes.length === 0) {
      this.loadEmployes();
    }
  }

  createConversation(): void {
    if (this.selectedParticipants.length === 0 || this.isCreatingConversation) return;

    let conversationName: string;
    if (this.isGroupConversation && this.groupName.trim()) {
      conversationName = this.groupName.trim();
    } else if (this.selectedParticipants.length === 1) {
      conversationName = this.selectedParticipants[0].name;
    } else {
      conversationName = this.selectedParticipants.map(p => p.name.split(' ')[0]).join(', ');
    }

    const participantIds = this.selectedParticipants.map(p => p.id);
    this.isCreatingConversation = true;

    const sub = this.chatService.createConversation(
      participantIds,
      this.isGroupConversation,
      conversationName
    ).subscribe({
      next: (response) => {
        this.showNewConversationDialog = false;
        this.isGroupConversation = false;
        this.groupName = '';
        this.selectedParticipants = [];
        this.isCreatingConversation = false;
        this.loadConversations();
        this.showToast('success', 'Succès', response.message || 'Conversation créée avec succès');
      },
      error: (error) => {
        console.error('Erreur création conversation:', error);
        this.isCreatingConversation = false;
        this.showToast('error', 'Erreur', error.error?.message || 'Impossible de créer la conversation');
      }
    });
    this.subscriptions.push(sub);
  }

  // ── Gestion des messages ──────────────────────────────────────────────────

  sendMessage(): void {
    if ((!this.newMessage.trim() && !this.selectedFile) || !this.selectedConversation || this.isSendingMessage) return;

    if (this.typingTimeout) clearTimeout(this.typingTimeout);
    this.chatService.sendStopTypingNotification(this.selectedConversation.id);

    if (this.selectedFile) {
      this.sendFileMessage();
    } else {
      this.sendTextMessage(this.newMessage.trim());
    }
  }

  private sendTextMessage(content: string): void {
    if (!this.selectedConversation) return;
    this.newMessage = '';
    this.isSendingMessage = true;

    const sub = this.chatService.sendMessage(
      this.selectedConversation.id, content, 'TEXT'
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
          type: 'TEXT',
          conversationId: this.selectedConversation!.id
        };
        this.messages.push(message);
        if (this.isTranslationActive) {
          this.translateSingleMessage(message);
        }
        this.updateConversationLastMessage(content);
        this.shouldScrollToBottom = true;
        this.isSendingMessage = false;
      },
      error: (error) => {
        console.error('Erreur envoi message:', error);
        this.newMessage = content;
        this.isSendingMessage = false;
        this.showToast('error', 'Erreur', error.error?.message || 'Impossible d\'envoyer le message');
      }
    });
    this.subscriptions.push(sub);
  }

  private sendFileMessage(): void {
    if (!this.selectedFile || !this.selectedConversation) return;
    const file = this.selectedFile;
    const caption = this.newMessage.trim();
    const conversationId = this.selectedConversation.id;

    this.isUploadingFile = true;
    this.isSendingMessage = true;

    const uploadSub = this.chatService.uploadFile(file).subscribe({
      next: (uploadResponse) => {
        const fileData = uploadResponse.data;
        const isImage = file.type.startsWith('image/');
        const msgType = isImage ? 'IMAGE' : 'FILE';

        const msgSub = this.chatService.sendMessage(
          conversationId, caption || file.name, msgType,
          fileData.fileUrl, fileData.filename
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
              type: msgType,
              fileUrl: msgData.fileUrl || fileData.fileUrl,
              fileName: msgData.fileName || fileData.filename,
              conversationId: conversationId
            };
            this.messages.push(message);
            this.updateConversationLastMessage(`📎 ${file.name}`);
            this.shouldScrollToBottom = true;
            this.removeSelectedFile();
            this.isUploadingFile = false;
            this.isSendingMessage = false;
          },
          error: (error) => {
            console.error('Erreur envoi fichier:', error);
            this.isUploadingFile = false;
            this.isSendingMessage = false;
            this.showToast('error', 'Erreur', error.error?.message || 'Impossible d\'envoyer le fichier');
          }
        });
        this.subscriptions.push(msgSub);
      },
      error: (error) => {
        console.error('Erreur upload fichier:', error);
        this.isUploadingFile = false;
        this.isSendingMessage = false;
        this.showToast('error', 'Erreur', error.error?.message || 'Impossible d\'uploader le fichier');
      }
    });
    this.subscriptions.push(uploadSub);
  }

  private updateConversationLastMessage(content: string): void {
    if (this.selectedConversation) {
      this.selectedConversation.lastMessage = content;
      this.selectedConversation.lastMessageTime = new Date();
      const idx = this.conversations.findIndex(c => c.id === this.selectedConversation!.id);
      if (idx > 0) {
        const conv = this.conversations.splice(idx, 1)[0];
        this.conversations.unshift(conv);
        this.filteredConversations = [...this.conversations];
      }
    }
  }

  onTyping(): void {
    if (!this.selectedConversation || !this.newMessage.trim()) return;
    this.chatService.sendTypingNotification(this.selectedConversation.id);
    if (this.typingTimeout) clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => {
      if (this.selectedConversation) {
        this.chatService.sendStopTypingNotification(this.selectedConversation.id);
      }
    }, 3000);
  }

  onEnterKey(event: Event): void {
    const keyEvent = event as KeyboardEvent;
    if (!keyEvent.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  // ── Fichiers & emojis ─────────────────────────────────────────────────────

  openFileSelector(): void { this.fileInput?.nativeElement.click(); }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      this.showToast('warn', 'Fichier trop volumineux', 'Taille maximale : 10 MB');
      return;
    }

    this.selectedFile = file;
    input.value = '';
  }

  removeSelectedFile(): void {
    this.selectedFile = null;
    if (this.fileInput) this.fileInput.nativeElement.value = '';
  }

  toggleEmojiPicker(): void {
    this.showEmojiPicker = !this.showEmojiPicker;
    if (this.showEmojiPicker) this.showLanguageSelector = false;
  }

  addEmoji(emoji: string): void {
    this.newMessage += emoji;
    this.showEmojiPicker = false;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
  }

  getFileIcon(fileName: string): string {
    if (!fileName) return 'pi-file';
    const ext = fileName.split('.').pop()?.toLowerCase();
    const iconMap: Record<string, string> = {
      pdf: 'pi-file-pdf', doc: 'pi-file-word', docx: 'pi-file-word',
      xls: 'pi-file-excel', xlsx: 'pi-file-excel',
      zip: 'pi-file-import', rar: 'pi-file-import',
      mp4: 'pi-video', avi: 'pi-video', mov: 'pi-video',
      mp3: 'pi-volume-up', wav: 'pi-volume-up',
    };
    return iconMap[ext || ''] || 'pi-file';
  }

  // ── Traduction ────────────────────────────────────────────────────────────

  toggleLanguageSelector(): void {
    this.showLanguageSelector = !this.showLanguageSelector;
    if (this.showLanguageSelector) this.showEmojiPicker = false;
  }

  selectLanguage(langCode: string): void {
    this.selectedLanguageCode = langCode;
    this.showLanguageSelector = false;

    if (langCode === 'original') {
      this.translatedContents.clear();
      this.showOriginalFor.clear();
    } else {
      this.translateAllMessages();
    }
  }

  translateAllMessages(): void {
    const textMessages = this.messages.filter(
      m => m.type === 'TEXT' && m.content?.trim()
    );

    textMessages.forEach(msg => {
      if (!this.translatedContents.has(msg.id)) {
        this.translateSingleMessage(msg);
      }
    });
  }

  translateSingleMessage(message: Message): void {
    if (!message.content?.trim() || message.type !== 'TEXT') return;

    this.translatingMessages.add(message.id);

    const sub = this.translationService
      .translate(message.content, this.selectedLanguageCode)
      .subscribe({
        next: (translated) => {
          this.translatedContents.set(message.id, translated);
          this.translatingMessages.delete(message.id);
        },
        error: () => {
          this.translatingMessages.delete(message.id);
        }
      });

    this.subscriptions.push(sub);
  }

  getMessageContent(message: Message): string {
    if (!this.isTranslationActive || message.type !== 'TEXT') {
      return message.content;
    }
    if (this.showOriginalFor.has(message.id)) {
      return message.content;
    }
    return this.translatedContents.get(message.id) ?? message.content;
  }

  isTranslating(messageId: number): boolean {
    return this.translatingMessages.has(messageId);
  }

  isTranslated(messageId: number): boolean {
    return this.isTranslationActive && this.translatedContents.has(messageId);
  }

  toggleOriginal(messageId: number): void {
    if (this.showOriginalFor.has(messageId)) {
      this.showOriginalFor.delete(messageId);
    } else {
      this.showOriginalFor.add(messageId);
    }
  }

  isShowingOriginal(messageId: number): boolean {
    return this.showOriginalFor.has(messageId);
  }

  // ── Notifications WebSocket ───────────────────────────────────────────────

  handleNewMessage(notification: ChatNotification): void {
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
      type: (msgData.type || 'TEXT').toUpperCase(),
      conversationId: notification.conversationId
    };

    if (this.selectedConversation?.id === notification.conversationId) {
      if (!this.messages.find(m => m.id === message.id)) {
        this.messages.push(message);
        if (this.isTranslationActive && message.type === 'TEXT') {
          this.translateSingleMessage(message);
        }
        this.shouldScrollToBottom = true;
      }
      this.chatService.markAsRead(notification.conversationId).subscribe();
    } else {
      const conversation = this.conversations.find(c => c.id === notification.conversationId);
      if (conversation) {
        conversation.unreadCount++;
        conversation.lastMessage = message.content;
        conversation.lastMessageTime = message.timestamp;
        const idx = this.conversations.indexOf(conversation);
        if (idx > 0) {
          this.conversations.splice(idx, 1);
          this.conversations.unshift(conversation);
          this.filteredConversations = [...this.conversations];
        }
      }
    }
  }

  handleTypingNotification(notification: ChatNotification): void {
    if (!this.selectedConversation || notification.conversationId !== this.selectedConversation.id) return;

    if (!this.typingUsers.has(notification.conversationId)) {
      this.typingUsers.set(notification.conversationId, []);
    }
    const users = this.typingUsers.get(notification.conversationId)!;

    if (notification.type === 'USER_TYPING' && notification.username) {
      if (!users.includes(notification.username)) users.push(notification.username);
    } else if (notification.type === 'USER_STOP_TYPING' && notification.username) {
      const idx = users.indexOf(notification.username);
      if (idx > -1) users.splice(idx, 1);
    }
  }

  handleUserStatusChange(notification: ChatNotification): void {
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
    if (users.length === 1) return `${users[0]} écrit...`;
    return `${users.length} personnes écrivent...`;
  }

  // ── Utilitaires ───────────────────────────────────────────────────────────

  formatTime(date: Date | string | null | undefined): string {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '';
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `${minutes}min`;
    if (hours < 24) return `${hours}h`;
    if (days === 1) return 'Hier';
    if (days < 7) return `${days}j`;
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  }

  formatMessageTime(date: Date | string | null | undefined): string {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  getConversationColor(name: string): string {
    const colors = ['blue', 'violet', 'emerald', 'orange', 'rose', 'indigo', 'teal', 'amber'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  getAvatarClass(name: string): string {
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-500', violet: 'bg-violet-500', emerald: 'bg-emerald-500',
      orange: 'bg-orange-500', rose: 'bg-rose-500', indigo: 'bg-indigo-500',
      teal: 'bg-teal-500', amber: 'bg-amber-500'
    };
    return colorMap[this.getConversationColor(name)] || 'bg-blue-500';
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(' ').filter(p => p.length > 0);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  }

  scrollToBottom(): void {
    try {
      if (this.messageContainer) {
        const el = this.messageContainer.nativeElement;
        el.scrollTop = el.scrollHeight;
      }
    } catch (err) { /* ignore */ }
  }

  trackConversation(_index: number, conv: Conversation): number { return conv.id; }
  trackMessage(_index: number, msg: Message): number { return msg.id; }

  private showToast(severity: string, summary: string, detail: string): void {
    this.messageService.add({ severity, summary, detail, life: 3000 });
  }

  get canSend(): boolean {
    return (!!this.newMessage.trim() || !!this.selectedFile) && !this.isSendingMessage && !this.isUploadingFile;
  }

  get isGroupValid(): boolean {
    if (this.selectedParticipants.length === 0) return false;
    if (this.isGroupConversation && this.selectedParticipants.length > 1 && !this.groupName.trim()) return false;
    return true;
  }
}
