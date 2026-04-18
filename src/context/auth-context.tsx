
"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import {
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  User,
  getAuth,
  Auth,
} from "firebase/auth";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { app, db } from "@/lib/firebase";
import { firebaseConfig } from "@/lib/firebase";

export interface UserProfile {
    nickname: string;
    aiName: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  profileLoading: boolean;
  loginWithGoogle: () => void;
  logout: () => void;
  updateProfile: (profileData: UserProfile) => Promise<void>;
  isFirebaseEnabled: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const isFirebaseEnabled = !!(firebaseConfig && firebaseConfig.apiKey);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  
  const auth: Auth | null = isFirebaseEnabled ? getAuth(app) : null;

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      setProfileLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (!user) {
        setProfile(null);
        setProfileLoading(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    if (!user || !db) {
        setProfileLoading(false);
        return;
    }

    setProfileLoading(true);
    const profileDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(profileDocRef, (docSnap) => {
        if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
        } else {
            setProfile(null); // No profile exists yet
        }
        setProfileLoading(false);
    }, (error) => {
        console.error("Error fetching profile:", error);
        setProfile(null);
        setProfileLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const loginWithGoogle = () => {
    if (!auth) {
        console.error("Firebase is not configured. Cannot log in.");
        return;
    }
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider);
  };
  
  const logout = () => {
      auth?.signOut();
  };

  const updateProfile = useCallback(async (profileData: UserProfile) => {
      if (!user || !db) {
          throw new Error("User not authenticated or Firebase not configured.");
      }
      const profileDocRef = doc(db, 'users', user.uid);
      await setDoc(profileDocRef, profileData, { merge: true });
      setProfile(profileData); // Optimistic update
  }, [user]);

  const value = { user, profile, loading, profileLoading, loginWithGoogle, logout, updateProfile, isFirebaseEnabled };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
