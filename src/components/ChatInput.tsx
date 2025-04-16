// src/components/ChatInput.tsx
import React, { useState, useRef, useEffect } from 'react';
import { FaPaperclip, FaArrowUp } from 'react-icons/fa';
import toast from 'react-hot-toast';

interface ChatInputProps {
  onSendMessage: (message: string, file?: File) => void;
  isLoading: boolean;
}

export default function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // fileInputRef removed as it was unused

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(event.target.value); // Event is used
  };

  const handleSend = () => {
    const textToSend = message.trim();
    if (textToSend && !isLoading) {
        onSendMessage(textToSend); // onSendMessage is used
        setMessage('');
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
    } else if (isLoading) {
        toast('Please wait...', { icon: '⏳' });
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault(); // Event is used
        handleSend();
    }
  };

  const handleAttachClick = () => { toast.error("Attachments currently disabled."); };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 120;
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, [message]);

  return (
    <div className="px-4 pb-4 pt-3 bg-gray-800/90 backdrop-blur-sm border-t border-gray-700/40 sticky bottom-0 z-10 flex-shrink-0">
      <div className="max-w-4xl mx-auto bg-gray-700/60 rounded-xl p-2 flex items-end gap-2 border border-gray-600/70 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/60 transition-all duration-200 shadow-md">
        {/* Attach button remains disabled */}
        <button onClick={handleAttachClick} className="p-2.5 rounded-lg flex-shrink-0 text-gray-500 cursor-not-allowed hover:bg-gray-600/30" disabled={true} title="Attach file (Disabled)">
          <FaPaperclip size={18} />
        </button>
        <textarea
          ref={textareaRef} rows={1} placeholder="Share your thoughts..." value={message} onChange={handleInputChange} onKeyDown={handleKeyDown} disabled={isLoading}
          className={`flex-grow bg-transparent border-none outline-none resize-none text-gray-100 placeholder-gray-400/70 text-sm max-h-[120px] overflow-y-auto custom-scrollbar pr-2 ${isLoading ? 'cursor-wait opacity-70' : ''}`}
          style={{ lineHeight: '1.65' }}
        />
        <button onClick={handleSend} disabled={isLoading || !message.trim()}
          className={`p-2 rounded-lg flex-shrink-0 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-gray-700 ${ message.trim() && !isLoading ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-400 hover:to-blue-500 shadow-md focus:ring-blue-400' : 'bg-gray-600/50 text-gray-400 cursor-not-allowed' }`}
          title="Send Message">
          <FaArrowUp size={16} />
        </button>
      </div>
      <p className="text-xs text-gray-500/80 text-center mt-2.5 px-4">
         AI responses may not be perfect. Seek professional advice for serious concerns.
      </p>
    </div>
  );
}