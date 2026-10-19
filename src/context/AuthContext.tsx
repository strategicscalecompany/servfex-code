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
        // Query PostgreSQL via backend to load ServFex user and verify SUPER_ADMIN authority
        const res = await apiClient.get('/auth/me');
        if (res.data?.success && res.data?.data?.user) {
          const pgUser = res.data.data.user;

          if (pgUser.role === 'SUPER_ADMIN') {
            setUser(pgUser);
          } else {
            // Non-Super Admin: sign out immediately
            await signOut(auth);
            setUser(null);
            console.warn('Blocked non-Super Admin account from accessing Control Panel');
          }
        } else {
          setUser(null);
        }
      } catch (err: any) {
        console.warn('Failed to verify Super Admin status in PostgreSQL', err);
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

    // 2. Fetch PostgreSQL record to verify Super Admin role authority
    const res = await apiClient.get('/auth/me');
    if (res.data?.success && res.data?.data?.user) {
      const pgUser = res.data.data.user;
      if (pgUser.role !== 'SUPER_ADMIN') {
        await signOut(auth);
        setUser(null);
        throw new Error('Access denied: Only SUPER_ADMIN accounts are authorized to access this Control Panel.');
      }
      setUser(pgUser);
      setFirebaseUser(userCredential.user);
    } else {
      await signOut(auth);
      setUser(null);
      throw new Error('User account not found in ServFex PostgreSQL database.');
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

    // Fetch PostgreSQL record to verify Super Admin authority
    const res = await apiClient.get('/auth/me');
    if (res.data?.success && res.data?.data?.user) {
      const pgUser = res.data.data.user;
      if (pgUser.role !== 'SUPER_ADMIN') {
        await signOut(auth);
        setUser(null);
        throw new Error(
          `Access denied: Google account (${userCredential.user.email}) is not authorized as Super Admin in PostgreSQL.`
        );
      }
      setUser(pgUser);
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
