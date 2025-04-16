// src/types/index.ts
import { FieldValue, Timestamp } from 'firebase/firestore';

export interface Message {
  id: string;
  chatId: string; // ID of the parent chat document
  userId: string; // Auth0 user ID ('sub')
  sender: 'user' | 'ai';
  text: string | React.ReactNode;
  timestamp: Timestamp | FieldValue;
  fileInfo?: { name: string; path: string }; // Currently unused
  reaction?: 'like' | 'dislike' | null;
}

export interface Chat {
  id: string;
  userId: string; // Auth0 user ID ('sub')
  title: string;
  createdAt: Timestamp | FieldValue;
  lastUpdatedAt: Timestamp | FieldValue;
  isSecret: boolean;
}