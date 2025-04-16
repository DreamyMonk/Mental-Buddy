// src/app/login/page.tsx
'use client';

import React, { useEffect, useState } from 'react'; // Import React
import Image from 'next/image'; // Import next/image
import { GoogleAuthProvider, signInWithPopup, AuthError } from 'firebase/auth'; // Import AuthError
import { auth } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { FaGoogle } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { InlineLoader, FullScreenLoader } from '@/components/Loaders';

export default function LoginPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  const handleGoogleSignIn = async () => {
    if (isSigningIn) return;
    setIsSigningIn(true);
    const provider = new GoogleAuthProvider();
    const toastId = toast.loading('Connecting with Google...');

    try {
        await signInWithPopup(auth, provider);
        toast.success('Login successful! Taking you there...', { id: toastId });
        // Redirect handled by useEffect
    } catch (error: unknown) { // Use unknown
        console.error("Google Sign-In Error:", error);
        let errorMessage = 'Failed to sign in. Please try again.';

        // Check if it's an AuthError with a code property
        if (error instanceof Error && 'code' in error) {
             const code = (error as AuthError).code; // Type assertion to AuthError
             if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
                errorMessage = 'Sign-in cancelled.';
                toast.dismiss(toastId);
                toast(errorMessage, { icon: 'ℹ️' });
            } else if (code === 'auth/account-exists-with-different-credential') {
                 errorMessage = 'An account already exists with this email using a different sign-in method.';
                 toast.error(errorMessage, { id: toastId, duration: 5000 });
            } else {
                 toast.error(errorMessage, { id: toastId });
            }
        } else {
             // Handle generic error
             toast.error(errorMessage, { id: toastId });
        }
    } finally {
       setIsSigningIn(false);
    }
  };

  if (authLoading) {
    return <FullScreenLoader />;
  }
  if (user) {
    return null; // Redirecting
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-gradient-to-br from-[#0a0f1a] via-[#111827] to-[#1a2336] text-white p-6 overflow-hidden">
        <div className="w-full max-w-lg text-center flex flex-col items-center z-10">
            {/* Use next/image */}
            <Image
                src="/logo-placeholder.svg"
                alt="Mental Buddy Logo"
                width={112} // w-28
                height={112} // h-28
                className="mb-8 opacity-90 filter drop-shadow-lg"
                priority // Prioritize loading logo
            />
            <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400">
                Mental Buddy
            </h1>
            <p className="text-lg sm:text-xl text-gray-300/90 mb-12 font-light max-w-md">
                Your safe space to reflect, understand, and grow. Securely sign in.
            </p>
            <button
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
              className={`group relative w-full max-w-xs bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white font-semibold text-lg py-3 px-8 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 ease-in-out shadow-xl hover:shadow-blue-500/40 focus:outline-none focus:ring-4 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-60 disabled:cursor-wait transform hover:-translate-y-1`}
            >
              <span className="absolute inset-0 overflow-hidden rounded-xl">
                 <span className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.3)_0%,rgba(255,255,255,0)_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></span>
              </span>
              <span className="relative z-10 flex items-center justify-center gap-3">
                 {isSigningIn ? <InlineLoader size="sm" color="white"/> : <FaGoogle className="w-5 h-5"/>}
                 <span>{isSigningIn ? 'Connecting...' : 'Sign in with Google'}</span>
              </span>
            </button>
        </div>
        <p className="absolute bottom-6 text-xs text-gray-500/80 text-center w-full px-6">
            Your privacy matters. Secret chats are never stored.
        </p>
    </div>
  );
}