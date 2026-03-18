
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { collection, query, orderBy, onSnapshot, doc, getDocs, where, serverTimestamp, addDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell 
} from "recharts";
import { 
  Users, UserCheck, FileText, Search, Download, Shield, ShieldAlert, 
  TrendingUp, Calendar as CalendarIcon, UserPlus, Zap, Sparkles, Loader2, Filter, 
  PieChart, Activity
} from "lucide-react";
import { format, startOfDay, startOfWeek, startOfMonth, subDays, isSameDay } from "date-fns";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { adminVisitTrendSummary } from "@/ai/flows/admin-visit-trend-summary-flow";
import { adminOtherReasonAnalysis } from "@/ai/flows/admin-other-reason-analysis";

const COLLEGES = ["All", "CCS", "CBA", "COE", "COED", "CAHS", "CAS", "CRIM", "CITHM"];
const REASONS = ["All", "Reading", "Researching", "Use of Computer", "Meeting", "Borrowing Books", "Other"];

export default function AdminDashboard() {
  const { user, profile, loading, role } = useAuth();
  const router = useRouter();

  const [visits, setVisits] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Filters State
  const [reasonFilter, setReasonFilter] = useState("All");
  const [collegeFilter, setCollegeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [globalSearch, setGlobalSearch] = useState("");
  const [dateRangeMode, setDateRangeMode] = useState("This Month");

  // Quick Log State
  const [quickSearch, setQuickSearch] = useState("");
  const [foundUser, setFoundUser] = useState<any>(null);
  const [quickReason, setQuickReason] = useState("");

  // AI Analysis State
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<any[] | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);

  useEffect(() => {
    if (!loading && (!user || role !== "admin")) {
      router.push("/dashboard");
    }
  }, [user, role, loading, router]);

  useEffect(() => {
    if (role !== "admin") return;

    const unsubscribeVisits = onSnapshot(query(collection(db, "visits"), orderBy("timestamp", "desc")), (snapshot) => {
      setVisits(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoadingData(false);
    });

    const unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribeVisits();
      unsubscribeUsers();
    };
  }, [role]);

  const stats = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);
    const week = startOfWeek(now);
    const month = startOfMonth(now);

    return {
      today: visits.filter(v => v.timestamp?.toDate() >= today).length,
      week: visits.filter(v => v.timestamp?.toDate() >= week).length,
      month: visits.filter(v => v.timestamp?.toDate() >= month).length,
      allTime: visits.length,
    };
  }, [visits]);

  const chartData = useMemo(() => {
    const days = 7;
    const data = Array.from({ length: days }, (_, i) => {
      const d = subDays(new Date(), days - 1 - i);
      return {
        name: format(d, "MMM dd"),
        date: d,
        count: 0
      };
    });

    visits.forEach(v => {
      const vDate = v.timestamp?.toDate();
      if (!vDate) return;
      const day = data.find(d => isSameDay(d.date, vDate));
      if (day) day.count++;
    });

    return data;
  }, [visits]);

  const filteredVisits = useMemo(() => {
    return visits.filter(v => {
      const matchesReason = reasonFilter === "All" || v.reason === reasonFilter;
      const matchesCollege = collegeFilter === "All" || v.college === collegeFilter;
      const matchesStatus = statusFilter === "All" || 
        (statusFilter === "Employee" && v.isEmployee) || 
        (statusFilter === "Student" && !v.isEmployee);
      
      const searchTerm = globalSearch.toLowerCase();
      const matchesSearch = !globalSearch || 
        v.displayName?.toLowerCase().includes(searchTerm) ||
        v.program?.toLowerCase().includes(searchTerm) ||
        v.reason?.toLowerCase().includes(searchTerm) ||
        v.email?.toLowerCase().includes(searchTerm);
      
      let matchesDate = true;
      const now = new Date();
      if (dateRangeMode === "Today") matchesDate = v.timestamp?.toDate() >= startOfDay(now);
      else if (dateRangeMode === "This Week") matchesDate = v.timestamp?.toDate() >= startOfWeek(now);
      else if (dateRangeMode === "This Month") matchesDate = v.timestamp?.toDate() >= startOfMonth(now);

      return matchesReason && matchesCollege && matchesStatus && matchesSearch && matchesDate;
    });
  }, [visits, reasonFilter, collegeFilter, statusFilter, globalSearch, dateRangeMode]);

  const handleToggleBlock = async (uid: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, "users", uid), { isBlocked: !currentStatus });
      toast({ title: "Update Success", description: `User access has been ${currentStatus ? 'restored' : 'revoked'}.` });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update user security status.", variant: "destructive" });
    }
  };

  const handleToggleRole = async (uid: string, currentRole: string) => {
    try {
      await updateDoc(doc(db, "users", uid), { role: currentRole === "admin" ? "user" : "admin" });
      toast({ title: "Authority Updated", description: `Privileges changed to ${currentRole === "admin" ? 'User' : 'Admin'}.` });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update authority level.", variant: "destructive" });
    }
  };

  const handleQuickSearch = async () => {
    if (!quickSearch) return;
    setFoundUser(null);
    const usersRef = collection(db, "users");
    
    // Check Email
    let q = query(usersRef, where("email", "==", quickSearch));
    let snap = await getDocs(q);
    
    // Check RFID if email not found
    if (snap.empty) {
      q = query(usersRef, where("rfid", "==", quickSearch));
      snap = await getDocs(q);
    }

    if (!snap.empty) {
      setFoundUser({ id: snap.docs[0].id, ...snap.docs[0].data() });
    } else {
      toast({ title: "Identity Error", description: "No record found for the provided Email/RFID.", variant: "destructive" });
    }
  };

  const handleQuickLog = async () => {
    if (!foundUser || !quickReason) return;
    try {
      await addDoc(collection(db, "visits"), {
        uid: foundUser.uid,
        displayName: foundUser.displayName,
        email: foundUser.email,
        program: foundUser.program || "N/A",
        college: foundUser.college || "N/A",
        isEmployee: foundUser.isEmployee || false,
        employeeType: foundUser.employeeType || "",
        reason: quickReason,
        timestamp: serverTimestamp(),
        date: format(new Date(), "yyyy-MM-dd"),
      });
      toast({ title: "Log Created", description: "Visit registered successfully for " + foundUser.displayName });
      setFoundUser(null);
      setQuickSearch("");
      setQuickReason("");
    } catch (error) {
      toast({ title: "Error", description: "Failed to record log entry.", variant: "destructive" });
    }
  };

  const handleGenerateSummary = async () => {
    if (filteredVisits.length === 0) {
      toast({ title: "Insufficient Data", description: "Requires at least one record to analyze.", variant: "destructive" });
      return;
    }
    setIsGeneratingSummary(true);
    try {
      const input = {
        visits: filteredVisits.map(v => ({
          timestamp: v.timestamp?.toDate()?.toISOString() || new Date().toISOString(),
          reason: v.reason,
          college: v.college,
          program: v.program,
          isEmployee: v.isEmployee,
          employeeType: v.employeeType
        })),
        dateRange: {
          startDate: format(startOfMonth(new Date()), "yyyy-MM-dd"),
          endDate: format(new Date(), "yyyy-MM-dd"),
        }
      };
      const result = await adminVisitTrendSummary(input);
      setAiSummary(result.summary);
    } catch (error) {
      toast({ title: "Analysis Failure", description: "GenAI failed to process the current data stream.", variant: "destructive" });
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleAnalyzeOtherReasons = async () => {
    const otherReasons = visits
      .filter(v => !["Reading", "Researching", "Use of Computer", "Meeting", "Borrowing Books"].includes(v.reason))
      .map(v => v.reason);

    if (otherReasons.length === 0) {
      toast({ title: "No Qualitative Data", description: "No custom reasons found for thematic analysis.", variant: "destructive" });
      return;
    }

    setIsGeneratingAnalysis(true);
    try {
      const result = await adminOtherReasonAnalysis({ otherReasons });
      setAiAnalysis(result.analysis);
    } catch (error) {
      toast({ title: "Analysis Failure", description: "Thematic categorization failed.", variant: "destructive" });
    } finally {
      setIsGeneratingAnalysis(false);
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(26, 35, 126);
    doc.text("NEU VISITFLOW REPORT", 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Official Library Traffic Audit • Generated: ${format(new Date(), "PPPpp")}`, 14, 28);
    doc.text(`Parameters: Reason(${reasonFilter}), College(${collegeFilter}), Window(${dateRangeMode})`, 14, 34);

    const tableData = filteredVisits.map(v => [
      v.displayName,
      v.email,
      v.college,
      v.program,
      v.reason,
      v.date,
      v.timestamp ? format(v.timestamp.toDate(), "hh:mm aa") : "--:--",
      v.isEmployee ? "Staff/Faculty" : "Student"
    ]);

    autoTable(doc, {
      head: [["Name", "Email", "College", "Program", "Reason", "Date", "Time", "Status"]],
      body: tableData,
      startY: 42,
      styles: { fontSize: 8, cellPadding: 2, font: "helvetica" },
      headStyles: { fillColor: [26, 35, 126], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 246, 248] },
    });

    doc.save(`NEU_VisitFlow_Report_${format(new Date(), "yyyyMMdd_HHmm")}.pdf`);
  };

  if (loading || loadingData) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-primary font-bold animate-pulse">Syncing Admin Records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F6F8] pb-20">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-5xl font-black text-primary flex items-center gap-4 font-headline tracking-tighter uppercase">
              <Shield size={48} className="text-secondary" />
              Central Control
            </h1>
            <p className="text-muted-foreground font-bold text-xl uppercase tracking-widest opacity-60">Library Oversight & Analytics</p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Select onValueChange={setDateRangeMode} value={dateRangeMode}>
              <SelectTrigger className="w-52 h-14 border-primary/20 bg-white font-black text-primary shadow-lg rounded-xl">
                <CalendarIcon className="mr-2 h-5 w-5 text-secondary" />
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Today">Today</SelectItem>
                <SelectItem value="This Week">This Week</SelectItem>
                <SelectItem value="This Month">This Month</SelectItem>
                <SelectItem value="All Time">All Time</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={exportPDF} variant="outline" className="h-14 border-primary border-2 text-primary hover:bg-primary hover:text-white font-black shadow-lg gap-2 px-8 rounded-xl transition-all">
              <Download size={20} />
              EXPORT AUDIT
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { label: "Today's Pulse", value: stats.today, color: "bg-blue-600", icon: Activity },
            { label: "Weekly Volume", value: stats.week, color: "bg-green-600", icon: TrendingUp },
            { label: "Monthly Growth", value: stats.month, color: "bg-secondary", icon: PieChart },
            { label: "Registry Size", value: stats.allTime, color: "bg-primary", icon: Users },
          ].map((stat, i) => (
            <Card key={i} className="border-none shadow-2xl bg-white overflow-hidden group hover:-translate-y-2 transition-all duration-300">
              <div className={`h-2 ${stat.color} w-full`}></div>
              <CardHeader className="pb-4">
                <div className="flex justify-between items-center mb-2">
                  <CardDescription className="font-black text-xs uppercase tracking-[0.2em] text-muted-foreground">{stat.label}</CardDescription>
                  <stat.icon className="h-5 w-5 text-muted-foreground/30" />
                </div>
                <CardTitle className="text-6xl font-black text-primary tabular-nums tracking-tighter">{stat.value}</CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="visits" className="space-y-10">
          <TabsList className="bg-white/80 backdrop-blur-md border-2 border-primary/5 p-2 rounded-2xl shadow-xl inline-flex h-auto">
            {[
              { val: "visits", label: "Registry Logs", icon: FileText },
              { val: "insights", label: "Intelli-Insights", icon: Sparkles },
              { val: "users", label: "User Management", icon: Users },
              { val: "tools", label: "System Tools", icon: Zap }
            ].map(tab => (
              <TabsTrigger key={tab.val} value={tab.val} className="px-10 py-4 font-black uppercase tracking-widest text-sm rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all gap-2">
                <tab.icon size={18} />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="visits" className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-none shadow-2xl overflow-hidden bg-white rounded-3xl">
              <CardHeader className="bg-primary/5 pb-6 border-b border-primary/10">
                <CardTitle className="text-2xl font-black text-primary flex items-center gap-3 font-headline uppercase tracking-tight">
                  <TrendingUp size={28} className="text-secondary" />
                  Real-Time Traffic Trends
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-12 h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 13, fontWeight: 800, fill: '#1A237E' }} 
                      dy={15} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 13, fontWeight: 600, fill: '#64748B' }} 
                    />
                    <RechartsTooltip 
                      cursor={{ fill: 'rgba(255, 215, 0, 0.1)' }}
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', fontWeight: 800 }}
                    />
                    <Bar dataKey="count" radius={[10, 10, 0, 0]} barSize={45}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? '#FFD700' : '#1A237E'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="flex flex-wrap gap-6 items-center bg-white p-8 rounded-3xl shadow-2xl border-none">
              <div className="flex-1 min-w-[350px] relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-primary/40 h-6 w-6" />
                <Input 
                  placeholder="Query Name, Program, College, or Reason..." 
                  className="pl-14 h-16 border-2 border-primary/5 bg-[#F8FAFC] font-bold text-lg rounded-2xl focus:border-secondary focus:ring-0 transition-all"
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <Select onValueChange={setReasonFilter} value={reasonFilter}>
                  <SelectTrigger className="w-48 h-16 border-2 border-primary/5 bg-white font-black uppercase text-xs tracking-widest rounded-2xl">
                    <Filter className="mr-2 h-4 w-4 text-secondary" />
                    <SelectValue placeholder="Reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {REASONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select onValueChange={setCollegeFilter} value={collegeFilter}>
                  <SelectTrigger className="w-48 h-16 border-2 border-primary/5 bg-white font-black uppercase text-xs tracking-widest rounded-2xl">
                    <SelectValue placeholder="College" />
                  </SelectTrigger>
                  <SelectContent>
                    {COLLEGES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select onValueChange={setStatusFilter} value={statusFilter}>
                  <SelectTrigger className="w-48 h-16 border-2 border-primary/5 bg-white font-black uppercase text-xs tracking-widest rounded-2xl">
                    <SelectValue placeholder="Classification" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Status</SelectItem>
                    <SelectItem value="Employee">Employee</SelectItem>
                    <SelectItem value="Student">Student</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Card className="border-none shadow-2xl overflow-hidden bg-white rounded-3xl">
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-[#F8FAFC]">
                    <TableRow className="border-primary/5 hover:bg-transparent">
                      <TableHead className="font-black text-primary py-6 px-8 uppercase text-xs tracking-widest">Visitor Identity</TableHead>
                      <TableHead className="font-black text-primary uppercase text-xs tracking-widest">Academic Origin</TableHead>
                      <TableHead className="font-black text-primary uppercase text-xs tracking-widest">Visit Purpose</TableHead>
                      <TableHead className="font-black text-primary uppercase text-xs tracking-widest">Timestamp</TableHead>
                      <TableHead className="font-black text-primary uppercase text-xs tracking-widest">Classification</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVisits.length > 0 ? (
                      filteredVisits.map((v) => (
                        <TableRow key={v.id} className="hover:bg-primary/5 transition-colors border-primary/5">
                          <TableCell className="py-7 px-8">
                            <div className="font-black text-primary text-base">{v.displayName}</div>
                            <div className="text-xs text-muted-foreground font-bold">{v.email}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-2 border-primary/10 text-primary font-black mb-1 bg-white px-3">{v.college}</Badge>
                            <div className="text-[11px] font-black text-muted-foreground uppercase tracking-wider mt-1 truncate max-w-[180px]">{v.program}</div>
                          </TableCell>
                          <TableCell><span className="text-sm font-black text-primary uppercase tracking-tighter">{v.reason}</span></TableCell>
                          <TableCell>
                            <div className="text-sm font-black text-primary">{v.date}</div>
                            <div className="text-xs text-muted-foreground font-bold">
                              {v.timestamp ? format(v.timestamp.toDate(), "hh:mm aa") : "--:--"}
                            </div>
                          </TableCell>
                          <TableCell>
                            {v.isEmployee ? (
                              <Badge className="bg-blue-600 text-white border-none font-black px-4 py-1.5 shadow-md">
                                {v.employeeType || "STAFF"}
                              </Badge>
                            ) : (
                              <Badge className="bg-green-600 text-white border-none font-black px-4 py-1.5 shadow-md">
                                STUDENT
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-32 text-muted-foreground">
                          <div className="flex flex-col items-center gap-4">
                            <Search size={64} className="opacity-10 text-primary" />
                            <p className="text-xl font-black uppercase tracking-widest">No Matches Found</p>
                            <p className="text-sm font-bold">Refine your filters to see more results.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <Card className="border-none shadow-2xl bg-white rounded-3xl overflow-hidden">
                <CardHeader className="bg-primary text-white py-8 px-8">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-3 text-2xl font-black uppercase tracking-tighter font-headline">
                        <Sparkles className="text-secondary" size={32} />
                        Traffic Analytics (AI)
                      </CardTitle>
                      <CardDescription className="text-white/70 text-base font-bold uppercase tracking-widest mt-1">Algorithmic Behavioral Summary</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <Button 
                    onClick={handleGenerateSummary} 
                    disabled={isGeneratingSummary}
                    className="w-full h-16 text-lg font-black bg-primary hover:bg-primary/95 shadow-2xl active:scale-[0.98] transition-all rounded-2xl"
                  >
                    {isGeneratingSummary ? <Loader2 className="mr-2 animate-spin" /> : <Sparkles className="mr-2 h-5 w-5" />}
                    GENERATE TREND REPORT
                  </Button>
                  {aiSummary && (
                    <div className="p-8 bg-[#F8FAFC] rounded-2xl border-2 border-primary/5 text-lg leading-relaxed font-medium animate-in fade-in slide-in-from-top-6 duration-700 whitespace-pre-wrap">
                      {aiSummary}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-none shadow-2xl bg-white rounded-3xl overflow-hidden">
                <CardHeader className="bg-secondary text-primary py-8 px-8">
                  <div>
                    <CardTitle className="flex items-center gap-3 text-2xl font-black uppercase tracking-tighter font-headline">
                      <TrendingUp className="text-primary" size={32} />
                      Qualitative Deep-Dive
                    </CardTitle>
                    <CardDescription className="text-primary/70 text-base font-bold uppercase tracking-widest mt-1">Custom Reason Thematic Mapping</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <Button 
                    onClick={handleAnalyzeOtherReasons} 
                    disabled={isGeneratingAnalysis}
                    className="w-full h-16 text-lg font-black bg-secondary hover:bg-secondary/80 text-primary shadow-2xl active:scale-[0.98] transition-all rounded-2xl"
                  >
                    {isGeneratingAnalysis ? <Loader2 className="mr-2 animate-spin" /> : <PieChart className="mr-2 h-5 w-5" />}
                    MAP CUSTOM REASONS
                  </Button>
                  {aiAnalysis && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-top-6 duration-700">
                      {aiAnalysis.map((item, idx) => (
                        <div key={idx} className="p-6 bg-[#F8FAFC] rounded-2xl border-2 border-primary/5 space-y-3 group hover:border-secondary transition-colors">
                          <p className="font-black text-primary text-xl uppercase tracking-tighter">{item.category}</p>
                          <p className="text-base text-muted-foreground font-bold">{item.summary}</p>
                          <div className="pt-3 flex flex-wrap gap-2">
                            {item.exampleReasons.map((ex: string, i: number) => (
                              <Badge key={i} variant="secondary" className="text-xs font-black bg-white border border-primary/5 text-primary px-3 py-1 uppercase">{ex}</Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-none shadow-2xl overflow-hidden bg-white rounded-3xl">
              <CardHeader className="bg-[#F8FAFC] p-8 border-b">
                <CardTitle className="text-2xl font-black text-primary flex items-center gap-4 font-headline uppercase tracking-tight">
                  <Users size={32} className="text-secondary" />
                  Global Member Directory
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-[#F8FAFC]">
                    <TableRow className="border-primary/5 hover:bg-transparent">
                      <TableHead className="font-black text-primary py-6 px-8 uppercase text-xs tracking-widest">Verified Identity</TableHead>
                      <TableHead className="font-black text-primary uppercase text-xs tracking-widest">Dept / College</TableHead>
                      <TableHead className="font-black text-primary uppercase text-xs tracking-widest">Auth Level</TableHead>
                      <TableHead className="font-black text-primary uppercase text-xs tracking-widest">Security Status</TableHead>
                      <TableHead className="text-right font-black text-primary px-8 uppercase text-xs tracking-widest">Administrative Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id} className="hover:bg-primary/5 transition-colors border-primary/5">
                        <TableCell className="py-7 px-8">
                          <div className="flex items-center gap-5">
                            <Avatar className="h-14 w-14 border-4 border-white shadow-xl ring-2 ring-primary/5">
                              <AvatarImage src={u.photoURL} />
                              <AvatarFallback className="font-black text-xl">{u.displayName?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-black text-primary text-lg">{u.displayName}</div>
                              <div className="text-xs text-muted-foreground font-black uppercase tracking-wider">{u.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-black text-primary text-base uppercase">{u.college || "Unassigned"}</div>
                          <div className="text-[11px] font-black text-muted-foreground uppercase tracking-widest mt-1">{u.program || "Pending Setup"}</div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`px-4 py-1.5 font-black text-xs uppercase tracking-widest ${u.role === "admin" ? "bg-primary text-white" : "bg-secondary text-primary"}`}>
                            {u.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {u.isBlocked ? (
                            <Badge variant="destructive" className="flex w-fit items-center gap-2 px-4 py-1.5 font-black text-xs uppercase tracking-widest shadow-lg">
                              <ShieldAlert size={14} /> Revoked
                            </Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 flex w-fit items-center gap-2 px-4 py-1.5 font-black text-xs uppercase tracking-widest shadow-sm border-none">
                              <UserCheck size={14} /> Authorized
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right px-8 space-x-3">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-11 px-5 font-black border-2 border-primary text-primary hover:bg-primary hover:text-white rounded-xl shadow-lg transition-all"
                            onClick={() => handleToggleRole(u.id, u.role)}
                          >
                            Swap Privileges
                          </Button>
                          <Button 
                            variant={u.isBlocked ? "outline" : "destructive"} 
                            size="sm"
                            className="h-11 px-5 font-black rounded-xl shadow-lg"
                            onClick={() => handleToggleBlock(u.id, u.isBlocked)}
                          >
                            {u.isBlocked ? "Allow Access" : "Block Access"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tools" className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <Card className="border-none shadow-2xl bg-white overflow-hidden rounded-[2rem]">
                <CardHeader className="bg-primary text-white py-12 px-10">
                  <div className="space-y-2">
                    <CardTitle className="flex items-center gap-4 text-3xl font-black uppercase tracking-tighter font-headline">
                      <Zap size={36} className="text-secondary" />
                      Rapid Entry
                    </CardTitle>
                    <CardDescription className="text-white/70 text-lg font-bold uppercase tracking-[0.15em]">Admin-Initiated Log Sequence</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="pt-12 space-y-10 px-10 pb-12">
                  <div className="space-y-4">
                    <Label className="text-primary font-black uppercase tracking-[0.2em] text-[11px] ml-1">Identity Recognition (Email or RFID)</Label>
                    <div className="flex gap-4">
                      <Input 
                        placeholder="Scan RFID or enter university email..." 
                        className="h-16 border-2 border-primary/5 bg-[#F8FAFC] font-black text-xl rounded-2xl px-6 focus:border-secondary transition-all"
                        value={quickSearch}
                        onChange={(e) => setQuickSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleQuickSearch()}
                      />
                      <Button onClick={handleQuickSearch} className="h-16 px-10 bg-primary font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-all rounded-2xl">Lookup</Button>
                    </div>
                  </div>

                  {foundUser && (
                    <div className="p-10 bg-[#F8FAFC] rounded-[2rem] border-2 border-primary/5 space-y-10 animate-in zoom-in-95 duration-500 shadow-inner">
                      <div className="flex items-center gap-8">
                        <Avatar className="h-24 w-24 border-6 border-white shadow-2xl ring-4 ring-primary/5">
                          <AvatarImage src={foundUser.photoURL} />
                          <AvatarFallback className="text-3xl font-black">{foundUser.displayName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <p className="text-3xl font-black text-primary font-headline uppercase tracking-tighter leading-none">{foundUser.displayName}</p>
                          <p className="text-lg font-black text-muted-foreground/60 uppercase tracking-widest">{foundUser.program} • {foundUser.college}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-6 pt-10 border-t-2 border-primary/5">
                        <div className="space-y-4">
                          <Label className="text-primary font-black uppercase tracking-[0.2em] text-[11px] ml-1">Select Purpose for Visit</Label>
                          <Select onValueChange={setQuickReason} value={quickReason}>
                            <SelectTrigger className="h-16 border-2 border-primary/5 bg-white font-black text-xl rounded-2xl px-6 focus:border-secondary transition-all">
                              <SelectValue placeholder="Choose action..." />
                            </SelectTrigger>
                            <SelectContent>
                              {REASONS.filter(r => r !== "All").map(r => (
                                <SelectItem key={r} value={r} className="font-black text-lg py-3 uppercase tracking-tight">{r}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button 
                          className="w-full h-20 bg-secondary text-primary font-black text-2xl hover:bg-secondary/90 shadow-2xl rounded-2xl transition-all active:scale-[0.98] uppercase tracking-tighter" 
                          onClick={handleQuickLog}
                          disabled={!quickReason}
                        >
                          <UserPlus size={32} className="mr-4" />
                          AUTHORIZE ENTRY
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-none shadow-2xl bg-white border-l-[12px] border-l-secondary rounded-[2rem] overflow-hidden">
                <CardHeader className="py-12 px-10">
                  <div className="space-y-2">
                    <CardTitle className="text-primary font-black uppercase tracking-tighter text-3xl font-headline flex items-center gap-4">
                      <FileText size={36} className="text-secondary" />
                      Registry Health
                    </CardTitle>
                    <CardDescription className="text-lg font-bold uppercase tracking-[0.15em] text-muted-foreground">Operational System Metrics</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-8 px-10 pb-12">
                  <div className="space-y-8">
                    {[
                      { label: "Active Peak Period", val: "10:00 AM - 2:00 PM", color: "text-blue-600" },
                      { label: "Top Logged College", val: "CCS", color: "text-green-600" },
                      { label: "Database Sync", val: "REAL-TIME", color: "text-primary" },
                      { label: "Registry Protocol", val: "ACTIVE", color: "text-secondary" }
                    ].map((m, i) => (
                      <div key={i} className="flex justify-between items-center p-6 bg-[#F8FAFC] rounded-2xl border-2 border-primary/5 shadow-sm group hover:border-secondary transition-all">
                        <span className="text-muted-foreground font-black uppercase tracking-widest text-xs">{m.label}</span>
                        <span className={`font-black uppercase text-lg tracking-tighter ${m.color}`}>{m.val}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
