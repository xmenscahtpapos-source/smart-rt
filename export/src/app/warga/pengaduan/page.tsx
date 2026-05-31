
"use client";

import { useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Send, MessageSquareText, ShieldAlert, CheckCircle2, History } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";

export default function CitizenPengaduan() {
  const db = useFirestore();
  const { profile } = useAuth();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    if (!profile || profile.status !== 'aktif') {
      toast({ variant: "destructive", title: "Gagal", description: "Akun Anda belum aktif." });
      return;
    }
    
    setLoading(true);
    try {
      await addDoc(collection(db, "pengaduan"), {
        userId: profile.uid,
        userName: profile.name,
        address: profile.address,
        text,
        status: "baru",
        createdAt: new Date().toISOString(),
      });
      setText("");
      toast({ title: "Berhasil Terkirim", description: "Laporan Anda sedang diproses oleh pengurus." });
    } catch (err) {
      toast({ variant: "destructive", title: "Gagal Mengirim" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-32 max-w-md mx-auto">
      <PageHeader title="Lapor Keluhan" backUrl="/warga" />

      <div className="px-4 space-y-8">
        <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white">
          <CardHeader className="bg-rose-500 text-white p-8">
            <div className="w-14 h-14 bg-white/20 rounded-[1.25rem] flex items-center justify-center mb-4">
              <MessageSquareText className="w-7 h-7 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold">Pusat Aspirasi</CardTitle>
            <CardDescription className="text-rose-100 text-sm">Laporkan masalah di lingkungan Anda secara langsung ke pengurus.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="complaint" className="text-[10px] font-bold uppercase tracking-widest opacity-50 ml-1">Ketik Laporan Anda</Label>
                <Textarea 
                  id="complaint" 
                  placeholder="Contoh: Lampu jalan depan Blok A mati, atau sampah belum diangkut..." 
                  className="min-h-[180px] rounded-[1.5rem] border-none bg-slate-50 focus:ring-2 focus:ring-rose-500/20 p-5 text-sm leading-relaxed"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full h-14 text-lg font-bold rounded-[1.25rem] shadow-lg shadow-rose-100 bg-rose-500 hover:bg-rose-600 transition-all active:scale-95" disabled={loading || profile?.status !== 'aktif'}>
                {loading ? <span className="flex items-center gap-2">Mengirim...</span> : (
                  <span className="flex items-center gap-2">
                    <Send className="w-5 h-5" />
                    Kirim Laporan
                  </span>
                )}
              </Button>
              {profile?.status !== 'aktif' && (
                <div className="bg-rose-50 p-3 rounded-xl flex items-center gap-2 text-[10px] text-rose-600 font-bold justify-center">
                  <ShieldAlert className="w-3 h-3" /> AKUN ANDA HARUS AKTIF UNTUK MELAPOR
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Informational Cards */}
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-slate-50 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground">Respon Cepat</h4>
              <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5">Laporan Anda akan segera dinotifikasikan ke seluruh jajaran pengurus RT.</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-slate-50 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <History className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground">Pantau Status</h4>
              <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5">Dapatkan update real-time mengenai status tindak lanjut laporan Anda.</p>
            </div>
          </div>
        </div>
        
        <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Layanan 24 Jam Smart RT</p>
        </div>
      </div>
    </div>
  );
}
