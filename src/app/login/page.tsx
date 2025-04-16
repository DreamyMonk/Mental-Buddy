// src/app/login/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
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
    } catch (error: any) {
        console.error("Google Sign-In Error:", error);
        let errorMessage = 'Failed to sign in. Please try again.';
        // Add specific error handling as before...
        if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
            errorMessage = 'Sign-in cancelled.';
            toast.dismiss(toastId);
            toast(errorMessage, { icon: 'ℹ️' });
        } else {
            toast.error(errorMessage, { id: toastId });
        }
    } finally {
       setIsSigningIn(false);
    }
  };

  if (authLoading) {
    return <FullScreenLoader />; // Show loader during initial auth check
  }
  if (user) {
    return null; // Redirecting
  }

  // Render the landing/login UI
  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-gradient-to-br from-[#0a0f1a] via-[#111827] to-[#1a2336] text-white p-6 overflow-hidden">

        {/* Main Content Area */}
        <div className="w-full max-w-lg text-center flex flex-col items-center z-10">

            <img
                src="/logo-placeholder.svg" // Make sure this path is correct
                alt="Mental Buddy Logo"
                className="w-24 h-24 sm:w-28 sm:h-28 mb-8 opacity-90 filter drop-shadow-lg" // Increased size slightly
            />

            <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400">
                Mental Buddy
            </h1>

            <p className="text-lg sm:text-xl text-gray-300/90 mb-12 font-light max-w-md">
                Your safe space to reflect, understand, and grow. Securely sign in.
            </p>

            {/* Google Sign-in Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
              // Refined button styles with subtle animation
              className={`group relative w-full max-w-xs bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white font-semibold text-lg py-3 px-8 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 ease-in-out shadow-xl hover:shadow-blue-500/40 focus:outline-none focus:ring-4 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-60 disabled:cursor-wait transform hover:-translate-y-1`}
            >
               {/* Button background animation on hover (optional) */}
               {/* <span className="absolute inset-0 bg-white/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span> */}

              <span className="relative z-10 flex items-center justify-center gap-3">
                 {isSigningIn ? (
                    <InlineLoader size="sm" color="white"/>
                 ) : (
                    <FaGoogle className="w-5 h-5"/>
                 )}
                 <span>{isSigningIn ? 'Connecting...' : 'Sign in with Google'}</span>
              </span>
            </button>

        </div>

        {/* Footer Text */}
        <p className="absolute bottom-6 text-xs text-gray-500/80 text-center w-full px-6">
            Your privacy matters. Secret chats are never stored.
        </p>

         {/* Optional: Subtle background elements */}
        {/* <div className="absolute top-0 left-0 w-1/3 h-1/3 bg-gradient-to-br from-blue-900/20 to-transparent rounded-full filter blur-3xl opacity-30 -translate-x-1/4 -translate-y-1/4"></div>
        <div className="absolute bottom-0 right-0 w-1/4 h-1/4 bg-gradient-to-tl from-purple-900/20 to-transparent rounded-full filter blur-3xl opacity-30 translate-x-1/4 translate-y-1/4"></div> */}

    </div>
  );
}