
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
    createdAt: string;
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
