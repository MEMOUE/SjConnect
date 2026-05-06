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
  name?: string;
  avatar?: string;
  isOnline: boolean;
  role?: string;
}

export interface Message {
  id: number;
  senderId: number;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  isEdited?: boolean;
  type: string;
  fileUrl?: string;
  fileName?: string;
  conversationId: number;
  createdAt?: string;
  parentMessageId?: number;
  parentMessageContent?: string;
}

export interface ChatNotification {
  type: string;
  conversationId: number;
  username?: string;
  messageId?: number;
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
    isEdited?: boolean;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  content: T[];
  timestamp: string;
}
