
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { useAuth as useFirebaseAuth, useFirestore } from "@/firebase/provider";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "@/hooks/use-toast";

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
  const router = useRouter();

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        setError(null);
        
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);

          let currentProfile: UserProfile;

          if (!userDoc.exists()) {
            currentProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              displayName: firebaseUser.displayName || "",
              photoURL: firebaseUser.photoURL || "",
              role: "user",
              isBlocked: false,
              createdAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, currentProfile);
          } else {
            currentProfile = userDoc.data() as UserProfile;
          }

          if (currentProfile.isBlocked) {
            setError("ACCESS RESTRICTED: Your account has been suspended from the library system. Please contact an administrator.");
            await signOut(auth);
            setUser(null);
            setProfile(null);
          } else {
            setProfile(currentProfile);
            
            const unsubProfile = onSnapshot(userDocRef, (docSnap) => {
              if (docSnap.exists()) {
                const updatedData = docSnap.data() as UserProfile;
                setProfile(updatedData);
                if (updatedData.isBlocked) {
                  setError("Your access has been revoked by an administrator.");
                  signOut(auth);
                }
              }
            });

            return () => unsubProfile();
          }
        } catch (err) {
          console.error("Profile sync failed:", err);
          setError("Failed to initialize your session. Please try again.");
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, [auth, db]);

  return (
    <AuthContext.Provider value={{ user, profile, loading, role: profile?.role || null, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
