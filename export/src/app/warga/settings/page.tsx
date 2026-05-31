
"use client";

import { 
  Info, 
  ChevronRight, 
  Palette,
  PhoneCall,
  ShieldAlert,
  HelpCircle,
  LogOut
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth as useFirebaseInstance } from "@/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PageHeader } from "@/components/shared/page-header";

export default function WargaSettingsPage() {
  const { toast } = useToast();
  const auth = useFirebaseInstance();
  const router = useRouter();

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      localStorage.clear();
      sessionStorage.clear();
      router.replace("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const settingsGroups = [
    {
      title: "Personalisasi",
      items: [
        { 
          label: "Tema Aplikasi", 
          icon: Palette, 
          onClick: () => toast({ title: "Segera Hadir", description: "Fitur kustomisasi tema sedang dikembangkan." })
        },
      ]
    },
    {
      title: "Tentang Aplikasi",
      items: [
        { 
          label: "Tentang Info Pos", 
          icon: Info, 
          onClick: () => toast({ title: "Info Pos", description: "Versi 1.2.0 - Solusi Digital RT." })
        },
        { 
          label: "Kontak Pengurus RT", 
          icon: PhoneCall, 
          onClick: () => toast({ title: "Kontak RT", description: "Hubungi sekretariat di menu dashboard." })
        },
        { 
          label: "Kebijakan Privasi", 
          icon: ShieldAlert, 
          onClick: () => toast({ title: "Privasi", description: "Data Anda dienkripsi secara aman." })
        },
        { 
          label: "Bantuan & Support", 
          icon: HelpCircle, 
          onClick: () => toast({ title: "Support", description: "Email: support@smartrt.id" })
        },
      ]
    }
  ];

  return (
    <div className="space-y-6 pb-24">
      <PageHeader title="Setelan" backUrl="/warga" />

      <div className="px-2">
        {settingsGroups.map((group, gIdx) => (
          <div key={gIdx} className="mb-6">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-4 mb-3">
              {group.title}
            </h3>
            <div className="bg-white rounded-[2rem] overflow-hidden border border-white/50 android-shadow">
              {group.items.map((item, iIdx) => {
                const isLast = iIdx === group.items.length - 1;
                
                return (
                  <button 
                    key={iIdx}
                    onClick={item.onClick}
                    className={cn(
                      "w-full flex items-center justify-between p-5 active:bg-muted/5 transition-colors",
                      !isLast && "border-b border-gray-50"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-muted-foreground">
                        <item.icon className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-bold text-foreground/80">{item.label}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full h-14 rounded-3xl border-rose-100 text-rose-600 hover:bg-rose-50 bg-white shadow-sm mt-4 flex items-center justify-center gap-3"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-bold">Keluar Akun</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="rounded-3xl w-[90%] max-w-sm mx-auto">
            <AlertDialogHeader>
              <AlertDialogTitle>Konfirmasi Keluar</AlertDialogTitle>
              <AlertDialogDescription>
                Apakah Anda yakin ingin keluar dari aplikasi?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-row gap-2 mt-4">
              <AlertDialogCancel className="flex-1 mt-0 rounded-2xl h-11">Batal</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleLogout}
                className="flex-1 rounded-2xl h-11 bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Keluar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="p-8 text-center opacity-30">
          <p className="text-[10px] font-bold tracking-widest uppercase">Info Pos Smart RT v1.2.0</p>
        </div>
      </div>
    </div>
  );
}
