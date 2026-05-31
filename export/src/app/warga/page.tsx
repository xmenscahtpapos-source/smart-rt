
"use client";

import { useMemo } from "react";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { useFirestore, useCollection } from "@/firebase";
import { useAuth } from "@/hooks/use-auth";
import { 
  CreditCard, 
  MessageSquare, 
  Megaphone, 
  FileText, 
  Bell, 
  ShieldCheck,
  Heart,
  Store,
  Users,
  Wallet
} from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export default function WargaDashboard() {
  const db = useFirestore();
  const { profile } = useAuth();

  const announcementsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, "pengumuman"), orderBy("date", "desc"), limit(1));
  }, [db]);

  const financeQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, "keuangan"));
  }, [db]);

  const { data: announcements } = useCollection(announcementsQuery);
  const { data: finance } = useCollection(financeQuery);

  const stats = useMemo(() => {
    if (!finance) return { total: 0 };
    return finance.reduce((acc, curr: any) => {
      const txNominal = Number(curr.nominal);
      if (curr.jenis === "pemasukan") acc.total += txNominal;
      else acc.total -= txNominal;
      return acc;
    }, { total: 0 });
  }, [finance]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
  };

  const menuItems = [
    { href: "/warga/data-warga", label: "Data Warga", icon: Users, color: "bg-emerald-500" },
    { href: "/warga/iuran", label: "Iuran", icon: CreditCard, color: "bg-blue-500" },
    { href: "/warga/keuangan", label: "Keuangan RT", icon: Wallet, color: "bg-indigo-500" },
    { href: "/warga/surat", label: "Surat", icon: FileText, color: "bg-amber-500" },
    { href: "/warga/anak-yatim", label: "Anak Yatim", icon: Heart, color: "bg-pink-500" },
    { href: "/warga/umkm", label: "UMKM", icon: Store, color: "bg-teal-500" },
    { href: "/warga/pengaduan", label: "Pengaduan", icon: MessageSquare, color: "bg-rose-500" },
    { href: "/warga/notifications", label: "Notifikasi", icon: Bell, color: "bg-cyan-500" },
  ];

  return (
    <div className="space-y-6 pb-20">
      <div className="bg-primary text-white p-6 rounded-b-[3rem] -mx-4 -mt-4 shadow-lg mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3 font-bold">
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">S</div>
            <span className="text-lg text-white">INFO POS</span>
          </div>
          <Link href="/warga/notifications" className="p-2 bg-white/10 rounded-full relative">
            <Bell className="w-5 h-5 text-white" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full border border-primary"></span>
          </Link>
        </div>

        <div className="flex items-center gap-4 mb-8">
          <Avatar className="w-14 h-14 border-2 border-white/20 shadow-sm">
            <AvatarImage src={`https://picsum.photos/seed/${profile?.uid}/200`} />
            <AvatarFallback className="bg-white/10 text-white font-bold">
              {profile?.name?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold truncate text-white">Halo, {profile?.name}</h1>
            <p className="text-emerald-100 text-xs flex items-center gap-1 opacity-80 truncate">
              <ShieldCheck className="w-3 h-3" /> Warga Aktif • {profile?.address || "Blok - No -"}
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-4 border border-white/10 shadow-sm">
            <p className="text-[9px] font-bold uppercase opacity-60 mb-0.5 tracking-wider text-white">Saldo Kas RT</p>
            <p className="text-sm font-bold text-white">{formatCurrency(stats.total)}</p>
          </div>
          <Link href="/warga/pengumuman" className="bg-white/10 backdrop-blur-md rounded-3xl p-4 border border-white/10 shadow-sm flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase opacity-60 mb-0.5 tracking-wider text-white">Info Baru</p>
              <p className="text-[10px] font-bold truncate max-w-[80px] text-white">{announcements?.[0]?.title || "Belum ada info"}</p>
            </div>
            <Megaphone className="w-3.5 h-3.5 opacity-60 text-white" />
          </Link>
        </div>
      </div>

      <div className="px-2">
        <h2 className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-6 px-3">Menu Layanan</h2>
        <div className="grid grid-cols-4 gap-x-2 gap-y-6">
          {menuItems.map((item) => (
            <Link key={item.href} href={item.href} className="group flex flex-col items-center gap-2">
              <div className={cn("w-14 h-14 rounded-[1.25rem] flex items-center justify-center text-white shadow-md transition-transform active:scale-90", item.color)}>
                <item.icon className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold text-foreground/70 tracking-tight text-center">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="px-2 mt-10">
        <h2 className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-4 px-3">Akses Cepat</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/warga/keuangan" className="bg-indigo-50 p-5 rounded-[2.5rem] border border-indigo-100 group active:scale-95 transition-transform">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mb-4">
              <Wallet className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-indigo-900">Laporan Kas</p>
            <p className="text-[9px] text-indigo-700 opacity-60 mt-0.5">Transparansi dana RT</p>
          </Link>
          <Link href="/warga/pengaduan" className="bg-rose-50 p-5 rounded-[2.5rem] border border-rose-100 group active:scale-95 transition-transform">
            <div className="w-10 h-10 bg-rose-600 rounded-2xl flex items-center justify-center text-white mb-4">
              <MessageSquare className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-rose-900">Lapor Keluhan</p>
            <p className="text-[9px] text-rose-700 opacity-60 mt-0.5">Sampaikan aspirasi</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
