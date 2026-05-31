"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { NavBar } from "@/components/shared/nav-bar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!profile) {
        router.push("/login");
      } else if (profile.role !== "admin") {
        router.push("/warga");
      }
    }
  }, [profile, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile || profile.role !== "admin") return null;

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-md mx-auto min-h-screen pb-20 pt-4 px-4 overflow-x-hidden">
        {children}
      </main>
      <NavBar />
    </div>
  );
}