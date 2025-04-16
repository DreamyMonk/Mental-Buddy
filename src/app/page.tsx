// src/app/page.tsx
'use client';

// Remove React import if not explicitly needed elsewhere in this file (Next.js often handles it implicitly)
// import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useState, useEffect, useCallback } from 'react'; // Removed useRef
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';
import ChatArea from '@/components/ChatArea';
import { Chat } from '@/types';
import { db } from '@/lib/firebase';
// Removed unused 'updateDoc', 'doc' from firestore import
import { collection, addDoc, serverTimestamp, query, orderBy, DocumentData, QuerySnapshot } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import toast from 'react-hot-toast';
import { FullScreenLoader } from '@/components/Loaders';
// Removed unused 'generateChatTitle' import
// import { generateChatTitle } from '@/lib/utils';
import { FirebaseError } from 'firebase/app';
import type { QuerySnapshot as FirebaseQuerySnapshot } from 'firebase/firestore'; // Use alias if QuerySnapshot name conflicts


export default function ChatPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isSecretMode, setIsSecretMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // --- Redirect Logic ---
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        console.log("Chat Page: No user, redirecting to /login");
        router.push('/login');
      } else {
        if (window.innerWidth < 768) setSidebarOpen(false);
      }
    }
  }, [user, authLoading, router]);

  // --- Firestore Queries ---
  const chatsRef = user ? collection(db, 'users', user.uid, 'chats') : null;
  const chatsQuery = chatsRef ? query(chatsRef, orderBy('lastUpdatedAt', 'desc')) : null;
  const [chatsSnapshot, chatsLoading, chatsError]: [FirebaseQuerySnapshot<DocumentData> | undefined, boolean, FirebaseError | undefined] = useCollection(chatsQuery);


  const chats: Chat[] | undefined = chatsSnapshot?.docs.map(docSnapshot => ({
    id: docSnapshot.id,
    ...(docSnapshot.data() as Omit<Chat, 'id'>),
  }));

  const activeChat = chats?.find(chat => chat.id === activeChatId);

  // --- Effects ---
   useEffect(() => {
    if (user && !chatsLoading && chats) {
        if (!activeChatId && chats.length > 0) {
            setActiveChatId(chats[0].id);
        }
    }
  }, [user, chats, chatsLoading, activeChatId]);


  // --- Handlers ---
  const handleNewChat = useCallback(async () => {
    if (!user) return toast.error("Please log in first.");

    const newChatData = {
      userId: user.uid,
      title: 'New Chat',
      createdAt: serverTimestamp(),
      lastUpdatedAt: serverTimestamp(),
      isSecret: isSecretMode,
    };

    const toastId = toast.loading(`Creating ${isSecretMode ? 'secret ' : ''}chat...`);
    try {
      const docRef = await addDoc(collection(db, 'users', user.uid, 'chats'), newChatData);
      setActiveChatId(docRef.id);
      toast.success(`New ${isSecretMode ? 'secret ' : ''}chat started!`, { id: toastId });
      if (window.innerWidth < 768) setSidebarOpen(false);
    } catch (error: unknown) {
      console.error("Error creating new chat:", error);
       const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to create chat: ${message}`, { id: toastId });
    }
  }, [user, isSecretMode]);

  const handleSelectChat = useCallback((chatId: string) => {
    if (!user) return;
    setActiveChatId(chatId);
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, [user]);

  const handleToggleSecretMode = useCallback(() => {
    if (!user) return;
    const changingTo = !isSecretMode;
    setIsSecretMode(changingTo);
    toast( `Secret mode ${changingTo ? 'enabled' : 'disabled'}. New chats will ${changingTo ? 'not' : ''} be saved.`, { icon: changingTo ? '🔒' : '🔓' });
  }, [user, isSecretMode]);


  const handleToggleSidebar = useCallback(() => setSidebarOpen(prev => !prev), []);

  // --- Render Logic ---
  if (authLoading) return <FullScreenLoader />;
  if (!user) return null;
  if (chatsError) {
    return <div className="text-red-400 p-6 text-center">Error loading chat list: {chatsError.message}. Please try refreshing.</div>;
  }

  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden relative">
      <Sidebar
        chats={chats ?? []}
        activeChatId={activeChatId}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        isLoading={chatsLoading && !chatsSnapshot}
        isSecretMode={isSecretMode}
        onToggleSecretMode={handleToggleSecretMode}
        isOpen={sidebarOpen}
        onToggleSidebar={handleToggleSidebar}
      />
      <ChatArea
        key={activeChatId || 'no-chat-selected'}
        activeChat={activeChat}
        onToggleSidebar={handleToggleSidebar}
      />
    </div>
  );
}