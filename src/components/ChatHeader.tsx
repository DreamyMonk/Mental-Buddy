// src/components/ChatHeader.tsx
'use client';

import React, { useState } from 'react';
import { FaShareSquare, FaEllipsisV, FaLock, FaBars } from 'react-icons/fa';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { auth } from '@/lib/firebase'; // Import auth to get user photo

interface ChatHeaderProps {
    chatTitle: string;
    isSecret: boolean;
    onToggleSidebar: () => void;
}

export default function ChatHeader({ chatTitle, isSecret, onToggleSidebar }: ChatHeaderProps) {
  const [shareText, setShareText] = useState('Share');
  const userPhotoURL = auth.currentUser?.photoURL; // Get current user's photo

  const handleShare = async () => {
    // Basic URL sharing - consider more advanced sharing later
    try {
      const urlToShare = window.location.href; // May not be ideal if URL doesn't represent chat state
      await navigator.clipboard.writeText(urlToShare);
      toast.success('Link copied (Chat content not included)');
      setShareText('Copied!');
      setTimeout(() => setShareText('Share'), 2000);
    } catch (err) {
      toast.error('Failed to copy link.');
      setShareText('Failed');
      setTimeout(() => setShareText('Share'), 2000);
    }
  };

  return (
    <div className="flex justify-between items-center px-4 py-2 h-16 flex-shrink-0 border-b border-gray-700/50 bg-gray-800/70 backdrop-blur-sm sticky top-0 z-20">
      {/* Left: Hamburger (Mobile) + Title + Secret Indicator */}
      <div className="flex items-center gap-3 flex-grow min-w-0">
         <button onClick={onToggleSidebar} className="p-2 -ml-2 rounded text-gray-400 hover:text-white hover:bg-gray-700 md:hidden">
             <FaBars size={20}/>
         </button>
         <div className="flex items-center gap-2 min-w-0">
            <span className="text-lg font-semibold truncate text-gray-100" title={chatTitle || 'Chat'}>
                {chatTitle || 'Chat'}
            </span>
            {isSecret && <FaLock size={14} className="text-yellow-400 flex-shrink-0" title="Secret Chat (History not saved)" />}
         </div>
      </div>


      {/* Right: Actions & Profile */}
      <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
        <button
            onClick={handleShare}
            className="hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500 transition-colors duration-150 min-w-[80px] justify-center"
        >
          <FaShareSquare size={13} />
          {shareText}
        </button>
        {/* <button className="p-2 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white">
          <FaEllipsisV size={16} />
        </button> */}
        <Image
            src={userPhotoURL || '/default-avatar.png'}
            alt="User Profile"
            width={34}
            height={34}
            className="rounded-full border-2 border-gray-600 hover:opacity-90 cursor-pointer shadow-sm"
            onError={(e) => { e.currentTarget.src = '/default-avatar.png'; }}
            title={auth.currentUser?.displayName || 'User Profile'}
        />
      </div>
    </div>
  );
}