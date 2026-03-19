
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { useAuth as useFirebaseAuth, useFirestore } from "@/firebase/provider";
import { useRouter } from "next/navigation";

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: "user" | "admin";
  isBlocked: boolean;
  program?: string;
  college?: string;
  isEmployee?: boolean;
  employeeType?: string;
  rfid?: string;
  createdAt: any;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  role: "user" | "admin" | null;
  error: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  role: null,
  error: null,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const auth = useFirebaseAuth();
  const db = useFirestore();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;

    const unsubscribeAuth = auth.onAuthStateChanged(async (firebaseUser) => {
      // Clear previous profile subscription
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }

      if (firebaseUser) {
        setUser(firebaseUser);
        setError(null);
        
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          
          // Initial check/creation
          const userDoc = await getDoc(userDocRef);
          if (!userDoc.exists()) {
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              displayName: firebaseUser.displayName || "",
              photoURL: firebaseUser.photoURL || "",
              role: "user",
              isBlocked: false,
              createdAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, newProfile);
            setProfile(newProfile);
          }

          // Real-time subscription
          unsubProfile = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
              const profileData = docSnap.data() as UserProfile;
              
              if (profileData.isBlocked) {
                setError("ACCESS RESTRICTED: Your account has been suspended from the library system. Please contact an administrator.");
                setProfile(null);
                signOut(auth);
                setUser(null);
              } else {
                setProfile(profileData);
                setError(null);
              }
            }
            setLoading(false);
          }, (err) => {
            console.error("Profile subscription error:", err);
            setError("Failed to sync your profile data.");
            setLoading(false);
          });

        } catch (err) {
          console.error("Auth initialization failed:", err);
          setError("Failed to initialize your session.");
          setLoading(false);
        }
      } else {
        setUser(null);
        setProfile(null);
        setError(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubProfile) unsubProfile();
    };
  }, [auth, db]);

  return (
    <AuthContext.Provider value={{ user, profile, loading, role: profile?.role || null, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
