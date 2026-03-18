
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { UserCheck, Loader2, Sparkles, CreditCard } from "lucide-react";

const COLLEGES = ["CCS", "CBA", "COE", "COED", "CAHS", "CAS", "CRIM", "CITHM"];

export default function CompleteProfile() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  
  const [program, setProgram] = useState("");
  const [college, setCollege] = useState("");
  const [isEmployee, setIsEmployee] = useState(false);
  const [employeeType, setEmployeeType] = useState("");
  const [rfid, setRfid] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
    if (!loading && profile?.program) {
      router.push("/dashboard");
    }
  }, [user, profile, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!program || !college) {
      toast({ title: "Registration Incomplete", description: "All mandatory academic fields must be finalized.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        program,
        college,
        isEmployee,
        employeeType: isEmployee ? employeeType : "",
        rfid: rfid || "",
      });
      toast({ title: "Profile Initialized", description: "Access granted to NEU VisitFlow." });
      router.push("/dashboard");
    } catch (error) {
      toast({ title: "Sync Failure", description: "Failed to finalize your digital identity.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#F5F6F8]">
      <Card className="w-full max-w-2xl border-none shadow-2xl bg-white rounded-[2.5rem] overflow-hidden animate-in zoom-in-95 duration-700">
        <CardHeader className="bg-primary text-white p-12 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12">
            <Sparkles size={160} />
          </div>
          <div className="flex items-center gap-6 relative z-10">
            <div className="bg-secondary p-5 rounded-3xl text-primary shadow-2xl transform -rotate-6 scale-110">
              <UserCheck size={40} />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-4xl font-black font-headline tracking-tighter uppercase leading-none">Identity Setup</CardTitle>
              <CardDescription className="text-white/70 font-bold text-lg uppercase tracking-widest">Finalize your university credentials</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-12 space-y-10">
          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <Label htmlFor="program" className="text-primary font-black uppercase tracking-widest text-[11px] ml-1">Academic Major / Program</Label>
                <Input 
                  id="program" 
                  placeholder="e.g. BS Computer Science" 
                  value={program} 
                  onChange={(e) => setProgram(e.target.value)}
                  className="h-16 border-2 border-primary/5 bg-[#F8FAFC] font-black text-xl rounded-2xl px-6 focus:border-secondary transition-all"
                  required
                />
              </div>

              <div className="space-y-4">
                <Label htmlFor="college" className="text-primary font-black uppercase tracking-widest text-[11px] ml-1">University College</Label>
                <Select onValueChange={setCollege} value={college}>
                  <SelectTrigger id="college" className="h-16 border-2 border-primary/5 bg-[#F8FAFC] font-black text-xl rounded-2xl px-6 focus:border-secondary transition-all">
                    <SelectValue placeholder="Select college..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl">
                    {COLLEGES.map((c) => (
                      <SelectItem key={c} value={c} className="font-black text-lg py-4 uppercase tracking-tighter">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <Label htmlFor="rfid" className="text-primary font-black uppercase tracking-widest text-[11px] ml-1 flex items-center gap-2">
                <CreditCard size={14} className="text-secondary" />
                RFID Identification (Optional)
              </Label>
              <Input 
                id="rfid" 
                placeholder="Scan or enter 10-digit RFID code" 
                value={rfid} 
                onChange={(e) => setRfid(e.target.value)}
                className="h-16 border-2 border-primary/5 bg-[#F8FAFC] font-black text-xl rounded-2xl px-6 focus:border-secondary transition-all"
              />
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em] ml-1">Enables rapid entry via automated scanning systems</p>
            </div>

            <div className="p-8 bg-[#F8FAFC] rounded-[2rem] border-2 border-primary/5 flex items-center justify-between shadow-inner">
              <div className="space-y-1">
                <Label className="text-xl font-black text-primary uppercase tracking-tighter">University Personnel</Label>
                <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest">Toggle for Faculty or Staff classification</p>
              </div>
              <Switch 
                checked={isEmployee} 
                onCheckedChange={setIsEmployee} 
                className="data-[state=checked]:bg-primary scale-125"
              />
            </div>

            {isEmployee && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-6 duration-500 bg-secondary/5 p-8 rounded-[2rem] border-2 border-secondary/20">
                <Label className="text-primary font-black uppercase tracking-widest text-[11px] ml-1">Professional Classification</Label>
                <Select onValueChange={setEmployeeType} value={employeeType}>
                  <SelectTrigger className="h-16 bg-white border-2 border-primary/5 font-black text-xl rounded-2xl px-6">
                    <SelectValue placeholder="Staff or Academic Faculty?" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl">
                    <SelectItem value="Teacher" className="font-black text-lg py-4 uppercase tracking-tighter">Teaching Faculty</SelectItem>
                    <SelectItem value="Staff" className="font-black text-lg py-4 uppercase tracking-tighter">Non-Teaching Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-24 text-2xl font-black bg-primary hover:bg-primary/95 shadow-2xl transition-all active:scale-[0.98] rounded-[1.5rem] uppercase tracking-tighter mt-4"
              disabled={submitting}
            >
              {submitting ? <Loader2 className="animate-spin mr-3 h-8 w-8" /> : null}
              {submitting ? "AUTHORIZING..." : "INITIALIZE PROTOCOL"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
