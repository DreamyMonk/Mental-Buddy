// src/types/index.ts
import { FieldValue, Timestamp } from 'firebase/firestore';

export interface Message {
  id: string;
  chatId: string;
  userId: string; // User who initiated the interaction this message belongs to
  sender: 'user' | 'ai';
  text: string | React.ReactNode; // Allow JSX for file links etc.
  timestamp: Timestamp | FieldValue;
  fileInfo?: { name: string; path: string }; // For file attachments (path from storage)
  reaction?: 'like' | 'dislike' | null; // User feedback
}

export interface Chat {
  id: string;
  userId: string; // Owner of the chat
  title: string;
  createdAt: Timestamp | FieldValue;
  lastUpdatedAt: Timestamp | FieldValue;
  isSecret: boolean;
  // Messages are stored in a subcollection: /users/{userId}/chats/{chatId}/messages/{messageId}
}