
"use client";

import { useMemo } from "react";
import { collection, query, where } from "firebase/firestore";
import { useFirestore, useCollection } from "@/firebase";
import { useAuth } from "@/hooks/use-auth";
import { 
  Users, 
  CreditCard, 
  MessageSquare, 
  Settings, 
  Bell, 
  FileText,
  Megaphone,
  ChevronRight,
  LayoutDashboard,
  Heart,
  Wallet,
  Store,
  BookOpen
} from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export default function AdminDashboard() {
  const db = useFirestore();
  const { profile } = useAuth();

  const usersQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, "users"), where("role", "==", "warga"));
  }, [db]);

  const complaintsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, "pengaduan"), where("status", "==", "baru"));
  }, [db]);

  const financeQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, "keuangan"));
  }, [db]);

  const { data: warga } = useCollection(usersQuery);
  const { data: complaints } = useCollection(complaintsQuery);
  const { data: finance } = useCollection(financeQuery);

  const stats = useMemo(() => {
    if (!finance) return { total: 0, incoming: 0, outgoing: 0 };
    return finance.reduce((acc, curr: any) => {
      const txNominal = Number(curr.nominal);
      if (curr.jenis === "pemasukan") acc.incoming += txNominal;
      else acc.outgoing += txNominal;
      acc.total = acc.incoming - acc.outgoing;
      return acc;
    }, { total: 0, incoming: 0, outgoing: 0 });
  }, [finance]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
  };

  // Full Menu for Admin Grid
  const menuItems = [
    { href: "/admin/users", label: "Data Warga", icon: Users, color: "bg-emerald-600" },
    { href: "/admin/iuran", label: "Iuran", icon: CreditCard, color: "bg-blue-600" },
    { href: "/admin/keuangan", label: "Keuangan RT", icon: Wallet, color: "bg-indigo-600" },
    { href: "/admin/anak-yatim", label: "Anak Yatim", icon: Heart, color: "bg-pink-600" },
    { href: "/admin/surat", label: "Surat", icon: FileText, color: "bg-amber-600" },
    { href: "/admin/pengaduan", label: "Pengaduan", icon: MessageSquare, color: "bg-rose-600" },
    { href: "/admin/umkm", label: "UMKM Warga", icon: Store, color: "bg-teal-600" },
    { href: "/admin/buku-tamu", label: "Buku Tamu", icon: BookOpen, color: "bg-slate-600" },
    { href: "/admin/pengumuman", label: "Berita RT", icon: Megaphone, color: "bg-violet-600" },
    { href: "/admin/notifications", label: "Notifikasi", icon: Bell, color: "bg-cyan-600" },
    { href: "/admin/settings", label: "Setelan RT", icon: Settings, color: "bg-gray-600" },
  ];

  return (
    <div className="space-y-6 pb-20">
      <div className="bg-secondary text-white p-6 rounded-b-[3rem] -mx-4 -mt-4 shadow-lg mb-8">
        <div className="flex items-center gap-4 mb-8">
          <Avatar className="w-14 h-14 border-2 border-white/20">
            <AvatarImage src={`https://picsum.photos/seed/admin/200`} />
            <AvatarFallback className="bg-white/10 text-white font-bold">A</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white">Admin Console</h1>
            <p className="text-teal-100 text-xs opacity-80">Pengurus Lingkungan</p>
          </div>
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5 text-white" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white/10 rounded-3xl p-4 border border-white/10">
            <p className="text-[10px] font-bold opacity-60 uppercase mb-1 text-white">Kas RT</p>
            <p className="text-xl font-bold text-white">{formatCurrency(stats.total)}</p>
          </div>
          <div className="bg-white/10 rounded-3xl p-4 border border-white/10">
            <p className="text-[10px] font-bold opacity-60 uppercase mb-1 text-white">Total Warga</p>
            <p className="text-xl font-bold text-white">{warga?.length || 0}</p>
          </div>
        </div>
      </div>

      <div className="px-2">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4 px-2">Menu Kelola</h2>
        <div className="grid grid-cols-4 gap-4">
          {menuItems.map((item) => (
            <Link key={item.href} href={item.href} className="group flex flex-col items-center gap-1.5">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md active:scale-90 transition-transform", item.color)}>
                <item.icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-[9px] font-bold text-center leading-tight text-foreground/70">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="px-2 mt-8">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4 px-2">Aktivitas Baru</h2>
        <div className="space-y-3">
          {complaints && complaints.length > 0 && (
            <Link href="/admin/pengaduan" className="block bg-rose-50 border border-rose-100 p-4 rounded-3xl flex items-center gap-4">
              <div className="w-10 h-10 bg-rose-600 text-white rounded-xl flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-rose-900">{complaints.length} Laporan Baru</p>
                <p className="text-[10px] text-rose-700 opacity-70">Segera tindak lanjuti aspirasi warga.</p>
              </div>
              <ChevronRight className="w-4 h-4 text-rose-400" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
