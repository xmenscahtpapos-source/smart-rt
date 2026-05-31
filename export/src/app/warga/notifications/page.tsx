
"use client";

import { useMemo } from "react";
import { collection, query, orderBy, where, limit } from "firebase/firestore";
import { useFirestore, useCollection } from "@/firebase";
import { Inbox, Clock, Megaphone, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageHeader } from "@/components/shared/page-header";

export default function WargaNotificationsPage() {
  const db = useFirestore();

  const notificationsQuery = useMemo(() => {
    if (!db) return null;
    return query(
      collection(db, "notifications"), 
      where("target", "==", "all"),
      orderBy("createdAt", "desc"),
      limit(20)
    );
  }, [db]);

  const { data: notifications, loading } = useCollection(notificationsQuery);

  return (
    <div className="space-y-6 pb-20">
      <PageHeader title="Notifikasi" backUrl="/warga" />

      <div className="px-2 space-y-4">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground">Memuat...</div>
        ) : notifications.length === 0 ? (
          <div className="p-20 text-center bg-white rounded-[2.5rem] android-shadow border border-dashed flex flex-col items-center gap-3">
            <Inbox className="w-12 h-12 text-muted-foreground/10" />
            <p className="text-muted-foreground text-sm font-bold">Tidak ada pesan untuk Anda</p>
          </div>
        ) : (
          notifications.map((n: any) => (
            <div key={n.id} className="bg-white p-5 rounded-[2.5rem] android-shadow border border-white/50 flex gap-4 items-start group active:scale-95 transition-transform">
              <Avatar className="w-12 h-12 bg-amber-50 shrink-0">
                <AvatarFallback className="text-amber-600 font-bold">
                  <Megaphone className="w-5 h-5" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-base font-bold text-foreground truncate">{n.title}</h3>
                  <span className="text-[10px] text-primary font-bold">RT INFO</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                  {n.message}
                </p>
                <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground/50 pt-3">
                  <Clock className="w-3 h-3" />
                  {n.createdAt?.toDate ? n.createdAt.toDate().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : 'Baru saja'}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/20 self-center" />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
