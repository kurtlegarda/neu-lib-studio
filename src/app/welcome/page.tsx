
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Library, CheckCircle2, ArrowRight, Heart } from "lucide-react";

export default function WelcomePage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-[#F5F6F8] flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-2xl border-none shadow-2xl bg-white rounded-[3rem] overflow-hidden text-center animate-in zoom-in-95 duration-700">
          <CardContent className="p-16 space-y-10">
            <div className="relative inline-block">
              <div className="w-32 h-32 bg-green-100 text-green-600 rounded-[2.5rem] flex items-center justify-center shadow-xl">
                <CheckCircle2 size={64} />
              </div>
              <div className="absolute -top-4 -right-4 bg-secondary text-primary p-3 rounded-2xl shadow-lg animate-bounce">
                <Heart size={24} />
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="text-6xl font-black text-primary font-headline tracking-tighter uppercase leading-none">
                Welcome to <br/> NEU Library!
              </h1>
              <p className="text-xl font-bold text-muted-foreground uppercase tracking-[0.2em] opacity-60">
                Your visit has been recorded successfully
              </p>
            </div>

            <div className="p-8 bg-[#F8FAFC] rounded-[2rem] border-2 border-primary/5 space-y-2">
              <p className="text-primary font-black text-2xl uppercase tracking-tighter">
                {profile?.displayName}
              </p>
              <p className="text-muted-foreground font-bold uppercase tracking-widest text-sm">
                {profile?.program} • {profile?.college}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button 
                onClick={() => router.push("/dashboard")}
                className="h-16 px-10 bg-primary text-white font-black rounded-xl text-lg shadow-xl gap-3 transition-all hover:scale-105"
              >
                Go to Dashboard
                <ArrowRight size={20} />
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push("/")}
                className="h-16 px-10 border-2 border-primary text-primary font-black rounded-xl text-lg shadow-xl transition-all hover:bg-primary/5"
              >
                Log Out
              </Button>
            </div>

            <div className="flex items-center justify-center gap-4 pt-4 opacity-20">
              <Library size={24} className="text-primary" />
              <div className="h-1 w-12 bg-primary rounded-full" />
              <Library size={24} className="text-primary" />
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
