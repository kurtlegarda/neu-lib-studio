
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LogIn, Loader2, Library, ShieldAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export default function Home() {
  const { user, profile, loading, error: authError } = useAuth();
  const router = useRouter();
  const [signingIn, setSigningIn] = useState(false);
  const logo = PlaceHolderImages.find(img => img.id === "neu-logo");

  // Handle successful, unblocked redirects
  useEffect(() => {
    if (!loading && user && profile && !authError) {
      setSigningIn(false);
      if (profile.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/log-visit");
      }
    }
  }, [user, profile, loading, authError, router]);

  // UI state management: Stop spinner on terminal states
  useEffect(() => {
    if (!loading) {
      // Stop spinner if signed out or error occurs
      if (!user || authError) {
        setSigningIn(false);
      }
      // Safety: If signed in but no profile exists (shouldn't happen), stop spinner
      if (user && !profile && !signingIn) {
        setSigningIn(false);
      }
    }
  }, [loading, user, authError, profile, signingIn]);

  const handleSignIn = async () => {
    setSigningIn(true);
    try {
      googleProvider.setCustomParameters({
        prompt: 'select_account'
      });
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Sign in failed", error);
      let message = "An unexpected error occurred during sign-in.";
      
      if (error.code === 'auth/popup-closed-by-user') {
        message = "The sign-in window was closed before completion.";
      }

      toast({
        title: "Sign-in Error",
        description: message,
        variant: "destructive",
      });
      setSigningIn(false);
    }
  };

  if (loading && !signingIn) {
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

      <Card className="w-full max-w-md shadow-2xl border-none overflow-hidden relative z-10 bg-white rounded-[2.5rem]">
        <div className="h-2 bg-secondary w-full"></div>
        <CardHeader className="text-center space-y-6 pt-12 pb-8">
          <div className="mx-auto w-32 h-32 relative rounded-[2.5rem] overflow-hidden shadow-2xl transform transition-transform hover:scale-105 duration-500 border-4 border-white">
            {logo ? (
              <Image 
                src={logo.imageUrl} 
                alt="NEU Logo" 
                fill 
                className="object-cover"
                data-ai-hint="university logo"
              />
            ) : (
              <div className="w-full h-full bg-primary flex items-center justify-center">
                <span className="text-4xl font-black tracking-tighter text-white">NEU</span>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-black tracking-tight text-primary font-headline uppercase">VisitFlow</CardTitle>
            <CardDescription className="text-lg font-bold text-muted-foreground uppercase tracking-widest">Library Visitor Log</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pb-12 px-8">
          <div className="space-y-8">
            {authError && (
              <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive animate-in slide-in-from-top-2 duration-300 rounded-2xl p-6">
                <ShieldAlert className="h-5 w-5" />
                <AlertTitle className="font-black uppercase tracking-widest text-xs mb-2">Access Denied</AlertTitle>
                <AlertDescription className="font-bold text-sm">
                  {authError}
                </AlertDescription>
              </Alert>
            )}

            <div className="text-center space-y-2">
              <p className="text-primary/70 font-medium leading-relaxed">
                Official digital tracking system for the New Era University Library facilities.
              </p>
            </div>
            
            <Button 
              onClick={handleSignIn} 
              disabled={signingIn}
              className="w-full h-16 text-lg font-black bg-primary hover:bg-primary/95 text-white flex gap-4 shadow-xl transition-all active:scale-[0.98] rounded-2xl group"
            >
              {signingIn ? <Loader2 className="animate-spin" /> : <LogIn size={22} className="group-hover:translate-x-1 transition-transform" />}
              {signingIn ? "Verifying Identity..." : "Sign in with Google"}
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
