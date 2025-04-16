// src/components/Sidebar.tsx
import React from 'react';
import Image from 'next/image'; // Import Image
import {
  FaPlus, FaLock, FaUnlock, FaSignOutAlt, FaTimes, FaComments, FaUserCircle
} from 'react-icons/fa';
import { Chat } from '@/types';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import toast from 'react-hot-toast';
import { InlineLoader } from './Loaders';
import { formatTimestamp } from '@/lib/utils';

interface SidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  onNewChat: () => void;
  onSelectChat: (chatId: string) => void;
  isLoading: boolean;
  isSecretMode: boolean;
  onToggleSecretMode: () => void;
  isOpen: boolean;
  onToggleSidebar: () => void;
}

export default function Sidebar({
  chats, activeChatId, onNewChat, onSelectChat, isLoading,
  isSecretMode, onToggleSecretMode, isOpen, onToggleSidebar
}: SidebarProps) {

  const handleSignOut = async () => {
    const toastId = toast.loading('Signing out...');
    try {
      await signOut(auth);
      toast.success('Signed out successfully.', { id: toastId });
    } catch (error: unknown) { // Use unknown
      console.error("Sign Out Error:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to sign out: ${message}`, { id: toastId });
    }
  };

  const currentUser = auth.currentUser;

  return (
    <div className={`fixed inset-y-0 left-0 z-30 w-[280px] bg-gray-800/95 backdrop-blur-sm border-r border-gray-700/40 text-gray-300 flex flex-col h-screen p-3 transition-transform duration-300 ease-in-out md:relative md:translate-x-0 shadow-xl ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
       <div className="flex items-center justify-between mb-3 pt-1 pb-3 border-b border-gray-700/40 px-1">
         <span className="font-semibold text-lg flex items-center gap-2.5 pl-1">
             {/* Use next/image for logo */}
             <Image src="/logo-placeholder.svg" alt="Logo" width={24} height={24} className="opacity-90"/>
            Mental Buddy
         </span>
         <button onClick={onToggleSidebar} className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-700/60 md:hidden">
             <FaTimes size={18}/>
         </button>
      </div>

       <div className="px-1 mb-4 flex items-center gap-2">
            <button
                onClick={onNewChat}
                className="flex-grow flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-medium py-2 px-3 rounded-lg transition-all duration-200 ease-in-out shadow-sm hover:shadow-md text-sm"
                title="New Chat" >
                <FaPlus size={14} /> New Chat
            </button>
            <button
                onClick={onToggleSecretMode}
                className={`p-2 rounded-lg hover:bg-gray-700/60 border border-gray-600/80 transition-colors duration-150 ${isSecretMode ? 'text-yellow-400 bg-gray-700/40 border-yellow-500/30' : 'text-gray-400 hover:text-yellow-300'}`}
                title={isSecretMode ? "Secret Mode ON" : "Secret Mode OFF"} >
                {isSecretMode ? <FaLock size={16} /> : <FaUnlock size={16} />}
            </button>
       </div>

      <div className="flex-grow overflow-y-auto pr-1 custom-scrollbar mb-2 -mr-1">
        {isLoading && (
          <div className="flex justify-center items-center h-40"><InlineLoader size="md" /></div>
        )}
        {!isLoading && chats.length === 0 && (
             <div className="text-center px-3 py-6 text-gray-500">
                 <FaComments className="mx-auto h-10 w-10 mb-3 opacity-50"/>
                 <p className="text-sm">Your chats will appear here.</p>
                 <p className="text-xs mt-1">Start a new conversation!</p>
             </div>
        )}
        {!isLoading && chats.length > 0 && (
             <ul className="space-y-1.5">
              {chats.map((chat) => (
                <li key={chat.id}>
                  <button
                    onClick={() => onSelectChat(chat.id)}
                    className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150 group relative ${
                      chat.id === activeChatId ? 'bg-gray-700 font-medium text-white shadow-inner' : 'text-gray-300 hover:bg-gray-700/50 hover:text-gray-100'
                    }`} >
                    {chat.id === activeChatId && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l-lg"></div>}
                    <span className={`flex-shrink-0 ${chat.id === activeChatId ? 'pl-2' : 'pl-1'}`}>
                       {chat.isSecret ? <FaLock size={12} className="text-yellow-500/80" title="Secret Chat"/> : <FaComments size={13} className={`${chat.id === activeChatId ? 'text-blue-300' : 'text-gray-500 group-hover:text-gray-400 transition-colors'}`} />}
                    </span>
                    <span className="flex-grow truncate pr-2">{chat.title || 'Chat'}</span>
                    <span className={`text-xs flex-shrink-0 transition-colors ${chat.id === activeChatId ? 'text-gray-400' : 'text-gray-500 group-hover:text-gray-400'}`}>
                        {formatTimestamp(chat.lastUpdatedAt)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
        )}
      </div>

      <div className="mt-auto border-t border-gray-700/40 pt-3 px-1 flex items-center justify-between gap-2">
         {currentUser ? ( // Check if currentUser exists
             <div className="flex items-center gap-2.5 truncate flex-grow min-w-0">
                {/* Use next/image for avatar */}
                <Image
                    src={currentUser.photoURL || '/default-avatar.png'}
                    alt="User Avatar"
                    width={32}
                    height={32}
                    className="rounded-full border-2 border-gray-600 flex-shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/default-avatar.png'; }}
                />
                <span className="text-sm font-medium truncate text-gray-200">{currentUser.displayName || 'User'}</span>
             </div>
         ) : (
             <div className="flex items-center gap-2 truncate flex-grow min-w-0 text-gray-500">
                <FaUserCircle className="w-8 h-8"/> <span className="text-sm">...</span>
             </div>
         )}
         <button
             onClick={handleSignOut}
             className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 flex-shrink-0 transition-colors duration-150"
             title="Sign Out" >
           <FaSignOutAlt size={18} />
         </button>
      </div>
    </div>
  );
}