import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Message {
  id: number;
  senderId: number;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  type: 'text' | 'file' | 'image';
}

interface Conversation {
  id: number;
  name: string;
  avatar: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  isOnline: boolean;
  isGroup: boolean;
}

@Component({
  selector: 'app-chat',
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.html',
  styleUrl: './chat.css'
})
export class Chat implements OnInit {
  conversations: Conversation[] = [
    {
      id: 1,
      name: 'Équipe IT',
      avatar: 'IT',
      lastMessage: 'La mise à jour est prévue pour demain',
      lastMessageTime: new Date(Date.now() - 300000),
      unreadCount: 3,
      isOnline: true,
      isGroup: true
    },
    {
      id: 2,
      name: 'Aminata Diallo',
      avatar: 'AD',
      lastMessage: 'Merci pour ton aide !',
      lastMessageTime: new Date(Date.now() - 3600000),
      unreadCount: 0,
      isOnline: true,
      isGroup: false
    },
    {
      id: 3,
      name: 'Projet Marketplace',
      avatar: 'PM',
      lastMessage: 'On se réunit cet après-midi ?',
      lastMessageTime: new Date(Date.now() - 7200000),
      unreadCount: 5,
      isOnline: false,
      isGroup: true
    },
    {
      id: 4,
      name: 'Mohamed Traoré',
      avatar: 'MT',
      lastMessage: 'J\'ai envoyé les documents',
      lastMessageTime: new Date(Date.now() - 86400000),
      unreadCount: 0,
      isOnline: false,
      isGroup: false
    },
    {
      id: 5,
      name: 'Direction',
      avatar: 'DIR',
      lastMessage: 'Réunion hebdomadaire demain à 10h',
      lastMessageTime: new Date(Date.now() - 172800000),
      unreadCount: 1,
      isOnline: false,
      isGroup: true
    }
  ];

  messages: Message[] = [
    {
      id: 1,
      senderId: 2,
      senderName: 'Kouassi Jean',
      senderAvatar: 'KJ',
      content: 'Bonjour l\'équipe ! Comment avance le projet ?',
      timestamp: new Date(Date.now() - 3600000),
      isRead: true,
      type: 'text'
    },
    {
      id: 2,
      senderId: 1,
      senderName: 'Vous',
      senderAvatar: 'VO',
      content: 'Ça avance bien ! On est à 75% de progression',
      timestamp: new Date(Date.now() - 3000000),
      isRead: true,
      type: 'text'
    },
    {
      id: 3,
      senderId: 3,
      senderName: 'Ibrahim Sanogo',
      senderAvatar: 'IS',
      content: 'La mise à jour est prévue pour demain',
      timestamp: new Date(Date.now() - 300000),
      isRead: false,
      type: 'text'
    }
  ];

  selectedConversation: Conversation | null = null;
  newMessage = '';
  searchTerm = '';
  filteredConversations: Conversation[] = [...this.conversations];

  ngOnInit() {
    // Sélectionner la première conversation par défaut
    if (this.conversations.length > 0) {
      this.selectConversation(this.conversations[0]);
    }
  }

  selectConversation(conversation: Conversation) {
    this.selectedConversation = conversation;
    conversation.unreadCount = 0;
  }

  sendMessage() {
    if (this.newMessage.trim() && this.selectedConversation) {
      const message: Message = {
        id: this.messages.length + 1,
        senderId: 1,
        senderName: 'Vous',
        senderAvatar: 'VO',
        content: this.newMessage,
        timestamp: new Date(),
        isRead: false,
        type: 'text'
      };

      this.messages.push(message);

      // Mettre à jour la conversation
      this.selectedConversation.lastMessage = this.newMessage;
      this.selectedConversation.lastMessageTime = new Date();

      this.newMessage = '';
    }
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
}
