
"use client";

import { useAuth } from "@/hooks/use-auth";
import { useAuth as useFirebaseInstance } from "@/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { NavBar } from "@/components/shared/nav-bar";
import { Button } from "@/components/ui/button";
import { Clock, XCircle, LogOut } from "lucide-react";
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

export default function WargaLayout({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();
  const auth = useFirebaseInstance();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!profile) {
        router.push("/login");
      } else if (profile.role !== "warga") {
        router.push("/admin");
      }
    }
  }, [profile, loading, router]);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile || profile.role !== "warga") return null;

  if (profile.status === "pending" || profile.status === "ditolak") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="max-w-md w-full text-center space-y-8 bg-white p-10 rounded-[3rem] shadow-xl border border-border">
          <div className="mx-auto w-20 h-20 flex items-center justify-center rounded-3xl bg-muted">
            {profile.status === "pending" ? (
              <Clock className="w-10 h-10 text-amber-500" />
            ) : (
              <XCircle className="w-10 h-10 text-destructive" />
            )}
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">
              {profile.status === "pending" ? "Menunggu Verifikasi" : "Pendaftaran Ditolak"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {profile.status === "pending" 
                ? "Akun Anda sedang dalam antrean verifikasi oleh Pengurus RT."
                : "Maaf, pendaftaran Anda tidak disetujui oleh Pengurus RT."}
            </p>
          </div>
          <div className="pt-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full h-12 rounded-2xl flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Keluar Akun
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
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-md mx-auto min-h-screen pb-20 pt-4 px-4 overflow-x-hidden">
        {children}
      </main>
      <NavBar />
    </div>
  );
}
