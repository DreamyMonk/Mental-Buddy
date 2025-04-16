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
    const finalTitle = title.length > 35 ? title.substring(0, 32) + '...' : title;
    return finalTitle || 'Chat'; // Fallback if empty
};

/**
 * Formats a Firestore Timestamp or Date object into a readable time string.
 */
export const formatTimestamp = (timestampInput: unknown): string => {
    let date: Date | null = null;
    if (timestampInput && typeof (timestampInput as any).toDate === 'function') {
      try { date = (timestampInput as Timestamp).toDate(); }
      catch (e) { console.error("Error parsing timestamp:", e); return "..."; }
    }
    else if (timestampInput instanceof Date) { date = timestampInput; }

    if (!date || isNaN(date.getTime())) { return "..."; }

    try { return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }); }
    catch (e) { console.error("Error formatting date:", e); return "Invalid Time"; }
};