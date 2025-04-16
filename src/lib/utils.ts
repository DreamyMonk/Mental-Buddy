// src/lib/utils.ts

/**
 * Generates a concise title from the first user message.
 * @param firstMessageText The text content of the first user message.
 * @returns A string suitable for a chat title.
 */
export const generateChatTitle = (firstMessageText: string): string => {
    if (!firstMessageText || typeof firstMessageText !== 'string') {
        return 'New Chat';
    }
    const words = firstMessageText.trim().split(/\s+/); // Split by whitespace
    // Take first few words, ensure not too long
    const title = words.slice(0, 5).join(' ');
    return title.length > 35 ? title.substring(0, 32) + '...' : title; // Max length check
};

/**
 * Formats a Firestore Timestamp or Date object into a readable time string.
 * @param timestamp Firestore Timestamp object or Date object.
 * @returns Formatted time string (e.g., "10:30 AM") or "..." if invalid.
 */
export const formatTimestamp = (timestamp: any): string => {
    let date: Date | null = null;
    if (!timestamp) return "...";

    if (typeof timestamp.toDate === 'function') {
      // Firestore Timestamp object
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      // Standard Date object
      date = timestamp;
    }

    if (!date || isNaN(date.getTime())) return "..."; // Check for invalid date

    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};