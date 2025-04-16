// src/lib/utils.ts
import { Timestamp } from 'firebase/firestore';

/**
 * Generates a concise title from the first user message.
 */
export const generateChatTitle = (firstMessageText: string): string => {
    if (!firstMessageText || typeof firstMessageText !== 'string') {
        return 'New Chat';
    }
    const words = firstMessageText.trim().split(/\s+/);
    const title = words.slice(0, 5).join(' ');
    return title.length > 35 ? title.substring(0, 32) + '...' : title || 'Chat'; // Ensure fallback if empty after processing
};

/**
 * Formats a Firestore Timestamp or Date object into a readable time string.
 */
export const formatTimestamp = (timestamp: Timestamp | Date | undefined | null): string => {
    let date: Date | null = null;
    if (!timestamp) return "...";

    if (timestamp instanceof Timestamp) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    }

    if (!date || isNaN(date.getTime())) return "...";

    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }); // Added hour12
};