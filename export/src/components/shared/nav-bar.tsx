
"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { 
  Home, 
  MessageSquare, 
  Settings,
  User,
  LayoutDashboard
} from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function NavBar() {
  const { profile } = useAuth();
  const pathname = usePathname();

  if (!profile) return null;

  const isAdmin = profile.role === "admin";

  // Simplified Bottom Navigation: Home, Reports, Settings, Profile
  const navItems = isAdmin 
    ? [
        { href: "/admin", label: "Beranda", icon: LayoutDashboard },
        { href: "/admin/pengaduan", label: "Laporan", icon: MessageSquare },
        { href: "/admin/settings", label: "Set RT", icon: Settings },
        { href: "/admin/profile", label: "Profil", icon: User },
      ]
    : [
        { href: "/warga", label: "Beranda", icon: Home },
        { href: "/warga/pengaduan", label: "Lapor", icon: MessageSquare },
        { href: "/warga/settings", label: "Setelan", icon: Settings },
        { href: "/warga/profile", label: "Profil", icon: User },
      ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-gray-100 px-2 h-20 safe-area-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
      <div className="max-w-md mx-auto h-full flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href} 
              href={item.href} 
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 transition-all duration-300 w-20 h-full",
                isActive ? "text-primary scale-105" : "text-muted-foreground opacity-60"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-2xl flex items-center justify-center mb-0.5 transition-colors",
                isActive && "bg-primary/10"
              )}>
                <item.icon className={cn("w-6 h-6", isActive && "fill-primary/20")} />
              </div>
              <span className={cn(
                "text-[10px] font-bold tracking-tight transition-all",
                isActive ? "opacity-100" : "opacity-80"
              )}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
