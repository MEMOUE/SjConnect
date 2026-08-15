import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import { MultiSelectModule } from 'primeng/multiselect';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ChatService } from '../../services/chat/chat.service';
import { EmployeService } from '../../services/auth/employe.service';
import { AuthService } from '../../services/auth/auth.service';
import { TranslationService, Language } from '../../services/translation/translation.service';
import { NotificationCenterService } from '../../services/notification-center/notification-center.service';
import { Conversation, Message, ChatNotification, Participant } from '../../models/chat.model';
import { Subscription } from 'rxjs';
import { EmployeSimple } from '../../models/auth.model';
import { environment } from '../../../environments/environment';

declare var JitsiMeetExternalAPI: any;

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    MultiSelectModule,
    ToastModule,
    ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './chat.html',
  styleUrl: './chat.css'
})
export class Chat implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messageContainer') private messageContainer!: ElementRef;
  @ViewChild('fileInput') private fileInput!: ElementRef;
  @ViewChild('chatJitsiContainer') private chatJitsiContainer!: ElementRef<HTMLDivElement>;

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

  private targetConversationId: number | null = null;

  // ── Polling ───────────────────────────────────────────────────────────────
  private pollingTimer: ReturnType<typeof setInterval> | null = null;
  private readonly POLL_INTERVAL = 3000; // 3 secondes
  private isPollingMessages = false;
  private isPollingConversations = false;

  // ── Dialog nouvelle conversation ──────────────────────────────────────────
  showNewConversationDialog = false;
  isGroupConversation = false;
  groupName = '';
  selectedParticipants: EmployeSimple[] = [];
  availableEmployes: EmployeSimple[] = [];
  isLoadingEmployes = false;
  isCreatingConversation = false;

  // ── Recherche d'utilisateur par email ─────────────────────────────────────
  emailSearchQuery = '';
  isSearchingUserByEmail = false;
  emailSearchResult: { id: number; nom: string; email: string } | null = null;
  emailSearchError = '';
  isStartingConversationFromEmail = false;

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
  skippedTranslation: Set<number> = new Set();

  // ── Menu contextuel ───────────────────────────────────────────────────────
  contextMenuVisible = false;
  contextMenuX = 0;
  contextMenuY = 0;
  contextMenuMessage: Message | null = null;

  // ── Édition de message ────────────────────────────────────────────────────
  editingMessage: Message | null = null;
  editMessageContent = '';

  // ── Panneau membres ───────────────────────────────────────────────────────
  showMembersPanel = false;

  // ── Dialog gestion groupe ─────────────────────────────────────────────────
  showEditGroupDialog = false;
  editGroupName = '';
  showAddMembersDialog = false;
  addMembersSelectedParticipants: EmployeSimple[] = [];
  existingParticipantIds: Set<number> = new Set();

  // ── Appel / visioconférence (Jitsi) ───────────────────────────────────────
  showCallOverlay = false;
  callType: 'audio' | 'video' = 'video';
  private jitsiApi: any = null;
  private jitsiLoaded = false;
  private jitsiScriptAttentAttempts = 0;
  private jitsiScriptLoadAttempts = 0;
  private jitsiJoinTimeoutId: any = null;
  jitsiPret = false;
  jitsiErreur: string | null = null;
  microActif = true;
  cameraActive = true;
  partageEcran = false;
  callParticipantsCount = 0;
  callLienCopie = false;
  showInviteCallPanel = false;
  inviteCallEmail = '';
  isInvitingToCall = false;

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
    private confirmationService: ConfirmationService,
    private route: ActivatedRoute,
    private router: Router,
    public translationService: TranslationService,
    private notificationCenter: NotificationCenterService
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
    this.chargerJitsiScript();

    // Démarrer le polling automatique
    this.startPolling();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy(): void {
    this.stopPolling();
    this.subscriptions.forEach(sub => sub.unsubscribe());
    // La connexion WebSocket reste active (gérée par NotificationCenterService)
    // pour continuer à recevoir messages/appels en dehors de la page chat.
    this.notificationCenter.setActiveConversationId(null);
    if (this.typingTimeout) clearTimeout(this.typingTimeout);
    this.detruireJitsiChat();
  }

  // ── POLLING AUTOMATIQUE ───────────────────────────────────────────────────

  private startPolling(): void {
    this.stopPolling();
    this.pollingTimer = setInterval(() => {
      this.pollMessages();
      this.pollConversationList();
    }, this.POLL_INTERVAL);
  }

  private stopPolling(): void {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
  }

  /**
   * Récupère les messages récents de la conversation active
   * et fusionne intelligemment (ajout, édition, suppression)
   */
  private pollMessages(): void {
    if (!this.selectedConversation || this.isPollingMessages || this.isSendingMessage || this.isUploadingFile) return;

    const conversationId = this.selectedConversation.id;
    this.isPollingMessages = true;

    this.chatService.getMessages(conversationId, 0, 50).subscribe({
      next: (page) => {
        this.isPollingMessages = false;
        if (this.selectedConversation?.id !== conversationId) return;

        const freshMessages: Message[] = page.content.map((msg: any) => ({
          id: msg.id,
          senderId: msg.senderId,
          senderName: msg.senderName,
          senderAvatar: msg.senderAvatar,
          content: msg.content,
          timestamp: new Date(msg.createdAt || Date.now()),
          isRead: msg.isRead,
          isEdited: msg.isEdited || false,
          type: (msg.type || 'TEXT').toUpperCase(),
          fileUrl: msg.fileUrl,
          fileName: msg.fileName,
          conversationId: conversationId,
          parentMessageId: msg.parentMessageId,
          parentMessageContent: msg.parentMessageContent
        })).reverse();

        this.mergeMessages(freshMessages);
      },
      error: () => {
        this.isPollingMessages = false;
      }
    });
  }

  /**
   * Fusionne les messages frais avec les messages locaux :
   * - Ajoute les nouveaux
   * - Met à jour le contenu des édités
   * - Retire les supprimés
   */
  private mergeMessages(freshMessages: Message[]): void {
    const existingIds = new Set(this.messages.map(m => m.id));
    const freshIds = new Set(freshMessages.map(m => m.id));
    let hasNewMessages = false;

    // 1) Ajouter les nouveaux messages
    for (const msg of freshMessages) {
      if (!existingIds.has(msg.id)) {
        this.messages.push(msg);
        hasNewMessages = true;

        // Traduire le nouveau message si traduction active
        if (this.isTranslationActive && msg.type === 'TEXT') {
          this.translateSingleMessage(msg);
        }
      }
    }

    // 2) Mettre à jour les messages édités
    for (const msg of freshMessages) {
      const existing = this.messages.find(m => m.id === msg.id);
      if (existing && (existing.content !== msg.content || existing.isEdited !== msg.isEdited)) {
        existing.content = msg.content;
        existing.isEdited = msg.isEdited;

        if (this.isTranslationActive && existing.type === 'TEXT') {
          this.translatedContents.delete(existing.id);
          this.skippedTranslation.delete(existing.id);
          this.translateSingleMessage(existing);
        }
      }
    }

    // 3) Retirer les messages supprimés côté serveur
    const beforeCount = this.messages.length;
    this.messages = this.messages.filter(m => freshIds.has(m.id));
    if (this.messages.length !== beforeCount) {
      // Nettoyer les traductions des messages supprimés
      for (const id of [...this.translatedContents.keys()]) {
        if (!freshIds.has(id)) {
          this.translatedContents.delete(id);
          this.skippedTranslation.delete(id);
        }
      }
    }

    // 4) Scroll si nouveaux messages
    if (hasNewMessages) {
      this.shouldScrollToBottom = true;
    }
  }

  /**
   * Met à jour la sidebar : unreadCount, lastMessage, ordre
   */
  private pollConversationList(): void {
    if (this.isPollingConversations) return;
    this.isPollingConversations = true;

    this.chatService.getConversations().subscribe({
      next: (page) => {
        this.isPollingConversations = false;

        const freshConversations: Conversation[] = page.content.map((conv: any) => ({
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

        // Mettre à jour sans perdre la sélection
        for (const fresh of freshConversations) {
          const existing = this.conversations.find(c => c.id === fresh.id);
          if (existing) {
            // Ne pas écraser unreadCount si c'est la conversation sélectionnée
            if (this.selectedConversation?.id !== fresh.id) {
              existing.unreadCount = fresh.unreadCount;
            }
            existing.lastMessage = fresh.lastMessage;
            existing.lastMessageTime = fresh.lastMessageTime;
            existing.isOnline = fresh.isOnline;
            existing.participants = fresh.participants;
          } else {
            // Nouvelle conversation apparue
            this.conversations.push(fresh);
          }
        }

        // Retirer les conversations supprimées
        const freshIds = new Set(freshConversations.map(c => c.id));
        this.conversations = this.conversations.filter(c => freshIds.has(c.id));

        // Trier par lastMessageTime desc
        this.conversations.sort((a, b) => {
          const ta = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
          const tb = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
          return tb - ta;
        });

        this.filteredConversations = this.searchTerm.trim()
          ? this.conversations.filter(c => c.name.toLowerCase().includes(this.searchTerm.toLowerCase()))
          : [...this.conversations];

        // Vérifier si la conversation sélectionnée a été supprimée
        if (this.selectedConversation && !freshIds.has(this.selectedConversation.id)) {
          this.selectedConversation = null;
          this.messages = [];
          this.showMembersPanel = false;
        }
      },
      error: () => {
        this.isPollingConversations = false;
      }
    });
  }

  // ── Fermer menus au clic extérieur ────────────────────────────────────────
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    this.contextMenuVisible = false;
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.contextMenuVisible = false;
    this.showEmojiPicker = false;
    this.showLanguageSelector = false;
    this.cancelEditMessage();
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
          isEdited: msg.isEdited || false,
          type: (msg.type || 'TEXT').toUpperCase(),
          fileUrl: msg.fileUrl,
          fileName: msg.fileName,
          conversationId: conversationId,
          parentMessageId: msg.parentMessageId,
          parentMessageContent: msg.parentMessageContent
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
      if (connected && this.selectedConversation) {
        this.chatService.subscribeToConversation(this.selectedConversation.id);
      }
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

    const editSub = this.chatService.onMessageEdited$.subscribe({
      next: (notification: ChatNotification) => this.handleMessageEdited(notification)
    });
    this.subscriptions.push(editSub);

    const deleteSub = this.chatService.onMessageDeleted$.subscribe({
      next: (notification: ChatNotification) => this.handleMessageDeleted(notification)
    });
    this.subscriptions.push(deleteSub);

    const callStartedSub = this.chatService.onCallStarted$.subscribe({
      next: (notification: ChatNotification) => this.handleCallStarted(notification)
    });
    this.subscriptions.push(callStartedSub);
  }

  handleCallStarted(notification: ChatNotification): void {
    if (this.showCallOverlay) return;

    const conversation = this.conversations.find(c => c.id === notification.conversationId);
    const callerName = conversation?.participants?.find(p => p.username === notification.username)?.name
      || notification.username
      || 'Quelqu\'un';
    const conversationName = conversation?.name || 'une conversation';

    this.messageService.add({
      severity: 'info',
      summary: 'Appel en cours',
      detail: `${callerName} a démarré un appel dans ${conversationName}`,
      sticky: true,
      data: { conversationId: notification.conversationId, callLink: notification.callLink }
    });
  }

  rejoindreAppelDepuisNotification(conversationId: number): void {
    const conversation = this.conversations.find(c => c.id === conversationId);
    if (!conversation) return;
    this.selectConversation(conversation);
    this.demarrerAppelVideo();
  }

  // ── Gestion des conversations ─────────────────────────────────────────────

  selectConversation(conversation: Conversation): void {
    this.selectedConversation = conversation;
    this.notificationCenter.setActiveConversationId(conversation.id);
    conversation.unreadCount = 0;
    this.messages = [];
    this.translatedContents.clear();
    this.showOriginalFor.clear();
    this.skippedTranslation.clear();
    this.showMembersPanel = false;
    this.editingMessage = null;
    this.contextMenuVisible = false;
    this.loadMessages(conversation.id);
    this.chatService.subscribeToConversation(conversation.id);
    this.showEmojiPicker = false;
    this.showLanguageSelector = false;

    this.existingParticipantIds = new Set(
      (conversation.participants || []).map(p => p.id)
    );
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
    this.resetEmailSearch();
    if (this.availableEmployes.length === 0) {
      this.loadEmployes();
    }
  }

  // ── Recherche d'utilisateur par email ─────────────────────────────────────

  resetEmailSearch(): void {
    this.emailSearchQuery = '';
    this.isSearchingUserByEmail = false;
    this.emailSearchResult = null;
    this.emailSearchError = '';
  }

  searchUserByEmail(): void {
    const email = this.emailSearchQuery.trim();
    if (!email || this.isSearchingUserByEmail) return;

    this.isSearchingUserByEmail = true;
    this.emailSearchResult = null;
    this.emailSearchError = '';

    const sub = this.chatService.searchUserByEmail(email).subscribe({
      next: (response) => {
        this.isSearchingUserByEmail = false;
        if (response.success && response.data) {
          this.emailSearchResult = response.data;
        } else {
          this.emailSearchError = response.message || 'Aucun utilisateur trouvé avec cet email';
        }
      },
      error: (error) => {
        this.isSearchingUserByEmail = false;
        this.emailSearchError = error.error?.message || 'Aucun utilisateur trouvé avec cet email';
      }
    });
    this.subscriptions.push(sub);
  }

  startConversationFromEmailResult(): void {
    if (!this.emailSearchResult || this.isStartingConversationFromEmail) return;
    this.isStartingConversationFromEmail = true;

    const sub = this.chatService.startPrivateConversation(this.emailSearchResult.id).subscribe({
      next: (response) => {
        this.isStartingConversationFromEmail = false;
        this.showNewConversationDialog = false;
        this.resetEmailSearch();
        this.loadConversations();
        setTimeout(() => {
          const conv = this.conversations.find(c => c.id === (response.data as any)?.id);
          if (conv) this.selectConversation(conv);
        }, 500);
        this.showToast('success', 'Succès', 'Conversation démarrée');
      },
      error: (error) => {
        this.isStartingConversationFromEmail = false;
        this.showToast('error', 'Erreur', error.error?.message || 'Impossible de démarrer la conversation');
      }
    });
    this.subscriptions.push(sub);
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

  // ── Gestion du groupe ─────────────────────────────────────────────────────

  /** Retour à la liste des conversations (vue mobile). */
  backToList(): void {
    this.selectedConversation = null;
    this.showMembersPanel = false;
    this.showEmojiPicker = false;
    this.showLanguageSelector = false;
    this.contextMenuVisible = false;
    this.editingMessage = null;
  }

  toggleMembersPanel(): void {
    this.showMembersPanel = !this.showMembersPanel;
  }

  openEditGroupDialog(): void {
    if (!this.selectedConversation?.isGroup) return;
    this.editGroupName = this.selectedConversation.name;
    this.showEditGroupDialog = true;
  }

  saveGroupName(): void {
    if (!this.selectedConversation || !this.editGroupName.trim()) return;
    const sub = this.chatService.updateConversation(
      this.selectedConversation.id,
      { name: this.editGroupName.trim() }
    ).subscribe({
      next: () => {
        this.selectedConversation!.name = this.editGroupName.trim();
        const conv = this.conversations.find(c => c.id === this.selectedConversation!.id);
        if (conv) conv.name = this.editGroupName.trim();
        this.filteredConversations = [...this.conversations];
        this.showEditGroupDialog = false;
        this.showToast('success', 'Succès', 'Nom du groupe modifié');
      },
      error: (error) => {
        this.showToast('error', 'Erreur', error.error?.message || 'Impossible de modifier le groupe');
      }
    });
    this.subscriptions.push(sub);
  }

  openAddMembersDialog(): void {
    this.addMembersSelectedParticipants = [];
    this.showAddMembersDialog = true;
    if (this.availableEmployes.length === 0) {
      this.loadEmployes();
    }
  }

  get availableEmployesForAdd(): EmployeSimple[] {
    return this.availableEmployes.filter(e => !this.existingParticipantIds.has(e.id));
  }

  addMembersToGroup(): void {
    if (!this.selectedConversation || this.addMembersSelectedParticipants.length === 0) return;
    const ids = this.addMembersSelectedParticipants.map(p => p.id);
    const sub = this.chatService.addParticipants(
      this.selectedConversation.id, ids
    ).subscribe({
      next: () => {
        this.addMembersSelectedParticipants.forEach(p => {
          this.existingParticipantIds.add(p.id);
          this.selectedConversation!.participants?.push({
            id: p.id,
            username: '',
            fullName: p.name,
            name: p.name,
            avatar: (p as any).avatar || this.getInitials(p.name),
            isOnline: false,
            role: ''
          });
        });
        this.showAddMembersDialog = false;
        this.addMembersSelectedParticipants = [];
        this.showToast('success', 'Succès', 'Participants ajoutés au groupe');
      },
      error: (error) => {
        this.showToast('error', 'Erreur', error.error?.message || 'Impossible d\'ajouter les participants');
      }
    });
    this.subscriptions.push(sub);
  }

  removeFromGroup(participant: Participant): void {
    if (!this.selectedConversation) return;
    this.confirmationService.confirm({
      message: `Retirer ${participant.name || participant.fullName} du groupe ?`,
      header: 'Confirmer',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Retirer',
      rejectLabel: 'Annuler',
      accept: () => {
        const sub = this.chatService.removeParticipant(
          this.selectedConversation!.id, participant.id
        ).subscribe({
          next: () => {
            const idx = this.selectedConversation!.participants?.findIndex(p => p.id === participant.id);
            if (idx !== undefined && idx > -1) {
              this.selectedConversation!.participants?.splice(idx, 1);
            }
            this.existingParticipantIds.delete(participant.id);
            this.showToast('success', 'Succès', 'Participant retiré du groupe');
          },
          error: (error) => {
            this.showToast('error', 'Erreur', error.error?.message || 'Impossible de retirer le participant');
          }
        });
        this.subscriptions.push(sub);
      }
    });
  }

  leaveGroup(): void {
    if (!this.selectedConversation) return;
    this.confirmationService.confirm({
      message: 'Voulez-vous vraiment quitter ce groupe ?',
      header: 'Quitter le groupe',
      icon: 'pi pi-sign-out',
      acceptLabel: 'Quitter',
      rejectLabel: 'Annuler',
      accept: () => {
        const sub = this.chatService.leaveConversation(this.selectedConversation!.id).subscribe({
          next: () => {
            this.selectedConversation = null;
            this.showMembersPanel = false;
            this.loadConversations();
            this.showToast('success', 'Succès', 'Vous avez quitté le groupe');
          },
          error: (error) => {
            this.showToast('error', 'Erreur', error.error?.message || 'Impossible de quitter le groupe');
          }
        });
        this.subscriptions.push(sub);
      }
    });
  }

  deleteGroup(): void {
    if (!this.selectedConversation) return;
    this.confirmationService.confirm({
      message: 'Supprimer définitivement cette conversation ? Tous les messages seront perdus.',
      header: 'Supprimer la conversation',
      icon: 'pi pi-trash',
      acceptLabel: 'Supprimer',
      rejectLabel: 'Annuler',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        const sub = this.chatService.deleteConversation(this.selectedConversation!.id).subscribe({
          next: () => {
            this.selectedConversation = null;
            this.showMembersPanel = false;
            this.loadConversations();
            this.showToast('success', 'Succès', 'Conversation supprimée');
          },
          error: (error) => {
            this.showToast('error', 'Erreur', error.error?.message || 'Impossible de supprimer');
          }
        });
        this.subscriptions.push(sub);
      }
    });
  }

  // ── Conversation privée depuis un membre ──────────────────────────────────

  startPrivateChat(participant: Participant): void {
    if (participant.id === this.currentUserId) return;
    const sub = this.chatService.startPrivateConversation(participant.id).subscribe({
      next: (response) => {
        this.showMembersPanel = false;
        this.loadConversations();
        setTimeout(() => {
          const conv = this.conversations.find(c => c.id === (response.data as any)?.id);
          if (conv) {
            this.selectConversation(conv);
          }
        }, 500);
        this.showToast('success', 'Succès', 'Conversation privée ouverte');
      },
      error: (error) => {
        this.showToast('error', 'Erreur', error.error?.message || 'Impossible de créer la conversation privée');
      }
    });
    this.subscriptions.push(sub);
  }

  // ── Gestion des messages ──────────────────────────────────────────────────

  sendMessage(): void {
    if ((!this.newMessage.trim() && !this.selectedFile) || !this.selectedConversation || this.isSendingMessage) return;

    if (this.typingTimeout) clearTimeout(this.typingTimeout);
    this.chatService.sendStopTypingNotification(this.selectedConversation.id);

    if (this.editingMessage) {
      this.saveEditedMessage();
      return;
    }

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
        // Ajouter seulement si pas déjà présent (évite doublon avec polling)
        if (!this.messages.find(m => m.id === message.id)) {
          this.messages.push(message);
        }
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
            if (!this.messages.find(m => m.id === message.id)) {
              this.messages.push(message);
            }
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

  // ── Menu contextuel message ───────────────────────────────────────────────

  onMessageContextMenu(event: MouseEvent, message: Message): void {
    event.preventDefault();
    event.stopPropagation();
    this.contextMenuMessage = message;
    this.contextMenuX = event.clientX;
    this.contextMenuY = event.clientY;

    const menuWidth = 180;
    const menuHeight = 160;
    if (this.contextMenuX + menuWidth > window.innerWidth) {
      this.contextMenuX = window.innerWidth - menuWidth - 10;
    }
    if (this.contextMenuY + menuHeight > window.innerHeight) {
      this.contextMenuY = window.innerHeight - menuHeight - 10;
    }

    this.contextMenuVisible = true;
  }

  copyMessageContent(): void {
    if (!this.contextMenuMessage) return;
    navigator.clipboard.writeText(this.contextMenuMessage.content).then(() => {
      this.showToast('success', 'Copié', 'Message copié dans le presse-papier');
    });
    this.contextMenuVisible = false;
  }

  startEditMessage(): void {
    if (!this.contextMenuMessage || this.contextMenuMessage.senderId !== this.currentUserId) return;
    this.editingMessage = this.contextMenuMessage;
    this.editMessageContent = this.contextMenuMessage.content;
    this.newMessage = this.contextMenuMessage.content;
    this.contextMenuVisible = false;
  }

  cancelEditMessage(): void {
    this.editingMessage = null;
    this.editMessageContent = '';
    this.newMessage = '';
  }

  saveEditedMessage(): void {
    if (!this.editingMessage || !this.newMessage.trim()) return;
    const messageId = this.editingMessage.id;
    const content = this.newMessage.trim();

    const sub = this.chatService.editMessage(messageId, content).subscribe({
      next: () => {
        const msg = this.messages.find(m => m.id === messageId);
        if (msg) {
          msg.content = content;
          msg.isEdited = true;
        }
        if (this.isTranslationActive && msg) {
          this.translatedContents.delete(messageId);
          this.skippedTranslation.delete(messageId);
          this.translateSingleMessage(msg);
        }
        this.cancelEditMessage();
        this.showToast('success', 'Succès', 'Message modifié');
      },
      error: (error) => {
        this.showToast('error', 'Erreur', error.error?.message || 'Impossible de modifier le message');
      }
    });
    this.subscriptions.push(sub);
  }

  confirmDeleteMessage(): void {
    if (!this.contextMenuMessage) return;
    this.contextMenuVisible = false;
    const messageId = this.contextMenuMessage.id;

    this.confirmationService.confirm({
      message: 'Supprimer ce message ?',
      header: 'Confirmer la suppression',
      icon: 'pi pi-trash',
      acceptLabel: 'Supprimer',
      rejectLabel: 'Annuler',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        const sub = this.chatService.deleteMessage(messageId).subscribe({
          next: () => {
            this.messages = this.messages.filter(m => m.id !== messageId);
            this.translatedContents.delete(messageId);
            this.showToast('success', 'Succès', 'Message supprimé');
          },
          error: (error) => {
            this.showToast('error', 'Erreur', error.error?.message || 'Impossible de supprimer le message');
          }
        });
        this.subscriptions.push(sub);
      }
    });
  }

  // ── Notifications WebSocket — édition/suppression ─────────────────────────

  handleMessageEdited(notification: ChatNotification): void {
    if (!notification.message) return;
    const msgData = notification.message;
    if (this.selectedConversation?.id === notification.conversationId) {
      const msg = this.messages.find(m => m.id === msgData.id);
      if (msg) {
        msg.content = msgData.content;
        msg.isEdited = true;
        if (this.isTranslationActive) {
          this.translatedContents.delete(msg.id);
          this.skippedTranslation.delete(msg.id);
          this.translateSingleMessage(msg);
        }
      }
    }
  }

  handleMessageDeleted(notification: ChatNotification): void {
    const deletedId = notification.messageId ?? notification.message?.id;
    if (this.selectedConversation?.id === notification.conversationId && deletedId) {
      this.messages = this.messages.filter(m => m.id !== deletedId);
      this.translatedContents.delete(deletedId);
      this.skippedTranslation.delete(deletedId);
    }
  }

  // ── Update conversation, typing ───────────────────────────────────────────

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
      this.skippedTranslation.clear();
    } else {
      this.translatedContents.clear();
      this.skippedTranslation.clear();
      this.translateAllMessages();
    }
  }

  translateAllMessages(): void {
    const textMessages = this.messages.filter(
      m => m.type === 'TEXT' && m.content?.trim()
    );

    textMessages.forEach(msg => {
      if (!this.translatedContents.has(msg.id) && !this.skippedTranslation.has(msg.id)) {
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
          this.translatingMessages.delete(message.id);

          const originalNormalized = message.content.trim().toLowerCase();
          const translatedNormalized = translated.trim().toLowerCase();

          if (originalNormalized === translatedNormalized) {
            this.skippedTranslation.add(message.id);
          } else {
            this.translatedContents.set(message.id, translated);
          }
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
    if (this.skippedTranslation.has(message.id)) {
      return message.content;
    }
    return this.translatedContents.get(message.id) ?? message.content;
  }

  isTranslating(messageId: number): boolean {
    return this.translatingMessages.has(messageId);
  }

  isTranslated(messageId: number): boolean {
    return this.isTranslationActive
      && this.translatedContents.has(messageId)
      && !this.skippedTranslation.has(messageId);
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
    const isOnline = notification.type === 'USER_ONLINE';

    this.conversations.forEach(conv => {
      const participant = conv.participants?.find(p => p.username === notification.username);
      if (participant) {
        participant.isOnline = isOnline;
      }
      if (!conv.isGroup && participant) {
        conv.isOnline = isOnline;
      }
    });
  }

  getTypingIndicator(conversationId: number): string {
    const users = this.typingUsers.get(conversationId) || [];
    if (users.length === 0) return '';
    if (users.length === 1) return `${users[0]} écrit...`;
    return `${users.length} personnes écrivent...`;
  }

  // ── Appel / visioconférence (Jitsi) ───────────────────────────────────────

  demarrerAppelAudio(): void { this.demarrerAppel('audio'); }
  demarrerAppelVideo(): void { this.demarrerAppel('video'); }

  private demarrerAppel(type: 'audio' | 'video'): void {
    if (!this.selectedConversation) return;
    this.callType = type;
    this.showCallOverlay = true;
    this.jitsiPret = false;
    this.jitsiErreur = null;
    this.jitsiScriptAttentAttempts = 0;
    this.microActif = true;
    this.cameraActive = type === 'video';
    this.partageEcran = false;
    this.callParticipantsCount = 1;
    this.showInviteCallPanel = false;
    this.inviteCallEmail = '';
    setTimeout(() => this.initialiserJitsiChat(this.getCallRoomName()), 300);
  }

  reessayerAppel(): void {
    if (!this.selectedConversation) return;
    this.jitsiErreur = null;
    this.jitsiScriptAttentAttempts = 0;
    if (!this.jitsiLoaded) {
      this.jitsiScriptLoadAttempts = 0;
      this.chargerJitsiScript();
    }
    this.initialiserJitsiChat(this.getCallRoomName());
  }

  private getCallRoomName(): string {
    return `DouniyaConnect-chat-${this.selectedConversation!.id}`;
  }

  private initialiserJitsiChat(roomName: string): void {
    if (!this.jitsiLoaded || !this.chatJitsiContainer?.nativeElement) {
      this.jitsiScriptAttentAttempts++;
      if (this.jitsiScriptAttentAttempts > 30) {
        this.jitsiErreur = 'Impossible de charger le module d\'appel. Vérifiez votre connexion internet et réessayez.';
        return;
      }
      setTimeout(() => this.initialiserJitsiChat(roomName), 500);
      return;
    }
    this.detruireJitsiChat();
    this.jitsiErreur = null;

    if (this.jitsiJoinTimeoutId) clearTimeout(this.jitsiJoinTimeoutId);
    this.jitsiJoinTimeoutId = setTimeout(() => {
      if (!this.jitsiPret) {
        this.jitsiErreur = 'La connexion à l\'appel prend trop de temps. Vérifiez votre réseau ou réessayez.';
      }
    }, 20000);

    const currentUser = this.authService.getCurrentUserValue();
    const displayName = currentUser?.nomEntreprise
      || (currentUser?.prenom && currentUser?.nom ? `${currentUser.prenom} ${currentUser.nom}` : currentUser?.username)
      || 'Utilisateur';

    const options = {
      roomName,
      width: '100%',
      height: '100%',
      parentNode: this.chatJitsiContainer.nativeElement,
      lang: 'fr',
      userInfo: {
        displayName,
        email: currentUser?.email ?? ''
      },
      configOverwrite: {
        startWithAudioMuted: false,
        startWithVideoMuted: this.callType === 'audio',
        disableDeepLinking: true,
        enableWelcomePage: false,
        prejoinPageEnabled: false,
        prejoinConfig: { enabled: false },
        toolbarButtons: [
          'microphone', 'camera', 'desktop', 'participants-pane',
          'chat', 'tileview', 'select-background', 'hangup'
        ]
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
        TOOLBAR_ALWAYS_VISIBLE: false
      }
    };

    try {
      this.jitsiApi = new JitsiMeetExternalAPI(environment.jitsiDomain, options);

      this.jitsiApi.addEventListener('videoConferenceJoined', () => {
        const dejaConnecte = this.jitsiPret;
        this.jitsiPret = true;
        this.jitsiErreur = null;
        this.callParticipantsCount = 1;
        if (this.jitsiJoinTimeoutId) { clearTimeout(this.jitsiJoinTimeoutId); this.jitsiJoinTimeoutId = null; }
        if (!dejaConnecte) this.notifierLancementAppel();
      });
      this.jitsiApi.addEventListener('participantJoined', () => this.callParticipantsCount++);
      this.jitsiApi.addEventListener('participantLeft', () => {
        this.callParticipantsCount = Math.max(0, this.callParticipantsCount - 1);
      });
      this.jitsiApi.addEventListener('audioMuteStatusChanged', (e: any) => this.microActif = !e.muted);
      this.jitsiApi.addEventListener('videoMuteStatusChanged', (e: any) => this.cameraActive = !e.muted);
      this.jitsiApi.addEventListener('screenSharingStatusChanged', (e: any) => this.partageEcran = e.on);
      this.jitsiApi.addEventListener('readyToClose', () => this.terminerAppelChat());
      this.jitsiApi.addEventListener('connectionFailed', () => {
        this.jitsiErreur = 'La connexion à l\'appel a échoué. Réessayez.';
      });
      this.jitsiApi.addEventListener('errorOccurred', () => {
        this.jitsiErreur = 'Une erreur est survenue lors de la connexion à l\'appel.';
      });
      this.jitsiApi.addEventListener('videoConferenceLeft', () => {
        if (!this.jitsiPret) this.jitsiErreur = 'La connexion à l\'appel a été interrompue.';
      });
    } catch {
      this.jitsiErreur = 'Erreur lors du lancement de l\'appel';
      this.showToast('error', 'Erreur', 'Impossible de démarrer l\'appel');
    }
  }

  private detruireJitsiChat(): void {
    if (this.jitsiJoinTimeoutId) { clearTimeout(this.jitsiJoinTimeoutId); this.jitsiJoinTimeoutId = null; }
    if (this.jitsiApi) {
      try { this.jitsiApi.dispose(); } catch { /* ignore */ }
      this.jitsiApi = null;
    }
    this.jitsiPret = false;
  }

  terminerAppelChat(): void {
    this.detruireJitsiChat();
    this.showCallOverlay = false;
  }

  toggleMicroAppel(): void { if (this.jitsiApi) this.jitsiApi.executeCommand('toggleAudio'); }
  toggleCameraAppel(): void { if (this.jitsiApi) this.jitsiApi.executeCommand('toggleVideo'); }
  togglePartageEcranAppel(): void { if (this.jitsiApi) this.jitsiApi.executeCommand('toggleShareScreen'); }

  getCallLink(): string {
    if (!this.selectedConversation) return '';
    return `https://${environment.jitsiDomain}/${this.getCallRoomName()}`;
  }

  copierLienAppel(): void {
    const lien = this.getCallLink();
    if (!lien) return;
    navigator.clipboard.writeText(lien).then(() => {
      this.callLienCopie = true;
      this.showToast('success', 'Copié', 'Lien de l\'appel copié !');
      setTimeout(() => this.callLienCopie = false, 2000);
    });
  }

  private notifierLancementAppel(): void {
    if (!this.selectedConversation) return;
    this.chatService.notifyCallStarted(
      this.selectedConversation.id, this.getCallLink(), this.callType
    ).subscribe({ error: () => { /* non bloquant */ } });
  }

  toggleInviteCallPanel(): void {
    this.showInviteCallPanel = !this.showInviteCallPanel;
  }

  envoyerInvitationAppel(): void {
    const email = this.inviteCallEmail.trim();
    if (!email || !this.selectedConversation) return;

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      this.showToast('error', 'Email invalide', 'Veuillez saisir une adresse email valide');
      return;
    }

    this.isInvitingToCall = true;
    this.chatService.inviteToCall(this.selectedConversation.id, email, this.getCallLink()).subscribe({
      next: () => {
        this.isInvitingToCall = false;
        this.showToast('success', 'Invitation envoyée', `Un lien de connexion a été envoyé à ${email}`);
        this.inviteCallEmail = '';
        this.showInviteCallPanel = false;
      },
      error: (err) => {
        this.isInvitingToCall = false;
        this.showToast('error', 'Erreur', err.error?.message || 'Impossible d\'envoyer l\'invitation');
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
      }
    };
    document.head.appendChild(script);
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
