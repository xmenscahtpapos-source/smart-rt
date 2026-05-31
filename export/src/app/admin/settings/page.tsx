
"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Save, Loader2, Home, User, CreditCard, Image as ImageIcon } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";

export default function AdminSettingsPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    namaRt: "",
    namaKetuaRt: "",
    namaBendahara: "",
    alamatSekretariat: "",
    waNumber: "",
    logoUrl: "",
    defaultIuran: 0
  });

  useEffect(() => {
    async function fetchSettings() {
      if (!db) return;
      try {
        const docRef = doc(db, "settings", "rt_config");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setFormData(docSnap.data() as any);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, [db]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    setIsSaving(true);
    try {
      await setDoc(doc(db, "settings", "rt_config"), formData);
      toast({ title: "Tersimpan", description: "Pengaturan RT telah diperbarui." });
    } catch (err) {
      toast({ variant: "destructive", title: "Gagal Menyimpan" });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="p-12 text-center">Memuat...</div>;

  return (
    <div className="space-y-6 pb-20">
      <PageHeader title="Setelan RT" backUrl="/admin" />

      <form onSubmit={handleSubmit} className="px-2 space-y-6">
        <div className="bg-white p-6 rounded-[2.5rem] android-shadow border border-white/50 space-y-6">
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-2">
              <Home className="w-3 h-3" /> Identitas Lingkungan
            </h2>
            <div className="space-y-1">
              <Label className="text-[10px] font-bold opacity-50 uppercase tracking-tighter">Nama RT / RW</Label>
              <Input value={formData.namaRt} onChange={e => setFormData({...formData, namaRt: e.target.value})} className="rounded-2xl h-11" placeholder="RT 01 / RW 02" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-bold opacity-50 uppercase tracking-tighter">Alamat Sekretariat</Label>
              <Input value={formData.alamatSekretariat} onChange={e => setFormData({...formData, alamatSekretariat: e.target.value})} className="rounded-2xl h-11" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-bold opacity-50 uppercase tracking-tighter">No. WhatsApp Layanan</Label>
              <Input value={formData.waNumber} onChange={e => setFormData({...formData, waNumber: e.target.value})} className="rounded-2xl h-11" placeholder="628..." />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h2 className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-2">
              <User className="w-3 h-3" /> Kepengurusan
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold opacity-50 uppercase tracking-tighter">Ketua RT</Label>
                <Input value={formData.namaKetuaRt} onChange={e => setFormData({...formData, namaKetuaRt: e.target.value})} className="rounded-2xl h-11" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold opacity-50 uppercase tracking-tighter">Bendahara</Label>
                <Input value={formData.namaBendahara} onChange={e => setFormData({...formData, namaBendahara: e.target.value})} className="rounded-2xl h-11" />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h2 className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-2">
              <CreditCard className="w-3 h-3" /> Keuangan
            </h2>
            <div className="space-y-1">
              <Label className="text-[10px] font-bold opacity-50 uppercase tracking-tighter">Nominal Iuran Default (IDR)</Label>
              <Input 
                type="number" 
                value={formData.defaultIuran} 
                onChange={e => setFormData({...formData, defaultIuran: Number(e.target.value)})} 
                className="rounded-2xl h-11" 
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h2 className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-2">
              <ImageIcon className="w-3 h-3" /> Branding
            </h2>
            <div className="space-y-1">
              <Label className="text-[10px] font-bold opacity-50 uppercase tracking-tighter">URL Logo RT</Label>
              <Input value={formData.logoUrl} onChange={e => setFormData({...formData, logoUrl: e.target.value})} className="rounded-2xl h-11" placeholder="https://..." />
            </div>
          </div>
        </div>

        <Button type="submit" size="lg" className="w-full h-14 rounded-3xl shadow-xl bg-primary" disabled={isSaving}>
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
          Simpan Konfigurasi
        </Button>
      </form>
    </div>
  );
}
