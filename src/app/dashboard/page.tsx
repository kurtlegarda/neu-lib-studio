
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { PlusCircle, Search, History, User, Clock, CalendarIcon, Loader2, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { REASONS } from "@/lib/constants";

export default function Dashboard() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  const [visits, setVisits] = useState<any[]>([]);
  const [loadingVisits, setLoadingVisits] = useState(true);
  const [searchReason, setSearchReason] = useState("");
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  
  const [reason, setReason] = useState("");
  const [otherReason, setOtherReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/");
    if (!loading && profile && !profile.program) router.push("/complete-profile");
  }, [user, profile, loading, router]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "visits"),
      where("uid", "==", user.uid),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const visitData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      }));
      setVisits(visitData);
      setLoadingVisits(false);
    }, (error) => {
      console.error("Visits fetch error:", error);
      toast({ 
        title: "Sync Error", 
        description: "Failed to load activity history. Check console for index requirements.", 
        variant: "destructive" 
      });
      setLoadingVisits(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!reason || (reason === "Other" && !otherReason)) {
      toast({ title: "Validation Error", description: "Please specify your reason for visiting.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const visitDate = format(new Date(), "yyyy-MM-dd");
      await addDoc(collection(db, "visits"), {
        uid: profile.uid,
        displayName: profile.displayName,
        email: profile.email,
        program: profile.program,
        college: profile.college,
        isEmployee: profile.isEmployee || false,
        employeeType: profile.employeeType || "",
        reason: reason === "Other" ? otherReason : reason,
        timestamp: serverTimestamp(),
        date: visitDate,
      });
      
      toast({ title: "Log Entry Success!", description: "Your library visit has been officially recorded." });
      setIsLogModalOpen(false);
      setReason("");
      setOtherReason("");
    } catch (error) {
      console.error("Log Visit error:", error);
      toast({ title: "System Error", description: "Encountered a problem recording your log.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredVisits = visits.filter(v => 
    v.reason?.toLowerCase().includes(searchReason.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-primary font-bold animate-pulse">Establishing Secure Session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F6F8] pb-12">
      <Navbar />
      
      <main className="flex-1 p-4 md:p-10 max-w-7xl mx-auto w-full space-y-10 animate-in fade-in duration-700">
        <Card className="border-none shadow-2xl overflow-hidden bg-white rounded-[2rem]">
          <CardContent className="p-10 md:p-14">
            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="relative group">
                <Avatar className="h-40 w-40 border-8 border-white shadow-2xl ring-4 ring-primary/5 transition-transform group-hover:scale-105 duration-500">
                  <AvatarImage src={profile?.photoURL} />
                  <AvatarFallback className="text-5xl font-black bg-primary text-secondary">
                    {profile?.displayName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-3 -right-3 bg-secondary text-primary rounded-2xl p-4 shadow-2xl border-4 border-white transform transition-transform group-hover:rotate-12">
                  <Sparkles size={24} className="font-bold" />
                </div>
              </div>
              
              <div className="text-center md:text-left space-y-6">
                <div className="space-y-1">
                  <h1 className="text-5xl font-black text-primary font-headline tracking-tighter uppercase leading-none">
                    Welcome to the <br className="hidden md:block"/> NEU Library, <br className="hidden md:block"/> {profile?.displayName?.split(' ')[0]}!
                  </h1>
                  <p className="text-xl font-bold text-muted-foreground uppercase tracking-widest opacity-60">Personal Access Registry</p>
                </div>
                
                <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-2">
                  <Badge className="px-5 py-2 bg-primary/5 border-2 border-primary/10 text-primary font-black uppercase text-xs tracking-widest rounded-xl">
                    {profile?.program}
                  </Badge>
                  <Badge className="px-5 py-2 bg-secondary/10 border-2 border-secondary/30 text-primary font-black uppercase text-xs tracking-widest rounded-xl">
                    {profile?.college}
                  </Badge>
                </div>
              </div>

              <div className="md:ml-auto">
                <Dialog open={isLogModalOpen} onOpenChange={setIsLogModalOpen}>
                  <DialogTrigger asChild>
                    <Button className="h-24 px-12 text-2xl font-black bg-primary hover:bg-primary/95 text-white shadow-2xl transition-all duration-300 gap-4 group rounded-[1.5rem] uppercase tracking-tighter">
                      <PlusCircle size={36} className="group-hover:rotate-90 transition-transform duration-500" />
                      Record New Visit
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[480px] rounded-[2rem] border-none shadow-2xl p-8">
                    <DialogHeader className="space-y-4">
                      <div className="w-16 h-16 bg-secondary text-primary rounded-2xl flex items-center justify-center shadow-lg">
                        <History size={32} />
                      </div>
                      <div>
                        <DialogTitle className="text-3xl font-black text-primary font-headline uppercase tracking-tight">New Entry</DialogTitle>
                        <DialogDescription className="text-lg font-bold text-muted-foreground">
                          State your primary objective for today.
                        </DialogDescription>
                      </div>
                    </DialogHeader>
                    <form onSubmit={handleLogVisit} className="space-y-8 py-6">
                      <div className="space-y-4">
                        <Label htmlFor="reason" className="text-primary font-black uppercase tracking-widest text-xs ml-1">Purpose</Label>
                        <Select onValueChange={setReason} value={reason}>
                          <SelectTrigger id="reason" className="h-16 border-2 border-primary/5 bg-[#F8FAFC] font-black text-xl rounded-2xl px-6">
                            <SelectValue placeholder="Select purpose..." />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-none shadow-2xl">
                            {REASONS.map(r => (
                              <SelectItem key={r} value={r} className="font-black text-lg py-4 uppercase tracking-tighter">{r}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {reason === "Other" && (
                        <div className="space-y-4 animate-in slide-in-from-top-4 duration-500">
                          <Label htmlFor="otherReason" className="text-primary font-black uppercase tracking-widest text-xs ml-1">Details</Label>
                          <Input 
                            id="otherReason" 
                            placeholder="Enter specific reason..." 
                            className="h-16 border-2 border-primary/5 bg-[#F8FAFC] font-black text-xl rounded-2xl px-6"
                            value={otherReason} 
                            onChange={(e) => setOtherReason(e.target.value)}
                            required
                          />
                        </div>
                      )}
                      <DialogFooter className="pt-4">
                        <Button type="submit" className="w-full h-20 bg-primary text-2xl font-black shadow-2xl rounded-[1.25rem] uppercase tracking-tighter" disabled={isSubmitting}>
                          {isSubmitting ? "TRANSMITTING..." : "CONFIRM LOG"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-primary rounded-2xl text-secondary shadow-xl transform -rotate-3">
                <History size={32} />
              </div>
              <div>
                <h2 className="text-3xl font-black text-primary font-headline uppercase tracking-tighter">My Activity History</h2>
                <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">Total Logs: {visits.length}</p>
              </div>
            </div>
            <div className="relative w-full md:w-[400px] group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-primary/40 h-6 w-6" />
              <Input 
                className="pl-14 h-16 border-none shadow-xl bg-white rounded-2xl font-bold text-lg focus:ring-4 focus:ring-secondary/30 transition-all" 
                placeholder="Search logs..." 
                value={searchReason}
                onChange={(e) => setSearchReason(e.target.value)}
              />
            </div>
          </div>

          <Card className="shadow-2xl border-none overflow-hidden bg-white/60 backdrop-blur-xl rounded-[2.5rem]">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-primary/5">
                  <TableRow className="hover:bg-transparent border-primary/10">
                    <TableHead className="w-64 text-primary font-black uppercase text-xs tracking-widest h-16 px-10">Calendar Date</TableHead>
                    <TableHead className="w-64 text-primary font-black uppercase text-xs tracking-widest px-10">Entry Time</TableHead>
                    <TableHead className="text-primary font-black uppercase text-xs tracking-widest px-10">Objective</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingVisits ? (
                    Array(3).fill(0).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={3} className="py-12 px-10"><div className="h-10 bg-muted animate-pulse rounded-2xl"></div></TableCell>
                      </TableRow>
                    ))
                  ) : filteredVisits.length > 0 ? (
                    filteredVisits.map((visit) => (
                      <TableRow key={visit.id} className="hover:bg-primary/5 border-primary/5">
                        <TableCell className="font-black text-primary py-8 px-10 text-lg tracking-tight">
                          {visit.timestamp ? format(visit.timestamp, "MMMM dd, yyyy") : visit.date}
                        </TableCell>
                        <TableCell className="text-muted-foreground font-black px-10 text-base uppercase tracking-widest">
                          {visit.timestamp ? format(visit.timestamp, "hh:mm aa") : "--:--"}
                        </TableCell>
                        <TableCell className="px-10">
                          <Badge variant="outline" className="font-black bg-white text-primary border-2 border-primary/10 px-6 py-2 uppercase text-xs tracking-widest rounded-xl">
                            {visit.reason}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-40">
                        <p className="text-2xl font-black text-primary uppercase tracking-tighter">No History Records</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
