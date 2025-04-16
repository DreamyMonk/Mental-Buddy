// src/app/login/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { FaGoogle } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { InlineLoader, FullScreenLoader } from '@/components/Loaders'; // Import FullScreenLoader too

export default function LoginPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      console.log("Login Page: User detected, redirecting to /");
      router.push('/');
    }
  }, [user, authLoading, router]);

  const handleGoogleSignIn = async () => {
    if (isSigningIn) return;
    setIsSigningIn(true);
    const provider = new GoogleAuthProvider();
    // Optional: Add specific Google scopes if needed later
    // provider.addScope('https://www.googleapis.com/auth/contacts.readonly');
    const toastId = toast.loading('Connecting with Google...');

    try {
        await signInWithPopup(auth, provider);
        toast.success('Login successful! Redirecting...', { id: toastId });
        // Redirect is handled by useEffect based on user state change
    } catch (error: any) {
        console.error("Google Sign-In Error:", error);
        let errorMessage = 'Failed to sign in. Please try again.';
        if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
            errorMessage = 'Sign-in process cancelled.';
            toast.dismiss(toastId); // Dismiss loading if cancelled
            toast(errorMessage, { icon: 'ℹ️' });
        } else if (error.code === 'auth/account-exists-with-different-credential') {
             errorMessage = 'An account already exists with this email using a different sign-in method.';
             toast.error(errorMessage, { id: toastId, duration: 5000 }); // Longer duration for this error
        }
        else {
            toast.error(errorMessage, { id: toastId });
        }
    } finally {
       setIsSigningIn(false);
    }
  };

  // Use FullScreenLoader during the initial auth check for a smoother transition
  if (authLoading) {
    return <FullScreenLoader />;
  }

  // If user exists after check, redirect is happening via useEffect. Render null.
  if (user) {
    return null;
  }

  // Render the login form
  return (
    // Enhanced background with a subtle gradient and possibly a pattern (CSS or library needed for pattern)
    <div className="flex items-center justify-center min-h-screen w-full bg-gradient-to-br from-gray-900 via-[#101827] to-black text-white p-4 sm:p-6 overflow-hidden">
        {/* Optional: Add subtle background shapes/elements using absolute positioning if desired */}

        {/* Login Card with Glassmorphism effect */}
        <div className="relative bg-gray-800/60 backdrop-blur-xl border border-gray-700/40 p-8 sm:p-10 rounded-2xl shadow-2xl w-full max-w-md text-center overflow-hidden">
            {/* Optional: Decorative gradient blob */}
            {/* <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-gradient-to-br from-blue-600/30 to-purple-600/30 rounded-full filter blur-3xl opacity-50"></div> */}

            <img
                src="/logo-placeholder.svg" // Ensure this logo exists
                alt="Mental Buddy Logo"
                className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-5 opacity-90 filter drop-shadow-lg"
            />
            <h1 className="text-2xl sm:text-3xl font-semibold mb-2 text-gray-100">
                Welcome to Mental Buddy
            </h1>
            <p className="text-gray-400 mb-8 sm:mb-10 text-sm sm:text-base">
                Sign in securely to continue
            </p>

            {/* Enhanced Google Sign-in Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
              className={`group relative w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-medium py-3 px-6 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 ease-in-out shadow-lg hover:shadow-blue-500/30 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-70 disabled:cursor-wait`}
            >
              {/* Subtle shine effect on hover */}
              <span className="absolute inset-0 overflow-hidden rounded-xl">
                 <span className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.3)_0%,rgba(255,255,255,0)_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></span>
              </span>

              <span className="relative z-10 flex items-center justify-center gap-3">
                 {isSigningIn ? (
                    <InlineLoader size="sm" color="white"/>
                 ) : (
                    <FaGoogle className="w-5 h-5"/>
                 )}
                 <span className="text-base">{isSigningIn ? 'Processing...' : 'Sign in with Google'}</span>
              </span>
            </button>

            {/* Optional: Add links for terms/privacy or other sign-in methods */}
            <p className="text-xs text-gray-500/80 mt-8 sm:mt-10">
                By signing in, you agree to our terms.
                <br/>Your privacy is important to us.
            </p>
        </div>
    </div>
  );
}