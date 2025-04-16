// src/components/Loaders.tsx
import React from 'react';

export const FullScreenLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
    {/* Enhanced spinner */}
    <div className="relative flex items-center justify-center w-20 h-20">
        <div className="absolute w-full h-full border-4 border-gray-700 rounded-full"></div>
        <div className="absolute w-full h-full border-t-4 border-blue-500 rounded-full animate-spin"></div>
    </div>
  </div>
);

export const InlineLoader = ({ size = 'sm', color = 'white' }: { size?: 'sm' | 'md' | 'lg', color?: 'white' | 'blue' }) => {
    const sizeClasses = {
        sm: 'h-4 w-4 border-2',
        md: 'h-6 w-6 border-2',
        lg: 'h-8 w-8 border-3',
    };
    const colorClasses = {
        white: 'border-white',
        blue: 'border-blue-500',
    }
    return (
        <div className={`animate-spin rounded-full border-b-transparent ${sizeClasses[size]} ${colorClasses[color]}`}></div>
    );
};