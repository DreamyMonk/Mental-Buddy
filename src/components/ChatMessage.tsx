// src/components/ChatMessage.tsx
import React from 'react';
import Image from 'next/image'; // Import Image
import {
    FaRegCopy, FaThumbsUp, FaThumbsDown, FaUserCircle, FaRobot,
    FaCheckCircle, FaTimesCircle
} from 'react-icons/fa';
import { Message } from '@/types';
import { auth } from '@/lib/firebase';

const defaultAvatarUrl = '/default-avatar.png';

interface ChatMessageProps {
  message: Message;
  onAction: (messageId: string, action: 'like' | 'dislike' | 'copy', text?: string | React.ReactNode) => void;
  isSecretChat?: boolean;
}

export default function ChatMessage({ message, onAction, isSecretChat = false }: ChatMessageProps) {
  const isUser = message.sender === 'user';
  const textContent = typeof message.text === 'string' ? message.text : '';
  const currentUser = auth.currentUser;
  const userPhotoURL = isUser ? (currentUser?.photoURL || defaultAvatarUrl) : null;

  return (
    <div className={`flex items-start gap-2.5 w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
        <div className="flex-shrink-0 mt-1 self-start">
            {isUser ? (
                 // Use next/image for user avatar
                 <Image
                    src={userPhotoURL || defaultAvatarUrl}
                    alt="User Avatar"
                    width={30}
                    height={30}
                    className="rounded-full border border-gray-600/50 shadow-sm"
                    onError={(e) => { (e.target as HTMLImageElement).src = defaultAvatarUrl; }}
                 />
             ) : (
                 <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md flex-shrink-0">
                     <FaRobot className="text-indigo-100 w-4 h-4" />
                 </div>
             )}
        </div>

      <div className={`relative group max-w-[80%] sm:max-w-[70%] md:max-w-[65%] lg:max-w-[60%] ${isUser ? 'order-first mr-1.5' : 'ml-1.5'}`}>
        <div className={`rounded-xl px-3.5 py-2 ${isUser ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-gray-700 text-gray-200 rounded-bl-sm'} shadow-md`}>
          <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.text}</div>
        </div>
        {!isUser && !isSecretChat && (
          <div className="absolute bottom-[-18px] left-0 flex items-center gap-1 bg-gray-800/80 backdrop-blur-sm border border-gray-600/60 rounded-full px-1.5 py-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150 shadow-lg z-10">
             <button onClick={() => onAction(message.id, 'copy', textContent)} className="p-1.5 rounded-full text-gray-400 hover:text-blue-300 hover:bg-gray-600/50 transition-colors" title="Copy">
              <FaRegCopy size={13} />
            </button>
             <button onClick={() => onAction(message.id, 'like')} className={`p-1.5 rounded-full hover:bg-gray-600/50 transition-colors ${ message.reaction === 'like' ? 'text-green-500' : 'text-gray-400 hover:text-green-400' }`} title="Like">
              {message.reaction === 'like' ? <FaCheckCircle size={13} /> : <FaThumbsUp size={12} />}
            </button>
            <button onClick={() => onAction(message.id, 'dislike')} className={`p-1.5 rounded-full hover:bg-gray-600/50 transition-colors ${ message.reaction === 'dislike' ? 'text-red-500' : 'text-gray-400 hover:text-red-400' }`} title="Dislike">
              {message.reaction === 'dislike' ? <FaTimesCircle size={13} /> : <FaThumbsDown size={12} />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}