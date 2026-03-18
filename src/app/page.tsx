
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LogIn, Loader2, Library, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function Home() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    // Only redirect if the profile is fully loaded and we have a user
    if (!loading && user && profile) {
      router.push("/log-visit");
    }
  }, [user, profile, loading, router]);

  const handleSignIn = async () => {
    setSigningIn(true);
    try {
      // Force account selection to avoid automatic "closes" without user seeing the window
      googleProvider.setCustomParameters({
        prompt: 'select_account'
      });
      await signInWithPopup(auth, googleProvider);
      toast({
        title: "Sign-in Success",
        description: "Welcome to the NEU VisitFlow system.",
      });
    } catch (error: any) {
      console.error("Sign in failed", error);
      let message = "An unexpected error occurred during sign-in.";
      
      if (error.code === 'auth/popup-closed-by-user') {
        message = "The sign-in window was closed before completion.";
      } else if (error.code === 'auth/unauthorized-domain') {
        message = "This domain is not authorized. Please add it to Firebase Console.";
      } else if (error.code === 'auth/operation-not-allowed') {
        message = "Google Sign-in is not enabled in Firebase Console.";
      }

      toast({
        title: "Sign-in Error",
        description: message,
        variant: "destructive",
      });
      setSigningIn(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-primary font-bold animate-pulse">Initializing NEU VisitFlow...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F5F6F8]">
      <div className="absolute inset-0 z-0 opacity-5 pointer-events-none overflow-hidden">
        <div className="grid grid-cols-6 gap-20 transform -rotate-12 translate-y-20">
          {Array.from({ length: 48 }).map((_, i) => (
            <Library key={i} size={80} className="text-primary" />
          ))}
        </div>
      </div>

      <Card className="w-full max-w-md shadow-2xl border-none overflow-hidden relative z-10 bg-white">
        <div className="h-2 bg-secondary w-full"></div>
        <CardHeader className="text-center space-y-6 pt-12 pb-8">
          <div className="mx-auto w-28 h-28 bg-primary text-secondary rounded-[2rem] flex items-center justify-center shadow-2xl transform transition-transform hover:scale-105 duration-500">
            <span className="text-4xl font-black tracking-tighter font-headline">NEU</span>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-black tracking-tight text-primary font-headline uppercase">VisitFlow</CardTitle>
            <CardDescription className="text-lg font-bold text-muted-foreground uppercase tracking-widest">Library Visitor Log</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pb-12 px-8">
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <p className="text-primary/70 font-medium leading-relaxed">
                Official digital tracking system for the New Era University Library facilities.
              </p>
            </div>
            
            <Button 
              onClick={handleSignIn} 
              disabled={signingIn}
              className="w-full h-16 text-lg font-black bg-primary hover:bg-primary/95 text-white flex gap-4 shadow-xl transition-all active:scale-[0.98] rounded-xl group"
            >
              {signingIn ? <Loader2 className="animate-spin" /> : <LogIn size={22} className="group-hover:translate-x-1 transition-transform" />}
              {signingIn ? "Signing In..." : "Sign in with Google"}
            </Button>

            <div className="flex flex-col items-center gap-3 pt-4">
              <div className="h-1 w-12 bg-secondary rounded-full"></div>
              <span className="text-[11px] text-primary/40 uppercase tracking-[0.3em] font-black">Unity • Excellence • Service</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
