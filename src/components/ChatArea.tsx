// src/components/ChatArea.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image'; // Import Image
import ChatHeader from './ChatHeader';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { Chat, Message } from '@/types';
import { InlineLoader } from './Loaders';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, updateDoc, doc, DocumentData, QuerySnapshot, Timestamp } from 'firebase/firestore'; // Import necessary types
import { useCollection } from 'react-firebase-hooks/firestore';
import toast from 'react-hot-toast';
import { generateChatTitle } from '@/lib/utils';
import { FaBars } from 'react-icons/fa';
import { FirebaseError } from 'firebase/app';


interface ChatAreaProps {
  activeChat: Chat | undefined;
  onToggleSidebar: () => void;
}

export default function ChatArea({ activeChat, onToggleSidebar }: ChatAreaProps) {
  const { user } = useAuth();
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- Firestore Query ---
  const messagesRef = activeChat && user ? collection(db, 'users', user.uid, 'chats', activeChat.id, 'messages') : null;
  const messagesQuery = messagesRef ? query(messagesRef, orderBy('timestamp', 'asc')) : null;
  const [messagesSnapshot, messagesLoading, messagesError]: [QuerySnapshot<DocumentData> | undefined, boolean, FirebaseError | undefined] = useCollection(messagesQuery);

  // --- Type assertion when mapping ---
  const messages: Message[] | undefined = messagesSnapshot?.docs.map(docSnapshot => {
      const data = docSnapshot.data();
      return {
        id: docSnapshot.id,
        chatId: activeChat?.id ?? '',
        userId: data.userId,
        sender: data.sender,
        text: data.text,
        timestamp: data.timestamp as Timestamp, // Assert timestamp type
        fileInfo: data.fileInfo,
        reaction: data.reaction,
    } as Message; // Assert the final object shape
  });

  // --- Scroll Effect ---
   useEffect(() => {
    if (!messagesLoading) {
        setTimeout(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, 150);
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
                await updateDoc(chatDocRef, { title: newTitle });
              }
           } catch (error: unknown) { // Use unknown
               console.error("Error updating chat title:", error);
               // Handle error silently or with a subtle log
           }
      }
  }, [user, activeChat?.title]);


  // --- Message Sending Logic ---
  const handleSendMessage = useCallback(async (messageText: string, file?: File) => {
    if (!user || !activeChat || (!messageText.trim() && !file)) return;

    setIsLoadingAI(true);
    const isSecret = activeChat.isSecret;
    const chatId = activeChat.id;
    const chatDocRef = doc(db, 'users', user.uid, 'chats', chatId);
    const messagesColRef = collection(chatDocRef, 'messages');

    const userMessageTextForAI = messageText.trim(); // Use const
    const uploadedFileInfo: { name: string; path: string } | undefined = undefined; // Use const

    // --- File Handling ---
    if (file) {
        if (isSecret) toast('File attachments ignored in secret chats.', { icon: '🤫' });
        else toast.error("File upload not yet implemented.");
        if (!messageText.trim()) { setIsLoadingAI(false); return; }
    }

    // --- 1. Add User Message ---
    const userMessageData: Omit<Message, 'id' | 'chatId'> = {
      userId: user.uid, sender: 'user', text: messageText.trim(),
      timestamp: serverTimestamp(), fileInfo: uploadedFileInfo, reaction: null,
    };

    let userMessageRefId: string | null = null;
    if (!isSecret) {
        try {
            const docRef = await addDoc(messagesColRef, userMessageData);
            userMessageRefId = docRef.id;
            await updateDoc(chatDocRef, { lastUpdatedAt: serverTimestamp() });
        } catch(error: unknown) { // Use unknown
             console.error("Error saving user message:", error);
             const message = error instanceof Error ? error.message : "Unknown error";
             toast.error(`Failed to send message: ${message}`);
             setIsLoadingAI(false); return;
        }
    } else { console.log("Secret Chat: User message not saved."); }

    // --- 2. Call AI API ---
    try {
        const aiPayload = { message: userMessageTextForAI };
        const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(aiPayload) });
        if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.error || `API Error (${response.status})`); }
        const data = await response.json();

        // --- 3. Add AI Response ---
        if (data.reply) {
             const aiMessageData: Omit<Message, 'id' | 'chatId'> = {
                userId: user.uid, sender: 'ai', text: data.reply,
                timestamp: serverTimestamp(), reaction: null,
             };
             if (!isSecret) {
                 const addedAiDoc = await addDoc(messagesColRef, aiMessageData);
                 // Prepare approximate messages for title update (more robust might refetch)
                 const currentTempMessages = [...(messages ?? []), { ...userMessageData, id: userMessageRefId ?? 'temp-user'}, { ...aiMessageData, id: addedAiDoc.id }];
                 await updateChatTitleIfNeeded(chatId, currentTempMessages as Message[]);
             } else { console.log("Secret Chat: AI response not saved."); }
        } else { throw new Error("Received empty reply from AI"); }

    } catch (error: unknown) { // Use unknown
        console.error("Error getting AI response:", error);
        const errorMsg = error instanceof Error ? error.message : 'Unknown AI error';
        toast.error(`AI Error: ${errorMsg}`);
        if (!isSecret && userMessageRefId) { // Log error message in chat if not secret
           try {
                await addDoc(messagesColRef, { userId: user.uid, sender: 'ai', text: `Sorry, error occurred: ${errorMsg}`, timestamp: serverTimestamp(), reaction: null });
            } catch(e){ console.error("Failed to add error message to chat:", e) }
        }
    } finally { setIsLoadingAI(false); }
  }, [user, activeChat, messages, updateChatTitleIfNeeded]);


   // --- Message Action Handler ---
   const handleMessageAction = useCallback(async (messageId: string, action: 'like' | 'dislike' | 'copy', text?: string | React.ReactNode) => {
       if (!user || !activeChat) return;
       if (action === 'copy') { /* ... copy logic ... */
           const textToCopy = typeof text === 'string' ? text : '';
           if (textToCopy) {
               navigator.clipboard.writeText(textToCopy)
                   .then(() => toast.success('Copied!'))
                   .catch(err => { // Use err
                       console.error("Failed to copy:", err); // Log error
                       toast.error('Failed to copy.');
                   });
           }
           return;
        }
       if (activeChat.isSecret) { toast('Reactions disabled for secret chats.', { icon: '🤫' }); return; }

       const messageDocRef = doc(db, 'users', user.uid, 'chats', activeChat.id, 'messages', messageId);
       const currentMessage = messages?.find(m => m.id === messageId);
       const newReaction = currentMessage?.reaction === action ? null : action;

       try { await updateDoc(messageDocRef, { reaction: newReaction }); }
       catch (error: unknown) { // Use unknown
           console.error(`Error updating reaction:`, error);
            const message = error instanceof Error ? error.message : "Unknown error";
           toast.error(`Failed to save reaction: ${message}`);
       }
   }, [user, activeChat, messages]);

  return (
    <div className="flex flex-col flex-grow bg-gradient-to-b from-gray-800/90 via-gray-900 to-gray-900 h-screen overflow-hidden">
      {!activeChat ? (
        <div className="flex-grow flex flex-col items-center justify-center text-center p-10 relative">
            <button onClick={onToggleSidebar} className="absolute top-5 left-5 p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700/60 md:hidden z-10">
                <FaBars size={20}/>
            </button>
            {/* Use next/image */}
            <Image
                src="/logo-placeholder.svg"
                alt="Mental Buddy"
                width={112} height={112} // w-28 h-28
                className="mb-8 opacity-60 animate-pulse filter grayscale contrast-125"
                priority
            />
           <h2 className="text-2xl font-medium text-gray-400 mb-3">Select or Start a Chat</h2>
           <p className="text-gray-500 max-w-sm text-sm">Choose a conversation or click 'New Chat' to begin.</p>
        </div>
      ) : (
        <>
           <ChatHeader chatTitle={activeChat.title} isSecret={activeChat.isSecret} onToggleSidebar={onToggleSidebar} />
          <div id="message-list" className="flex-grow overflow-y-auto p-4 md:p-6 space-y-5 custom-scrollbar pb-8">
             {messagesLoading && !messagesSnapshot?.docs.length && (
                <div className="flex justify-center items-center py-10"><InlineLoader size="md" /></div>
             )}
             {messagesError && ( <div className="text-center text-red-400 py-10 px-4 text-sm">Error loading: {messagesError.message}</div> )}
             {!messagesLoading && messages?.map((msg) => (
                <ChatMessage key={msg.id} message={msg} onAction={handleMessageAction} isSecretChat={activeChat.isSecret} /> // Pass secret status
             ))}
             {isLoadingAI && ( <div className="flex justify-start items-center pl-12 py-2"><InlineLoader size="sm" color="blue"/></div> )}
            <div ref={messagesEndRef} className="h-1"/>
          </div>
          <ChatInput onSendMessage={handleSendMessage} isLoading={isLoadingAI} />
        </>
      )}
    </div>
  );
}