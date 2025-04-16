// src/components/ChatInput.tsx
import React, { useState, useRef, useEffect } from 'react';
import { FaPaperclip, FaArrowUp } from 'react-icons/fa';
import toast from 'react-hot-toast'; // Import toast

interface ChatInputProps {
  onSendMessage: (message: string, file?: File) => void;
  isLoading: boolean;
}

export default function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // Keep ref if re-enabling upload

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(event.target.value);
  };

  const handleSend = () => {
    const textToSend = message.trim();
    if (textToSend && !isLoading) {
        onSendMessage(textToSend); // Pass only text for now
        setMessage(''); // Clear input
        // Reset textarea height after sending
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    } else if (isLoading) {
        toast('Please wait for the previous response.', { icon: '⏳' });
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
    // Allow Shift+Enter for new lines handled by default textarea behavior
  };

  const handleAttachClick = () => {
    // fileInputRef.current?.click(); // Trigger hidden input
    toast.error("Attachment feature is currently disabled."); // Notify user
  };

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // Reset height first
      const scrollHeight = textareaRef.current.scrollHeight;
      // Set max height (e.g., ~6 lines)
      const maxHeight = 120; // Adjust as needed (pixels)
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, [message]);

  return (
    <div className="px-4 pb-3 pt-3 bg-gray-800 border-t border-gray-700/50 sticky bottom-0 z-10 flex-shrink-0">
      {/* Main Input Area */}
      <div className="max-w-3xl mx-auto bg-gray-700/70 rounded-xl p-2 flex items-end gap-2 border border-gray-600/80 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/50 transition-all duration-200 shadow-sm">
        {/* Attach Button - Disabled state styling */}
        <button
            onClick={handleAttachClick}
            className="p-2.5 rounded-lg flex-shrink-0 text-gray-500 cursor-not-allowed" // Disabled appearance
            disabled={true} // Functionally disabled
            title="Attach file (Disabled)"
        >
          <FaPaperclip size={18} />
        </button>
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          rows={1}
          placeholder="Type your message here..." // Updated placeholder
          value={message}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={isLoading} // Disable textarea while AI is thinking
          className={`flex-grow bg-transparent border-none outline-none resize-none text-gray-100 placeholder-gray-400/80 text-sm max-h-[120px] overflow-y-auto custom-scrollbar pr-2 ${isLoading ? 'cursor-wait' : ''}`}
          style={{ lineHeight: '1.6' }}
        />
        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={isLoading || !message.trim()} // Disable if loading or no text
          className={`p-2.5 rounded-lg flex-shrink-0 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-700 ${
            message.trim() && !isLoading
              ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-md focus:ring-blue-500'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
          title="Send Message"
        >
          <FaArrowUp size={16} />
        </button>
      </div>
      {/* Disclaimer */}
      <p className="text-xs text-gray-500 text-center mt-2 px-4">
         Mental Buddy is an AI. Responses may not be perfect. Please seek professional help for serious concerns.
      </p>
    </div>
  );
}