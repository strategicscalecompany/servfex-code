import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, isFirebaseWebConfigured } from '../config/firebase';
import { User } from '../types';
import { apiClient } from '../api/client';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseWebConfigured()) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);

      if (!fbUser) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        const token = await fbUser.getIdToken();
        const res = await apiClient.get('/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data?.success && res.data?.data?.user) {
          const dbUser = res.data.data.user;

          if (dbUser.role === 'SUPER_ADMIN') {
            setUser(dbUser);
          } else {
            await signOut(auth);
            setUser(null);
            console.warn('Blocked non-Super Admin account from accessing Control Panel');
          }
        } else {
          setUser(null);
        }
      } catch (err: any) {
        const apiError = err?.response?.data?.error;
        console.warn('Failed to verify Super Admin status', apiError || err);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    if (!isFirebaseWebConfigured()) {
      throw new Error(
        'Firebase Web configuration is missing. Add VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, etc. to .env'
      );
    }

    // 1. Firebase handles identity & credentials
    const userCredential = await signInWithEmailAndPassword(auth, email, password);

    const token = await userCredential.user.getIdToken();
    const res = await apiClient.get('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.data?.success && res.data?.data?.user) {
      const dbUser = res.data.data.user;
      if (dbUser.role !== 'SUPER_ADMIN') {
        await signOut(auth);
        setUser(null);
        throw new Error('Access denied: Only SUPER_ADMIN accounts are authorized to access this Control Panel.');
      }
      setUser(dbUser);
      setFirebaseUser(userCredential.user);
    } else {
      await signOut(auth);
      setUser(null);
      throw new Error('User account not found in the ServFex database.');
    }
  };

  const loginWithGoogle = async () => {
    if (!isFirebaseWebConfigured()) {
      throw new Error(
        'Firebase Web configuration is missing. Add VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, etc. to .env'
      );
    }

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const userCredential = await signInWithPopup(auth, provider);

    const token = await userCredential.user.getIdToken();
    const res = await apiClient.get('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.data?.success && res.data?.data?.user) {
      const dbUser = res.data.data.user;
      if (dbUser.role !== 'SUPER_ADMIN') {
        await signOut(auth);
        setUser(null);
        throw new Error(
          `Access denied: Google account (${userCredential.user.email}) is not authorized as Super Admin.`
        );
      }
      setUser(dbUser);
      setFirebaseUser(userCredential.user);
    } else {
      await signOut(auth);
      setUser(null);
      throw new Error(
        `Access denied: Google account (${userCredential.user.email}) is not registered in the ServFex database.`
      );
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } finally {
      setUser(null);
      setFirebaseUser(null);
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        isAuthenticated: !!user && user.role === 'SUPER_ADMIN',
        isSuperAdmin: user?.role === 'SUPER_ADMIN',
        isLoading,
        login,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
