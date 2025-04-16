// src/components/ChatMessage.tsx
import React from 'react';
import {
    FaRegCopy, FaThumbsUp, FaThumbsDown, FaUserCircle, FaRobot,
    FaCheckCircle, FaTimesCircle // Icons for like/dislike emphasis
} from 'react-icons/fa';
import Image from 'next/image';
import { Message } from '@/types';

const defaultAvatarUrl = '/default-avatar.png';

interface ChatMessageProps {
  message: Message;
  onAction: (messageId: string, action: 'like' | 'dislike' | 'copy', text?: string | React.ReactNode) => void;
}

export default function ChatMessage({ message, onAction }: ChatMessageProps) {
  const isUser = message.sender === 'user';
  const textContent = typeof message.text === 'string' ? message.text : ''; // For copy action

  // Use current user's photo if available for user messages
  const userPhotoURL = isUser ? auth.currentUser?.photoURL : null; // Moved auth import if needed

  return (
    <div className={`flex items-start gap-3 w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
       {/* Avatar */}
        <div className="flex-shrink-0 mt-1 self-start"> {/* Align avatar top */}
            {isUser ? (
                 <Image
                    // Use dynamic photo URL from auth if available
                    src={userPhotoURL || defaultAvatarUrl}
                    alt="User Avatar"
                    width={30} // Slightly smaller avatar
                    height={30}
                    className="rounded-full border border-gray-600"
                    onError={(e) => { e.currentTarget.src = defaultAvatarUrl; }}
                 />
             ) : (
                 <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md flex-shrink-0">
                     <FaRobot className="text-white w-4 h-4" />
                 </div>
             )}
        </div>

      {/* Bubble Container */}
      <div className={`relative group max-w-[85%] sm:max-w-[75%] md:max-w-[70%] lg:max-w-[65%] ${isUser ? 'order-first mr-2' : 'ml-2'}`}>
        {/* Bubble */}
        <div className={`rounded-xl px-3.5 py-2 ${isUser ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'} shadow-md`}>
          {/* Message Text - Handle potential ReactNode like file links */}
          <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {message.text}
          </div>
        </div>

        {/* Action Buttons (Show on hover for AI messages, only if not secret chat) */}
        {!isUser && !activeChat?.isSecret && ( // Added check for activeChat secret status if passed down, otherwise assume normal
          <div className="absolute -bottom-3 right-1 flex items-center gap-1 bg-gray-800/80 backdrop-blur-sm border border-gray-600/60 rounded-full px-1.5 py-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150 shadow-lg z-10">
            <button
              onClick={() => onAction(message.id, 'copy', textContent)}
              className="p-1.5 rounded-full text-gray-400 hover:text-blue-300 hover:bg-gray-600/50 transition-colors"
              title="Copy text"
            >
              <FaRegCopy size={13} />
            </button>
            <button
              onClick={() => onAction(message.id, 'like')}
              className={`p-1.5 rounded-full hover:bg-gray-600/50 transition-colors ${
                message.reaction === 'like' ? 'text-green-500' : 'text-gray-400 hover:text-green-400'
              }`}
              title="Like response"
            >
               {/* Use solid icon when active */}
              {message.reaction === 'like' ? <FaCheckCircle size={13} /> : <FaThumbsUp size={13} />}
            </button>
            <button
              onClick={() => onAction(message.id, 'dislike')}
               className={`p-1.5 rounded-full hover:bg-gray-600/50 transition-colors ${
                message.reaction === 'dislike' ? 'text-red-500' : 'text-gray-400 hover:text-red-400'
              }`}
               title="Dislike response"
            >
              {message.reaction === 'dislike' ? <FaTimesCircle size={13} /> : <FaThumbsDown size={13} />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Note: You'll need to import 'auth' from firebase and potentially 'activeChat' prop if checking secret status here directly.
// It's better practice to disable actions via the handler in ChatArea based on secret status.
// For simplicity, the example above assumes the onAction handler in ChatArea handles the secret check.
import { auth } from '@/lib/firebase'; // Needs to be imported if using currentUser photo directly