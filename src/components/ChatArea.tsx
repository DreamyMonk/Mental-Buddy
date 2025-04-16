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
import { collection, addDoc, serverTimestamp, query, orderBy, updateDoc, doc, DocumentData, QuerySnapshot, Timestamp } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import toast from 'react-hot-toast';
import { generateChatTitle } from '@/lib/utils';
import { FaBars } from 'react-icons/fa'; // Ensure FaFileAlt is removed
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

  // --- Explicit Mapping ---
  const messages: Message[] | undefined = messagesSnapshot?.docs.map(docSnapshot => {
      const data = docSnapshot.data();
      return {
        id: docSnapshot.id, chatId: activeChat?.id ?? '', userId: data.userId as string, sender: data.sender as 'user' | 'ai',
        text: data.text as string | React.ReactNode, timestamp: data.timestamp as Timestamp, fileInfo: data.fileInfo as { name: string; path: string } | undefined, reaction: data.reaction as 'like' | 'dislike' | null | undefined,
    }; // Removed final 'as Message' as explicit mapping is done
  });

  // --- Scroll Effect ---
   useEffect(() => {
    if (!messagesLoading) { setTimeout(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, 150); }
  }, [messagesSnapshot, messagesLoading]);

  // --- Update Chat Title ---
   const updateChatTitleIfNeeded = useCallback(async (chatId: string, currentMessages: Message[]) => {
      // ... (function logic remains the same) ...
      if (!user || !chatId || currentMessages.length < 1 || activeChat?.title !== 'New Chat') return;
      const chatDocRef = doc(db, 'users', user.uid, 'chats', chatId);
      const firstUserMessage = currentMessages.find(m => m.sender === 'user');
      if (typeof firstUserMessage?.text === 'string') {
           try {
              const newTitle = generateChatTitle(firstUserMessage.text);
              if (newTitle && newTitle !== 'New Chat') { await updateDoc(chatDocRef, { title: newTitle }); }
           } catch (error: unknown) { console.error("Error updating chat title:", error); }
      }
  }, [user, activeChat?.title]);


  // --- Message Sending Logic (Using Simplified Error Handling) ---
  const handleSendMessage = useCallback(async (messageText: string, file?: File) => {
    if (!user || !activeChat || (!messageText.trim() && !file)) return;
    setIsLoadingAI(true);
    const isSecret = activeChat.isSecret;
    const chatId = activeChat.id;
    const chatDocRef = doc(db, 'users', user.uid, 'chats', chatId);
    const messagesColRef = collection(chatDocRef, 'messages');
    const userMessageTextForAI = messageText.trim(); // Ensure this is const
    const uploadedFileInfo: { name: string; path: string } | undefined = undefined; // Ensure this is const

    if (file) { /* File handling disabled */ if (isSecret) toast('File attachments ignored in secret chats.',{icon:'🤫'}); else toast.error("File upload not implemented."); if (!messageText.trim()){setIsLoadingAI(false); return;}}

    const userMessageData: Omit<Message, 'id' | 'chatId'> = {userId: user.uid, sender: 'user', text: messageText.trim(), timestamp: serverTimestamp(), fileInfo: uploadedFileInfo, reaction: null };
    let userMessageSaved = false;
    if (!isSecret) {
        try { await addDoc(messagesColRef, userMessageData); await updateDoc(chatDocRef, { lastUpdatedAt: serverTimestamp() }); userMessageSaved = true;}
        catch (error: unknown) { const message=error instanceof Error?error.message:"Unknown error"; toast.error(`Failed to send: ${message}`); setIsLoadingAI(false); return; }
    } else { userMessageSaved = true; }

    if (userMessageSaved || isSecret) {
        try {
            const aiPayload = { message: userMessageTextForAI };
            const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(aiPayload) });
            if (!response.ok) { const errorData = await response.json().catch(()=>({error:{message:`API Error (${response.status})`}})); throw new Error(errorData.error?.message || `API Error (${response.status})`);}
            const data = await response.json();
            if (data.reply) {
                const aiMessageData: Omit<Message, 'id'|'chatId'> = { userId: user.uid, sender: 'ai', text: data.reply, timestamp: serverTimestamp(), reaction: null };
                if (!isSecret) {
                    const addedAiDoc = await addDoc(messagesColRef, aiMessageData);
                    const currentMessages = messagesSnapshot?.docs.map(d => ({ id: d.id, ...d.data() })) ?? [];
                    const finalMessages = [...currentMessages, { ...userMessageData, id: 'temp-user'}, { ...aiMessageData, id: addedAiDoc.id }];
                    await updateChatTitleIfNeeded(chatId, finalMessages as Message[]);
                } else { console.log("Secret Chat: AI response not saved."); }
            } else { throw new Error("Received empty reply from AI"); }
        } catch (error: unknown) { const errorMsg = error instanceof Error ? error.message : 'Unknown AI error'; toast.error(`AI Error: ${errorMsg}`); }
        finally { setIsLoadingAI(false); }
    } else { setIsLoadingAI(false); }
  }, [user, activeChat, messages, updateChatTitleIfNeeded, messagesSnapshot]); // Added messagesSnapshot


   // --- Message Action Handler ---
   const handleMessageAction = useCallback(async (messageId: string, action: 'like' | 'dislike' | 'copy', text?: string | React.ReactNode) => {
       if (!user || !activeChat) return;
       if (action === 'copy') {
           const textToCopy = typeof text === 'string' ? text : '';
           if (textToCopy) {
               navigator.clipboard.writeText(textToCopy)
                   .then(() => toast.success('Copied!'))
                   .catch((err) => { // Use the err variable
                       console.error("Clipboard copy failed:", err); // Log the error
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
       catch (error: unknown) {
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
            <Image src="/logo-placeholder.svg" alt="Mental Buddy" width={112} height={112} className="mb-8 opacity-60 animate-pulse filter grayscale contrast-125" priority />
            {/* Fixed quotes using ' */}
           <h2 className="text-2xl font-medium text-gray-400 mb-3">Select or Start a Chat</h2>
           <p className="text-gray-500 max-w-sm text-sm">Choose a conversation or click 'New Chat' to begin.</p>
        </div>
      ) : (
        <>
           <ChatHeader chatTitle={activeChat.title} isSecret={activeChat.isSecret} onToggleSidebar={onToggleSidebar} />
           <div id="message-list" className="flex-grow overflow-y-auto p-4 md:p-6 space-y-5 custom-scrollbar pb-8">
             {/* ... loading/error/map ... */}
             {!messagesLoading && messages?.map((msg) => (
                <ChatMessage key={msg.id} message={msg} onAction={handleMessageAction} isSecretChat={activeChat.isSecret} />
             ))}
             {/* ... AI loader ... */}
              {isLoadingAI && ( <div className="flex justify-start items-center pl-12 py-2"><InlineLoader size="sm" color="blue"/></div> )}
             <div ref={messagesEndRef} className="h-1"/>
           </div>
           <ChatInput onSendMessage={handleSendMessage} isLoading={isLoadingAI} />
        </>
      )}
    </div>
  );
}