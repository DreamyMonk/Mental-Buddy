// src/context/AuthContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { FullScreenLoader } from '@/components/Loaders'; // Ensure this path is correct

interface AuthContextProps {
  user: User | null;
  loading: boolean; // Indicates initial auth state check
}

const AuthContext = createContext<AuthContextProps>({ user: null, loading: true });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Start as true

  useEffect(() => {
    console.log("AuthContext: Setting up listener...");
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("AuthContext: State changed. User:", currentUser?.uid ?? 'null');
      setUser(currentUser);
      setLoading(false); // Done with initial check
    });

    return () => {
        console.log("AuthContext: Cleaning up listener.");
        unsubscribe();
    }
  }, []);

  if (loading) {
      return <FullScreenLoader />;
  }

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);