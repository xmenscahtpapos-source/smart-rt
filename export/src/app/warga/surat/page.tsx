
"use client";

import { useState, useMemo } from "react";
import { addDoc, collection, query, where, orderBy } from "firebase/firestore";
import { useFirestore, useCollection } from "@/firebase";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { FileText, Send, Clock, Loader2, Info, ChevronRight } from "lucide-react";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { PageHeader } from "@/components/shared/page-header";

export default function WargaSuratPage() {
  const db = useFirestore();
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  
  const [formData, setFormData] = useState({
    type: "",
    purpose: "",
  });

  const suratQuery = useMemo(() => {
    if (!db || !profile?.uid) return null;
    return query(
      collection(db, "surat"),
      where("userId", "==", profile.uid),
      orderBy("createdAt", "desc")
    );
  }, [db, profile?.uid]);

  const { data: suratList, loading: loadingList } = useCollection(suratQuery);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !profile) return;
    if (!formData.type || !formData.purpose) {
      toast({ variant: "destructive", title: "Gagal", description: "Lengkapi semua data." });
      return;
    }

    setLoadingSubmit(true);
    const suratData = {
      userId: profile.uid,
      userName: profile.name,
      userAddress: profile.address || "",
      type: formData.type,
      purpose: formData.purpose,
      status: "diajukan",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addDoc(collection(db, "surat"), suratData)
      .then(() => {
        toast({ title: "Berhasil", description: "Permohonan surat telah diajukan." });
        setFormData({ type: "", purpose: "" });
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: "surat",
          operation: "create",
          requestResourceData: suratData,
        });
        errorEmitter.emit("permission-error", permissionError);
      })
      .finally(() => setLoadingSubmit(false));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "diajukan": return <Badge variant="secondary" className="bg-blue-50 text-blue-700 text-[10px] rounded-full px-3">Diajukan</Badge>;
      case "diproses": return <Badge variant="secondary" className="bg-amber-50 text-amber-700 text-[10px] rounded-full px-3">Diproses</Badge>;
      case "selesai": return <Badge variant="default" className="bg-emerald-50 text-emerald-700 text-[10px] rounded-full px-3">Selesai</Badge>;
      case "ditolak": return <Badge variant="destructive" className="bg-red-50 text-red-700 text-[10px] rounded-full px-3">Ditolak</Badge>;
      default: return <Badge className="text-[10px] rounded-full px-3">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-32 max-w-md mx-auto overflow-x-hidden">
      <PageHeader title="Surat Pengantar RT" backUrl="/warga" />

      <div className="px-4 space-y-6">
        {/* Instruction Card */}
        <Card className="border-none shadow-sm rounded-[1.5rem] bg-emerald-50 overflow-hidden">
          <CardContent className="p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0">
              <Info className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-emerald-900">Alur Pengurusan</h3>
              <p className="text-[11px] text-emerald-700 leading-relaxed mt-1">
                Pilih jenis surat, lengkapi tujuan, dan klik kirim. Pengurus akan memverifikasi dan Anda akan menerima notifikasi jika surat siap dicetak.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Application Form Card */}
        <Card className="border-none shadow-md rounded-[1.5rem] bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Ajukan Surat Baru
            </CardTitle>
            <CardDescription className="text-xs">Layanan administrasi cepat untuk warga.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold opacity-50 ml-1">Jenis Surat</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                  <SelectTrigger className="rounded-2xl h-12 w-full bg-slate-50 border-none shadow-none focus:ring-1">
                    <SelectValue placeholder="Pilih Jenis Surat" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="Surat Domisili">Surat Domisili</SelectItem>
                    <SelectItem value="Surat Pengantar SKCK">Surat Pengantar SKCK</SelectItem>
                    <SelectItem value="Surat Keterangan Usaha">Surat Keterangan Usaha</SelectItem>
                    <SelectItem value="Surat Pindah">Surat Pindah</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold opacity-50 ml-1">Tujuan / Keperluan</Label>
                <Input 
                  placeholder="Contoh: Mengurus KTP baru" 
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  className="rounded-2xl h-12 w-full bg-slate-50 border-none shadow-none focus:ring-1 px-4"
                />
              </div>
              <Button type="submit" className="w-full rounded-2xl h-14 bg-primary shadow-lg shadow-emerald-100 text-lg font-bold" disabled={loadingSubmit}>
                {loadingSubmit ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Send className="w-5 h-5 mr-2" />}
                Kirim Pengajuan
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* History Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Clock className="w-4 h-4" /> Riwayat Pengajuan
            </h2>
          </div>
          
          <div className="space-y-3">
            {loadingList ? (
              <div className="p-12 text-center text-muted-foreground bg-white rounded-3xl border border-dashed">Memuat data...</div>
            ) : suratList.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground bg-white rounded-3xl border border-dashed text-xs italic">Belum ada pengajuan.</div>
            ) : (
              suratList.map((s: any) => (
                <div key={s.id} className="bg-white p-4 rounded-3xl shadow-sm border border-slate-50 flex items-center gap-4 active:scale-95 transition-transform">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0">
                    <FileText className="w-6 h-6 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-foreground truncate">{s.type}</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate italic">"{s.purpose}"</p>
                    <p className="text-[9px] text-muted-foreground/50 mt-1">
                      {new Date(s.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    {getStatusBadge(s.status)}
                    <ChevronRight className="w-4 h-4 text-slate-200" />
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
