
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
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  role: null,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const auth = useFirebaseAuth();
  const db = useFirestore();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        
        const userDocRef = doc(db, "users", firebaseUser.uid);
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
          setLoading(false);
          // Only redirect if we are on the home page
          if (pathname === "/") {
            router.push("/log-visit");
          }
        } else {
          const data = userDoc.data() as UserProfile;
          if (data.isBlocked) {
            await signOut(auth);
            toast({
              title: "Access Denied",
              description: "You are not allowed to use the library. Please contact the administrator.",
              variant: "destructive",
            });
            setUser(null);
            setProfile(null);
            setLoading(false);
          } else {
            setProfile(data);
            setLoading(false);
            
            const unsubProfile = onSnapshot(userDocRef, (docSnap) => {
              if (docSnap.exists()) {
                const updatedData = docSnap.data() as UserProfile;
                setProfile(updatedData);
                if (updatedData.isBlocked) {
                  signOut(auth);
                }
              }
            });

            // If user is on landing page and logged in, send them to log visit
            if (pathname === "/") {
              router.push("/log-visit");
            }

            return () => unsubProfile();
          }
        }
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, [auth, db, pathname, router]);

  return (
    <AuthContext.Provider value={{ user, profile, loading, role: profile?.role || null }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
