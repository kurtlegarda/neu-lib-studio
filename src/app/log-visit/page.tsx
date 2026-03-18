
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Loader2, Library, Sparkles } from "lucide-react";
import { format } from "date-fns";

const COLLEGES = [
  { id: "CCS", name: "College of Computer Studies", programs: ["BSCS", "BSIT", "BSIS"] },
  { id: "CBA", name: "College of Business Administration", programs: ["BSA", "BSBA-FM", "BSBA-MM"] },
  { id: "COE", name: "College of Engineering", programs: ["BSCE", "BSEE", "BSME"] },
  { id: "COED", name: "College of Education", programs: ["BEED", "BSED-Eng", "BSED-Math"] },
  { id: "CAHS", name: "College of Allied Health Sciences", programs: ["BSN", "BSP"] },
  { id: "CAS", name: "College of Arts and Sciences", programs: ["AB-Comm", "AB-Psych"] },
  { id: "CRIM", name: "College of Criminology", programs: ["BS-Crim"] },
  { id: "CITHM", name: "College of International Tourism and Hospitality Management", programs: ["BSHM", "BSTM"] },
];

const REASONS = ["Reading", "Researching", "Use of Computer", "Meeting", "Borrowing Books", "Other"];

export default function LogVisitPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  const [collegeId, setCollegeId] = useState("");
  const [program, setProgram] = useState("");
  const [reason, setReason] = useState("");
  const [otherReason, setOtherReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
    if (!loading && profile) {
      setCollegeId(profile.college || "");
      setProgram(profile.program || "");
    }
  }, [user, profile, loading, router]);

  const selectedCollege = COLLEGES.find((c) => c.id === collegeId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    if (!collegeId || !program || !reason || (reason === "Other" && !otherReason)) {
      toast({ title: "Validation Error", description: "Please fill out all required fields.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const visitDate = format(new Date(), "yyyy-MM-dd");
      
      // Update profile if college/program changed or was missing
      if (profile.college !== collegeId || profile.program !== program) {
        await updateDoc(doc(db, "users", profile.uid), {
          college: collegeId,
          program: program,
        });
      }

      // Record the visit
      await addDoc(collection(db, "visits"), {
        uid: profile.uid,
        displayName: profile.displayName,
        email: profile.email,
        program: program,
        college: collegeId,
        isEmployee: profile.isEmployee || false,
        employeeType: profile.employeeType || "",
        reason: reason === "Other" ? otherReason : reason,
        timestamp: serverTimestamp(),
        date: visitDate,
      });
      
      router.push("/welcome");
    } catch (error) {
      console.error(error);
      toast({ title: "System Error", description: "Encountered a problem recording your log.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F6F8] pb-12">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-12">
        <Card className="border-none shadow-2xl bg-white rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-primary text-white p-10 space-y-4">
            <div className="flex items-center gap-4">
              <div className="bg-secondary p-4 rounded-2xl text-primary shadow-lg">
                <Library size={32} />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-3xl font-black font-headline uppercase tracking-tighter">Library Visit Log</CardTitle>
                <CardDescription className="text-white/70 font-bold uppercase tracking-widest text-sm">Welcome to NEU Library Visitor Registry</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-10">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-primary font-black uppercase text-xs tracking-widest ml-1">Your College</Label>
                  <Select onValueChange={(val) => { setCollegeId(val); setProgram(""); }} value={collegeId}>
                    <SelectTrigger className="h-14 border-2 border-primary/5 bg-[#F8FAFC] font-bold text-lg rounded-xl">
                      <SelectValue placeholder="Select College" />
                    </SelectTrigger>
                    <SelectContent>
                      {COLLEGES.map((c) => (
                        <SelectItem key={c.id} value={c.id} className="font-bold py-3 uppercase">{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-primary font-black uppercase text-xs tracking-widest ml-1">Academic Program</Label>
                  <Select onValueChange={setProgram} value={program} disabled={!collegeId}>
                    <SelectTrigger className="h-14 border-2 border-primary/5 bg-[#F8FAFC] font-bold text-lg rounded-xl">
                      <SelectValue placeholder="Select Program" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedCollege?.programs.map((p) => (
                        <SelectItem key={p} value={p} className="font-bold py-3 uppercase">{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-primary font-black uppercase text-xs tracking-widest ml-1">Reason for Visit</Label>
                <Select onValueChange={setReason} value={reason}>
                  <SelectTrigger className="h-14 border-2 border-primary/5 bg-[#F8FAFC] font-bold text-lg rounded-xl">
                    <SelectValue placeholder="What is your primary objective?" />
                  </SelectTrigger>
                  <SelectContent>
                    {REASONS.map((r) => (
                      <SelectItem key={r} value={r} className="font-bold py-3 uppercase">{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {reason === "Other" && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-4">
                  <Label className="text-primary font-black uppercase text-xs tracking-widest ml-1">Please Specify</Label>
                  <Input 
                    placeholder="Enter your specific reason..." 
                    className="h-14 border-2 border-primary/5 bg-[#F8FAFC] font-bold text-lg rounded-xl px-6"
                    value={otherReason}
                    onChange={(e) => setOtherReason(e.target.value)}
                  />
                </div>
              )}

              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full h-20 bg-primary hover:bg-primary/95 text-white text-2xl font-black rounded-2xl shadow-2xl transition-all active:scale-[0.98] uppercase tracking-tighter gap-3 mt-6"
              >
                {isSubmitting ? <Loader2 className="animate-spin w-8 h-8" /> : <Sparkles className="w-6 h-6 text-secondary" />}
                {isSubmitting ? "Processing..." : "Submit Entry"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
