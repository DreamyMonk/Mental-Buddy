// src/types/index.ts
import { FieldValue, Timestamp } from 'firebase/firestore';

export interface Message {
  id: string;
  chatId: string;
  userId: string;
  sender: 'user' | 'ai';
  text: string | React.ReactNode;
  timestamp: Timestamp | FieldValue;
  fileInfo?: { name: string; path: string };
  reaction?: 'like' | 'dislike' | null;
}

export interface Chat {
  id: string;
  userId: string;
  title: string;
  createdAt: Timestamp | FieldValue;
  lastUpdatedAt: Timestamp | FieldValue;
  isSecret: boolean;
}