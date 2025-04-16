// src/lib/utils.ts

// Import Timestamp type from Firestore if you use it directly
// If you only use it for instanceof check, it might not be strictly needed at the top level
// depending on your TS config, but it's good practice.
import { Timestamp } from 'firebase/firestore';

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
    // Add fallback if title becomes empty after processing
    const finalTitle = title.length > 35 ? title.substring(0, 32) + '...' : title;
    return finalTitle || 'Chat';
};

/**
 * Formats a Firestore Timestamp or Date object into a readable time string.
 * Handles cases where the input might be a FieldValue (serverTimestamp()) or null/undefined.
 * @param timestampInput The value from Firestore, which could be Timestamp, Date, FieldValue, null, or undefined.
 * @returns Formatted time string (e.g., "10:30 AM") or "..." if invalid or not yet converted.
 */
export const formatTimestamp = (timestampInput: unknown): string => {
    let date: Date | null = null;

    // 1. Check if it's a Firestore Timestamp (most common case after data settles)
    //    Firestore Timestamps have a toDate method. Explicitly check for the method.
    if (timestampInput && typeof (timestampInput as any).toDate === 'function') {
      try {
        // It looks like a Timestamp, try calling toDate()
        date = (timestampInput as Timestamp).toDate();
      } catch (e) {
         console.error("Error calling toDate() on potential timestamp:", e);
         return "..."; // Return placeholder on error during conversion
      }
    }
    // 2. Check if it's already a standard JavaScript Date object
    else if (timestampInput instanceof Date) {
      date = timestampInput;
    }
    // 3. If it's neither with a toDate method nor a Date instance,
    //    it might be a FieldValue, null, undefined, or something else.
    //    We cannot format these, so we fall through to the validation below.

    // 4. Check if we successfully got a valid Date object
    if (!date || isNaN(date.getTime())) {
        // Return placeholder for null, undefined, FieldValue, or invalid Date result
        // console.log("formatTimestamp: Input is not a valid Timestamp or Date yet."); // Optional logging
        return "...";
    }

    // 5. Format the valid date
    try {
         // Use hour12: true for AM/PM format
         return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch (e) {
        console.error("Error formatting date:", e);
        return "Invalid Time"; // Fallback for formatting errors
    }
};

// You can add other utility functions here as needed.