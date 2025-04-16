// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import './globals.css';
import { UserProvider } from '@auth0/nextjs-auth0/client'; // Import Auth0 UserProvider
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' });
export const metadata: Metadata = { title: 'Mental Buddy - AI Companion', description: 'Your compassionate AI companion.' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`bg-gray-900 antialiased`}>
        <UserProvider> {/* Wrap with Auth0 Provider */}
           {children}
           <Toaster
             position="bottom-center"
             reverseOrder={false}
             toastOptions={{ /* ... Your Toast Options ... */
                style: { background: '#374151', color: '#fff', fontSize: '14px', },
                success: { duration: 3000, iconTheme: { primary: '#10B981', secondary: 'white' }, },
                error: { iconTheme: { primary: '#EF4444', secondary: 'white' }, },
             }}
            />
        </UserProvider>
      </body>
    </html>
  );
}