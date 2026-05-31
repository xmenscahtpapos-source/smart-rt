
"use client";

import { useState, useMemo } from "react";
import { collection, query, orderBy, addDoc, serverTimestamp, limit } from "firebase/firestore";
import { useFirestore, useCollection } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Bell, Send, Loader2, History, CheckCircle2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageHeader } from "@/components/shared/page-header";

export default function AdminNotificationsPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ title: "", message: "" });

  const notificationsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, "notifications"), orderBy("createdAt", "desc"), limit(10));
  }, [db]);

  const { data: notifications, loading } = useCollection(notificationsQuery);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !formData.title || !formData.message) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "notifications"), {
        ...formData,
        target: "all",
        read: false,
        createdAt: serverTimestamp()
      });
      setFormData({ title: "", message: "" });
      toast({ title: "Berhasil", description: "Notifikasi telah dikirim." });
    } catch (err) {
      toast({ variant: "destructive", title: "Gagal Mengirim" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <PageHeader title="Notifikasi" backUrl="/admin" />

      <div className="px-2 space-y-8">
        <div className="bg-white p-6 rounded-[2.5rem] android-shadow border border-white/50">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label className="text-[10px] font-bold opacity-50 uppercase tracking-tighter">Judul Notifikasi</Label>
              <Input 
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})} 
                placeholder="Peringatan Keamanan / Info Iuran" 
                className="rounded-2xl h-11" 
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-bold opacity-50 uppercase tracking-tighter">Pesan Broadcast</Label>
              <Textarea 
                value={formData.message} 
                onChange={e => setFormData({...formData, message: e.target.value})} 
                placeholder="Ketik pesan yang akan dikirim ke warga..." 
                className="min-h-[120px] rounded-[2rem]" 
              />
            </div>
            <Button type="submit" className="w-full h-14 rounded-3xl shadow-lg bg-primary mt-2" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Send className="w-5 h-5 mr-2" />}
              Kirim Ke Seluruh Warga
            </Button>
          </form>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <History className="w-4 h-4" /> Riwayat Terakhir
            </h2>
          </div>
          
          <div className="space-y-3">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Memuat...</div>
            ) : notifications.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-[2rem] border border-dashed text-muted-foreground text-xs">
                Belum ada notifikasi terkirim.
              </div>
            ) : (
              notifications.map((n: any) => (
                <div key={n.id} className="bg-white p-4 rounded-3xl android-shadow border border-white/50 flex gap-4 items-start">
                  <Avatar className="w-10 h-10 bg-emerald-50 shrink-0">
                    <AvatarFallback className="text-emerald-600 font-bold">
                      <Bell className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="text-sm font-bold text-foreground truncate">{n.title}</h3>
                      <span className="text-[8px] text-emerald-500 font-bold flex items-center gap-0.5">
                        <CheckCircle2 className="w-2 h-2" /> TERKIRIM
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">{n.message}</p>
                    <p className="text-[9px] text-muted-foreground/40 mt-1">
                      {n.createdAt?.toDate ? n.createdAt.toDate().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'Baru saja'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
