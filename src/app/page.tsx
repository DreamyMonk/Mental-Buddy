// src/app/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client'; // Use Auth0 hook
import Sidebar from '@/components/Sidebar';
import ChatArea from '@/components/ChatArea';
import { Chat } from '@/types';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, updateDoc, doc, DocumentData, deleteDoc } from 'firebase/firestore'; // Added deleteDoc
import { useCollection } from 'react-firebase-hooks/firestore';
import toast from 'react-hot-toast';
import { FullScreenLoader } from '@/components/Loaders';
import { FirebaseError } from 'firebase/app';
import type { QuerySnapshot } from 'firebase/firestore';


export default function ChatPage() {
  const { user, error: authError, isLoading: authLoading } = useUser();
  const router = useRouter();

  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isSecretMode, setIsSecretMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const userId = user?.sub; // Auth0 user ID

  // --- Redirect Logic ---
  useEffect(() => {
    if (!authLoading) {
      if (authError) {
        console.error("Auth0 Error:", authError);
        // Optionally redirect to login to clear state if error persists
        // router.push('/api/auth/logout');
      } else if (!user) {
        router.push('/api/auth/login');
      } else {
        if (window.innerWidth < 768) setSidebarOpen(false);
      }
    }
  }, [user, authLoading, authError, router]);

  // --- Firestore Queries ---
  const chatsRef = userId ? collection(db, 'users', userId, 'chats') : null;
  const chatsQuery = chatsRef ? query(chatsRef, orderBy('lastUpdatedAt', 'desc')) : null;
  const [chatsSnapshot, chatsLoading, chatsError]: [QuerySnapshot<DocumentData> | undefined, boolean, FirebaseError | undefined] = useCollection(chatsQuery);

  const chats: Chat[] | undefined = chatsSnapshot?.docs.map(docSnapshot => ({
    id: docSnapshot.id, ...(docSnapshot.data() as Omit<Chat, 'id'>),
  }));
  const activeChat = chats?.find(chat => chat.id === activeChatId);

  // --- Effects ---
  useEffect(() => {
    if (userId && !chatsLoading && chats) {
        if (!activeChatId && chats.length > 0) { setActiveChatId(chats[0].id); }
    }
    if (!userId) { setActiveChatId(null); } // Clear active chat on logout
  }, [userId, chats, chatsLoading, activeChatId]);

  // --- Handlers ---
  const handleNewChat = useCallback(async () => { /* ... As previously defined ... */ }, [userId, isSecretMode]);
  const handleSelectChat = useCallback((chatId: string) => { /* ... As previously defined ... */ }, [userId]);
  const handleToggleSecretMode = useCallback(() => { /* ... As previously defined ... */ }, [userId, isSecretMode]);
  const handleToggleSidebar = useCallback(() => setSidebarOpen(prev => !prev), []);

  const handleDeleteChat = useCallback(async (chatIdToDelete: string) => {
    if (!userId || !chatIdToDelete) return;
    if (!window.confirm("Delete this chat permanently?")) return;

    const toastId = toast.loading("Deleting chat...");
    try {
        const chatDocRef = doc(db, 'users', userId, 'chats', chatIdToDelete);
        await deleteDoc(chatDocRef);
        if (activeChatId === chatIdToDelete) {
            const remainingChats = chats?.filter(c => c.id !== chatIdToDelete);
            setActiveChatId(remainingChats && remainingChats.length > 0 ? remainingChats[0].id : null);
        }
        toast.success("Chat deleted.", { id: toastId });
    } catch (error: unknown) { /* ... Error handling ... */ }
  }, [userId, activeChatId, chats]);

  const handleRenameChat = useCallback(async (chatIdToRename: string, newTitle: string) => {
    if (!userId || !chatIdToRename || !newTitle.trim()) return;
    const trimmedTitle = newTitle.trim().substring(0, 100); // Ensure limit
    if (!trimmedTitle) return toast.error("Title cannot be empty.");

    const toastId = toast.loading("Renaming chat...");
    try {
        const chatDocRef = doc(db, 'users', userId, 'chats', chatIdToRename);
        await updateDoc(chatDocRef, { title: trimmedTitle, lastUpdatedAt: serverTimestamp() });
        toast.success("Chat renamed.", { id: toastId });
    } catch (error: unknown) { /* ... Error handling ... */ }
  }, [userId]);

  // --- Render Logic ---
  if (authLoading) return <FullScreenLoader />;
  if (!authLoading && (!user || authError)) return null; // Redirecting or error state
  if (chatsError) return <div className="text-red-400 p-6 text-center">Error: {chatsError.message}</div>;

  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden relative">
      <Sidebar
        // user={user} // Pass user if needed
        chats={chats ?? []} activeChatId={activeChatId} onNewChat={handleNewChat}
        onSelectChat={handleSelectChat} isLoading={chatsLoading && !chatsSnapshot} isSecretMode={isSecretMode}
        onToggleSecretMode={handleToggleSecretMode} isOpen={sidebarOpen} onToggleSidebar={handleToggleSidebar}
        onDeleteChat={handleDeleteChat} onRenameChat={handleRenameChat} // Pass handlers
      />
      <ChatArea key={activeChatId || 'no-chat'} activeChat={activeChat} onToggleSidebar={handleToggleSidebar} />
    </div>
  );
}