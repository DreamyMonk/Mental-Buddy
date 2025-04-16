// src/context/AuthContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { FullScreenLoader } from '@/components/Loaders';

interface AuthContextProps {
  user: User | null;
  loading: boolean; // Initial auth state check
}

const AuthContext = createContext<AuthContextProps>({ user: null, loading: true });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("AuthContext: Listener setup.");
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      // console.log("AuthContext: State changed. User:", currentUser?.uid ?? 'null');
      setUser(currentUser);
      setLoading(false);
    });

    return () => {
        console.log("AuthContext: Listener cleanup.");
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

export const useAuth = (): AuthContextProps => useContext(AuthContext); // Added return type