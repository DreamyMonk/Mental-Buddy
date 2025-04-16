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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Ensure no extra spaces or newlines around the <html> tag itself
    <html lang="en" className={inter.variable}>
      {/*
        NOTE: The <head> tag is largely managed by Next.js Metadata.
        Do NOT manually add a <head> tag here unless you have a specific reason
        and understand the implications with Next.js Metadata handling.
      */}
      {/* Ensure no extra spaces or newlines BEFORE the <body> tag */}
      <body className={`bg-gray-900 antialiased`}>
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
                  iconTheme: {
                    primary: '#10B981', // green-500
                    secondary: 'white',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#EF4444', // red-500
                    secondary: 'white',
                  },
                },
             }}
            />
        </AuthProvider>
      </body>
      {/* Ensure no extra spaces or newlines AFTER the <body> tag */}
    </html>
  );
}