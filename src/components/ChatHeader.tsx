// src/components/ChatHeader.tsx
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
// Removed FaEllipsisV
import { FaShareSquare, FaLock, FaBars } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { auth } from '@/lib/firebase';

interface ChatHeaderProps {
    chatTitle: string;
    isSecret: boolean;
    onToggleSidebar: () => void;
}

export default function ChatHeader({ chatTitle, isSecret, onToggleSidebar }: ChatHeaderProps) {
  const [shareText, setShareText] = useState('Share');
  const currentUser = auth.currentUser;

  const handleShare = async () => {
    try {
      const urlToShare = window.location.href;
      await navigator.clipboard.writeText(urlToShare);
      toast.success('Link copied (Chat content not included)');
      setShareText('Copied!');
      setTimeout(() => setShareText('Share'), 2000);
    } catch (err: unknown) { // Use err or remove variable name
        console.error("Share error:", err); // Log the error
        toast.error('Failed to copy link.');
        setShareText('Failed');
        setTimeout(() => setShareText('Share'), 2000);
    }
  };

  // ... rest of the component ...
  return (
      <div className="flex justify-between items-center px-4 py-2 h-16 flex-shrink-0 border-b border-gray-700/40 bg-gray-800/80 backdrop-blur-md sticky top-0 z-20">
          {/* ... left side ... */}
          <div className="flex items-center gap-3 flex-grow min-w-0">
             <button onClick={onToggleSidebar} className="p-2 -ml-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700/60 md:hidden"> <FaBars size={20}/> </button>
             <div className="flex items-center gap-2 min-w-0">
                <span className="text-base md:text-lg font-medium truncate text-gray-100" title={chatTitle || 'Chat'}>{chatTitle || 'Chat'}</span>
                {isSecret && <FaLock size={13} className="text-yellow-400 flex-shrink-0" title="Secret Chat" />}
             </div>
          </div>
          {/* ... right side ... */}
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            <button onClick={handleShare} className="hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border border-gray-600/70 text-gray-300 hover:bg-gray-700/60 hover:border-gray-500 transition-colors duration-150 min-w-[75px] justify-center" >
              <FaShareSquare size={13} /> {shareText}
            </button>
            {currentUser && ( <Image src={currentUser.photoURL || '/default-avatar.png'} alt="User Profile" width={34} height={34} className="rounded-full border-2 border-gray-600/80 hover:border-blue-500/50 cursor-pointer transition-colors duration-150" onError={(e) => { (e.target as HTMLImageElement).src = '/default-avatar.png'; }} title={currentUser.displayName || 'User Profile'} /> )}
          </div>
      </div>
  );
}