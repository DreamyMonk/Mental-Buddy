'use client';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/navigation';
import { FaSignInAlt } from 'react-icons/fa';
import { FullScreenLoader } from '@/components/Loaders';

export default function LoginPage() {
  const { user, error, isLoading } = useUser();
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && user) {
      console.log('Login Page: User logged in via Auth0, redirecting...');
      router.push('/'); // Redirect to main app page
    }
    if (!isLoading && error) {
      console.error('Auth0 user hook error on login page:', error);
      setErrorMessage('Failed to authenticate. Please try again or contact support.');
      // Optional: Force logout if state is broken
      // router.push('/api/auth/logout');
    }
  }, [user, isLoading, error, router]);

  if (isLoading) {
    return <FullScreenLoader />;
  }

  if (user) {
    return null; // Redirecting
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-gradient-to-br from-[#0a0f1a] via-[#111827] to-[#1a2336] text-white p-6 overflow-hidden">
      <div className="w-full max-w-lg text-center flex flex-col items-center z-10">
        <Image
          src="/logo-placeholder.svg"
          alt="Mental Buddy Logo"
          width={112}
          height={112}
          className="mb-8 opacity-90 filter drop-shadow-lg"
          priority
          onError={() => console.error('Failed to load logo')}
        />
        <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400">
          Mental Buddy
        </h1>
        <p className="text-lg sm:text-xl text-gray-300/90 mb-12 font-light max-w-md">
          Your safe space to reflect, understand, and grow.
        </p>
        {errorMessage && (
          <p className="text-red-400 mb-4 text-sm">{errorMessage}</p>
        )}
        <a
          href="/api/auth/login"
          role="button"
          aria-label="Sign in or sign up"
          className="group relative w-full max-w-xs bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white font-semibold text-lg py-3 px-8 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 ease-in-out shadow-xl hover:shadow-blue-500/40 focus:outline-none focus:ring-4 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-gray-900 transform hover:-translate-y-1"
        >
          <span className="absolute inset-0 overflow-hidden rounded-xl">
            <span className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.3)_0%,rgba(255,255,255,0)_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></span>
          </span>
          <span className="relative z-10 flex items-center justify-center gap-3">
            <FaSignInAlt className="w-5 h-5" />
            <span>Sign In / Sign Up</span>
          </span>
        </a>
      </div>
      <p className="absolute bottom-6 text-xs text-gray-500/80 text-center w-full px-6">
        Your privacy matters. Secret chats are never stored persistently.
      </p>
    </div>
  );
}