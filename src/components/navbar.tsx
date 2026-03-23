
"use client";

import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { LogOut, ShieldCheck, LayoutDashboard } from "lucide-react";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export function Navbar() {
  const { profile, role } = useAuth();
  const router = useRouter();
  const logo = PlaceHolderImages.find(img => img.id === "neu-logo");

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/");
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-primary text-primary-foreground shadow-sm px-4 h-16 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-3 select-none cursor-pointer" onClick={() => router.push("/dashboard")}>
          {logo && (
            <div className="relative w-10 h-10 overflow-hidden rounded-xl border-2 border-secondary shadow-lg">
              <Image 
                src={logo.imageUrl} 
                alt="NEU Logo" 
                fill 
                className="object-cover"
                data-ai-hint="university logo"
              />
            </div>
          )}
          <span className="font-black text-xl tracking-tighter uppercase hidden sm:inline-block">NEU VisitFlow</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {role === "admin" && (
          <Button 
            variant="ghost" 
            className="hidden md:flex font-black uppercase text-xs tracking-widest text-secondary hover:text-white hover:bg-white/10 gap-2"
            onClick={() => router.push("/admin")}
          >
            <ShieldCheck size={16} />
            Admin Panel
          </Button>
        )}
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 border-2 border-secondary/30">
              <Avatar className="h-9 w-9">
                <AvatarImage src={profile?.photoURL} alt={profile?.displayName} />
                <AvatarFallback className="bg-secondary text-primary font-bold">
                  {profile?.displayName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{profile?.displayName}</p>
                <p className="text-xs leading-none text-muted-foreground">{profile?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/dashboard")} className="cursor-pointer">
              <LayoutDashboard size={16} className="mr-2" />
              <span>User Dashboard</span>
            </DropdownMenuItem>
            {role === "admin" && (
              <DropdownMenuItem onClick={() => router.push("/admin")} className="cursor-pointer font-bold text-primary">
                <ShieldCheck size={16} className="mr-2" />
                <span>Central Control</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:bg-destructive/10 cursor-pointer">
              <LogOut size={16} className="mr-2" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
