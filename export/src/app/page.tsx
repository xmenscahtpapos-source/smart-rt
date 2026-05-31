
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Home, ShieldCheck, Heart } from "lucide-react";

export default function LandingPage() {
  const { profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && profile) {
      router.push(profile.role === "admin" ? "/admin" : "/warga");
    }
  }, [profile, loading, router]);

  if (loading) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="px-6 py-4 flex justify-between items-center bg-white shadow-sm">
        <div className="flex items-center gap-2 font-headline font-bold text-primary text-2xl">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white">S</div>
          INFO POS
        </div>
        <div className="flex gap-4">
          <Link href="/login">
            <Button variant="ghost">Masuk</Button>
          </Link>
          <Link href="/register">
            <Button>Daftar</Button>
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 pt-20 pb-10 text-center">
        <h1 className="text-5xl md:text-7xl font-headline font-extrabold text-foreground mb-6 leading-tight">
          Manajemen Lingkungan <br /><span className="text-primary underline decoration-emerald-200">Lebih Cerdas & Terintegrasi</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
          Platform terpadu untuk RT di Indonesia. Kelola iuran, verifikasi warga, dan pantau pengaduan dalam satu dashboard modern.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
          <Link href="/register">
            <Button size="lg" className="h-14 px-10 text-lg rounded-full shadow-lg shadow-emerald-200">Gabung Sebagai Warga</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-border hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-mint-50 rounded-2xl flex items-center justify-center text-primary mb-6 mx-auto">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-3">Verifikasi Aman</h3>
            <p className="text-muted-foreground">Admin memverifikasi status warga secara manual untuk menjaga validitas data lingkungan.</p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-border hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-mint-50 rounded-2xl flex items-center justify-center text-secondary mb-6 mx-auto">
              <Heart className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-3">Aspirasi Warga</h3>
            <p className="text-muted-foreground">Sistem pengaduan terpadu untuk menyampaikan dan memantau masalah di lingkungan RT.</p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-border hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-mint-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6 mx-auto">
              <Home className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-3">Iuran Transparan</h3>
            <p className="text-muted-foreground">Pantau status iuran bulanan warga secara real-time dan transparan bagi semua.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
