// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from 'react-hot-toast';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Mental Buddy - AI Companion',
  description: 'Your compassionate AI companion for mental well-being support.',
  // Add more metadata as needed (icons, etc.)
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`bg-gray-900 antialiased`}> {/* Base styles applied via globals.css */}
        <AuthProvider>
           {children}
           <Toaster
             position="bottom-center"
             reverseOrder={false}
             toastOptions={{
                className: '',
                duration: 4000,
                style: {
                  background: '#374151', // gray-700
                  color: '#fff',
                  fontSize: '14px',
                },
                success: {
                  duration: 3000,
                  iconTheme: { primary: '#10B981', secondary: 'white' },
                },
                error: {
                  iconTheme: { primary: '#EF4444', secondary: 'white' },
                },
             }}
            />
        </AuthProvider>
      </body>
    </html>
  );
}