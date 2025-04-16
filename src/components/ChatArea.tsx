// src/components/ChatArea.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import ChatHeader from './ChatHeader';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { Chat, Message } from '@/types';
import { InlineLoader } from './Loaders';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, updateDoc, doc } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import toast from 'react-hot-toast';
import { generateChatTitle } from '@/lib/utils';
import { FaFileAlt, FaBars } from 'react-icons/fa';

interface ChatAreaProps {
  activeChat: Chat | undefined;
  onToggleSidebar: () => void;
}

export default function ChatArea({ activeChat, onToggleSidebar }: ChatAreaProps) {
  const { user } = useAuth();
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- Firestore Query for Messages ---
  const messagesRef = activeChat && user ? collection(db, 'users', user.uid, 'chats', activeChat.id, 'messages') : null;
  const messagesQuery = messagesRef ? query(messagesRef, orderBy('timestamp', 'asc')) : null;
  const [messagesSnapshot, messagesLoading, messagesError] = useCollection(messagesQuery);

  const messages: Message[] | undefined = messagesSnapshot?.docs.map(doc => ({
    id: doc.id,
    chatId: activeChat?.id ?? '', // Add chatId if needed
    ...doc.data(),
  })) as Message[] | undefined;

  // --- Scroll Effect ---
   useEffect(() => {
    if (!messagesLoading) {
        // Scroll after messages have likely rendered
        setTimeout(() => {
           messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 150); // Small delay
    }
  }, [messagesSnapshot, messagesLoading]);

  // --- Update Chat Title ---
  const updateChatTitleIfNeeded = useCallback(async (chatId: string, currentMessages: Message[]) => {
      if (!user || !chatId || currentMessages.length < 1 || activeChat?.title !== 'New Chat') return;

      const chatDocRef = doc(db, 'users', user.uid, 'chats', chatId);
      const firstUserMessage = currentMessages.find(m => m.sender === 'user');

      if (typeof firstUserMessage?.text === 'string') {
           try {
              const newTitle = generateChatTitle(firstUserMessage.text);
              if (newTitle && newTitle !== 'New Chat') {
                console.log(`Updating chat ${chatId} title to: ${newTitle}`);
                await updateDoc(chatDocRef, { title: newTitle });
              }
           } catch (error) {
               console.error("Error updating chat title:", error);
           }
      }
  }, [user, activeChat?.title]); // Depend on activeChat.title to prevent unnecessary checks


  // --- Message Sending Logic ---
  const handleSendMessage = useCallback(async (messageText: string, file?: File) => {
    if (!user || !activeChat || (!messageText.trim() && !file)) return;

    setIsLoadingAI(true);
    const isSecret = activeChat.isSecret; // Capture secret status at send time
    const chatId = activeChat.id;
    const chatDocRef = doc(db, 'users', user.uid, 'chats', chatId);
    const messagesColRef = collection(chatDocRef, 'messages');

    let userMessageTextForAI = messageText.trim();
    let uploadedFileInfo: { name: string; path: string } | undefined = undefined;

    // --- File Handling (Placeholder - Implement with Firebase Storage) ---
    if (file) {
        if (isSecret) {
            toast('File attachments ignored in secret chats.', { icon: '🤫' });
        } else {
            toast.error("File upload not yet implemented.");
            // TODO: Implement Firebase Storage upload here
            // 1. Upload file to Storage
            // 2. Get download URL (path)
            // 3. Set uploadedFileInfo = { name: file.name, path: downloadURL };
            // 4. Consider adding file info to userMessageTextForAI if model supports it
        }
        // For now, prevent sending if only file exists without implementation
        if (!messageText.trim()) {
             setIsLoadingAI(false);
             return;
        }
    }

    // --- 1. Add User Message ---
    const userMessageData: Omit<Message, 'id' | 'chatId'> = {
      userId: user.uid,
      sender: 'user',
      text: messageText.trim(),
      timestamp: serverTimestamp(),
      fileInfo: uploadedFileInfo,
      reaction: null,
    };

    let userMessageRefId: string | null = null;
    if (!isSecret) {
        try {
            const docRef = await addDoc(messagesColRef, userMessageData);
            userMessageRefId = docRef.id; // Store ID if needed
            await updateDoc(chatDocRef, { lastUpdatedAt: serverTimestamp() }); // Update chat timestamp
        } catch(error) {
             console.error("Error saving user message:", error);
             toast.error("Failed to send message.");
             setIsLoadingAI(false);
             return; // Stop if user message failed to save
        }
    } else {
        console.log("Secret Chat: User message not saved.");
        // Add to local state temporarily if needed for immediate display?
    }


    // --- 2. Call AI API ---
    try {
        const aiPayload = { message: userMessageTextForAI };
        const response = await fetch('/api/chat', { // Your Gemini API endpoint
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(aiPayload),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `API request failed (${response.status})`);
        }
        const data = await response.json();

        // --- 3. Add AI Response ---
        if (data.reply) {
             const aiMessageData: Omit<Message, 'id' | 'chatId'> = {
                userId: user.uid,
                sender: 'ai',
                text: data.reply,
                timestamp: serverTimestamp(),
                reaction: null,
             };
             if (!isSecret) {
                 await addDoc(messagesColRef, aiMessageData);
                 // Update title using the message data *just added*
                 const currentMessages = messages ? [...messages, { ...userMessageData, id: userMessageRefId ?? 'temp-user-id' }] : [{ ...userMessageData, id: userMessageRefId ?? 'temp-user-id' }];
                 await updateChatTitleIfNeeded(chatId, currentMessages as Message[]);
             } else {
                 console.log("Secret Chat: AI response not saved.");
                 // Display AI response locally if needed (e.g., add to temp state)
             }
        } else {
            throw new Error("Received empty reply from AI API");
        }

    } catch (error) {
        console.error("Error getting AI response:", error);
        const errorMsg = error instanceof Error ? error.message : 'Unknown AI error';
        toast.error(`AI Error: ${errorMsg}`);
        // Optionally add an error message to the chat UI (even if secret)
        if (!isSecret && userMessageRefId) {
             // Example: Add an error message to Firestore if user message was saved
            await addDoc(messagesColRef, {
                 userId: user.uid, sender: 'ai', text: `Sorry, an error occurred while responding: ${errorMsg}`,
                 timestamp: serverTimestamp(), reaction: null
            });
        }
    } finally {
        setIsLoadingAI(false);
    }
  }, [user, activeChat, messages, updateChatTitleIfNeeded]); // Dependencies for the handler


   // --- Message Action Handler ---
   const handleMessageAction = useCallback(async (messageId: string, action: 'like' | 'dislike' | 'copy', text?: string | React.ReactNode) => {
       if (!user || !activeChat) return;

       // Allow copy even for secret chats
       if (action === 'copy') {
           const textToCopy = typeof text === 'string' ? text : '';
           if (textToCopy) {
               navigator.clipboard.writeText(textToCopy)
                   .then(() => toast.success('Copied to clipboard!'))
                   .catch(err => toast.error('Failed to copy.'));
           }
           return;
       }

       // Prevent like/dislike for secret chats
       if (activeChat.isSecret) {
           toast('Reactions disabled for secret chats.', { icon: '🤫' });
           return;
       }

       // Proceed with like/dislike for normal chats
       const messageDocRef = doc(db, 'users', user.uid, 'chats', activeChat.id, 'messages', messageId);
       const currentMessage = messages?.find(m => m.id === messageId);
       const newReaction = currentMessage?.reaction === action ? null : action; // Toggle logic

       try {
           await updateDoc(messageDocRef, { reaction: newReaction });
           // Optional visual feedback (already handled by re-render)
       } catch (error) {
           console.error(`Error updating reaction for message ${messageId}:`, error);
           toast.error('Failed to save reaction.');
       }
   }, [user, activeChat, messages]);


  // --- Render Logic ---
  return (
    <div className="flex flex-col flex-grow bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900 h-screen overflow-hidden">

      {/* Placeholder when no chat is active */}
      {!activeChat ? (
        <div className="flex-grow flex flex-col items-center justify-center text-center p-8 relative">
            <button onClick={onToggleSidebar} className="absolute top-4 left-4 p-2 rounded text-gray-400 hover:text-white hover:bg-gray-700 md:hidden z-10">
                <FaBars size={20}/>
            </button>
           <img src="/logo-placeholder.svg" alt="Mental Buddy" className="w-24 h-24 mb-6 opacity-70 animate-pulse" />
           <h2 className="text-2xl font-semibold text-gray-300 mb-2">Select or Start a Chat</h2>
           <p className="text-gray-400 max-w-md">
             Choose a conversation from the left, or click 'New Chat' to begin.
           </p>
        </div>
      ) : (
        <>
          {/* Chat Header */}
           <ChatHeader
              chatTitle={activeChat.title}
              isSecret={activeChat.isSecret}
              onToggleSidebar={onToggleSidebar}
           />

          {/* Message List */}
          <div id="message-list" className="flex-grow overflow-y-auto p-4 md:p-6 space-y-5 custom-scrollbar">
             {messagesLoading && !messagesSnapshot?.docs.length && ( // Show loader only if initial load AND no messages yet
                <div className="flex justify-center items-center py-10">
                    <InlineLoader size="md" />
                </div>
             )}
             {messagesError && (
                <div className="text-center text-red-400 py-10 px-4 text-sm">Error loading messages: {messagesError.message}</div>
             )}
             {/* Render messages once available */}
             {!messagesLoading && messages?.map((msg) => (
                <ChatMessage
                    key={msg.id}
                    message={msg}
                    onAction={handleMessageAction}
                />
             ))}
             {/* AI Loading Indicator (at the bottom) */}
             {isLoadingAI && (
                <div className="flex justify-start items-center pl-12 py-2">
                    <InlineLoader size="sm" color="blue"/>
                </div>
             )}
            <div ref={messagesEndRef} className="h-1"/> {/* Scroll Anchor */}
          </div>

          {/* Input Area */}
          <ChatInput onSendMessage={handleSendMessage} isLoading={isLoadingAI} />
        </>
      )}
    </div>
  );
}