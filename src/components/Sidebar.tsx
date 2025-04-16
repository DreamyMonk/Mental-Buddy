// src/components/Sidebar.tsx
import React from 'react';
import {
  FaPlus, FaLock, FaUnlock, FaSignOutAlt, FaTimes, FaComments, FaUserCircle
} from 'react-icons/fa';
import { Chat } from '@/types';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import toast from 'react-hot-toast';
import { InlineLoader } from './Loaders';
import { formatTimestamp } from '@/lib/utils'; // Import formatter

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
      // AuthProvider handles redirect
    } catch (error) {
      console.error("Sign Out Error:", error);
      toast.error('Failed to sign out.', { id: toastId });
    }
  };

  return (
    <div className={`fixed inset-y-0 left-0 z-30 w-72 bg-gray-800 border-r border-gray-700/60 text-gray-300 flex flex-col h-screen p-3 transition-transform duration-300 ease-in-out md:relative md:translate-x-0 shadow-lg ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>

       {/* Header */}
       <div className="flex items-center justify-between mb-4 pt-1 pb-2 border-b border-gray-700/50 px-1">
         <span className="font-semibold text-xl flex items-center gap-2">
            <img src="/logo-placeholder.svg" alt="Logo" className="w-6 h-6 opacity-90"/> {/* Logo */}
            Mental Buddy
         </span>
         <button onClick={onToggleSidebar} className="p-2 rounded text-gray-400 hover:text-white hover:bg-gray-700 md:hidden">
             <FaTimes size={18}/>
         </button>
      </div>

      {/* Action Buttons */}
       <div className="px-1 mb-4 flex items-center gap-2">
            <button
                onClick={onNewChat}
                className="flex-grow flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-3 rounded-lg transition-colors duration-150 shadow-sm text-sm"
                title="New Chat"
            >
                <FaPlus size={14} />
                New Chat
            </button>
            <button
                onClick={onToggleSecretMode}
                className={`p-2 rounded-lg hover:bg-gray-700 border border-gray-600 ${isSecretMode ? 'text-yellow-400 bg-gray-700/50' : 'text-gray-400 hover:text-yellow-300'}`}
                title={isSecretMode ? "Disable Secret Mode" : "Enable Secret Mode"}
            >
                {isSecretMode ? <FaLock size={16} /> : <FaUnlock size={16} />}
            </button>
       </div>


      {/* Chat History List */}
      <div className="flex-grow overflow-y-auto pr-1 custom-scrollbar mb-2">
        {isLoading && (
          <div className="flex justify-center items-center h-40">
             <InlineLoader size="md" />
          </div>
        )}
        {!isLoading && chats.length === 0 && (
             <div className="text-center px-3 py-6 text-gray-500">
                 <FaComments className="mx-auto h-10 w-10 mb-3 opacity-50"/>
                 <p className="text-sm">Your chats will appear here.</p>
                 <p className="text-xs mt-1">Start a new conversation!</p>
             </div>
        )}
        {!isLoading && chats.length > 0 && (
             <ul className="space-y-1">
              {chats.map((chat) => (
                <li key={chat.id}>
                  <button
                    onClick={() => onSelectChat(chat.id)}
                    className={`w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors duration-150 group ${
                      chat.id === activeChatId ? 'bg-gray-700 font-medium text-white shadow-inner' : 'text-gray-300 hover:bg-gray-700/50'
                    }`}
                  >
                    {chat.isSecret
                        ? <FaLock size={12} className="flex-shrink-0 text-yellow-500/80" title="Secret Chat"/>
                        : <FaComments size={13} className={`flex-shrink-0 ${chat.id === activeChatId ? 'text-blue-300' : 'text-gray-500 group-hover:text-gray-300'}`} />
                    }
                    <span className="flex-grow truncate">{chat.title || 'Chat'}</span>
                    <span className={`text-xs flex-shrink-0 transition-colors ${chat.id === activeChatId ? 'text-gray-400' : 'text-gray-500 group-hover:text-gray-400'}`}>
                        {formatTimestamp(chat.lastUpdatedAt)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
        )}
      </div>

      {/* Bottom Section: User Info & Sign Out */}
      <div className="mt-auto border-t border-gray-700/50 pt-3 px-1 flex items-center justify-between gap-2">
         {auth.currentUser && (
             <div className="flex items-center gap-2 truncate flex-grow min-w-0">
                <img
                    src={auth.currentUser.photoURL || '/default-avatar.png'}
                    alt="User"
                    className="w-8 h-8 rounded-full border-2 border-gray-600 flex-shrink-0"
                    onError={(e) => { e.currentTarget.src = '/default-avatar.png'; }}
                />
                <span className="text-sm font-medium truncate text-gray-200">{auth.currentUser.displayName || 'User'}</span>
             </div>
         )}
         {!auth.currentUser && ( // Placeholder if user data isn't loaded yet
             <div className="flex items-center gap-2 truncate flex-grow min-w-0 text-gray-500">
                <FaUserCircle className="w-8 h-8"/>
                <span className="text-sm">Loading...</span>
             </div>
         )}
         <button
             onClick={handleSignOut}
             className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-gray-700/50 flex-shrink-0 transition-colors duration-150"
             title="Sign Out"
         >
           <FaSignOutAlt size={18} />
         </button>
      </div>
    </div>
  );
}