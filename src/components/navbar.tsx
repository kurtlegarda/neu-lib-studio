
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
import { Library, LogOut } from "lucide-react";

export function Navbar() {
  const { profile } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/");
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-primary text-primary-foreground shadow-sm px-4 h-16 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          <div className="bg-secondary p-1.5 rounded-lg text-primary shadow-sm">
            <Library size={24} />
          </div>
          <span className="font-bold text-xl tracking-tight hidden sm:inline-block">NEU VisitFlow</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
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
