
"use client";

import { useState, useMemo } from "react";
import { collection, query, orderBy, addDoc, deleteDoc, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { useFirestore, useCollection } from "@/firebase";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Store, 
  Plus, 
  Search, 
  Trash2, 
  Loader2,
  Phone,
  User,
  Edit2,
  MapPin,
  CheckCircle2,
  XCircle
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";

export default function AdminUMKMPage() {
  const db = useFirestore();
  const { profile } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    namaUsaha: "",
    pemilik: "",
    kategori: "Kuliner",
    deskripsi: "",
    whatsapp: "",
    alamat: "",
    foto: "",
    statusAktif: true
  });

  const umkmQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, "umkm"), orderBy("createdAt", "desc"));
  }, [db]);

  const { data: businesses, loading } = useCollection(umkmQuery);

  const filteredBusinesses = useMemo(() => {
    if (!businesses) return [];
    return businesses.filter((b: any) => 
      b.namaUsaha?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.pemilik?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [businesses, searchTerm]);

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      namaUsaha: item.namaUsaha || "",
      pemilik: item.pemilik || "",
      kategori: item.kategori || "Kuliner",
      deskripsi: item.deskripsi || "",
      whatsapp: item.whatsapp || "",
      alamat: item.alamat || "",
      foto: item.foto || "",
      statusAktif: item.statusAktif ?? true
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
    setFormData({
      namaUsaha: "",
      pemilik: "",
      kategori: "Kuliner",
      deskripsi: "",
      whatsapp: "",
      alamat: "",
      foto: "",
      statusAktif: true
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !profile) return;
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        updatedAt: serverTimestamp()
      };

      if (editingItem) {
        await updateDoc(doc(db, "umkm", editingItem.id), payload);
        toast({ title: "Berhasil", description: "Data usaha diperbarui." });
      } else {
        await addDoc(collection(db, "umkm"), {
          ...payload,
          userId: profile.uid,
          createdAt: serverTimestamp()
        });
        toast({ title: "Berhasil", description: "Usaha baru telah didaftarkan." });
      }
      handleCloseDialog();
    } catch (err) {
      toast({ variant: "destructive", title: "Gagal Menyimpan" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!db) return;
    try {
      await deleteDoc(doc(db, "umkm", id));
      toast({ title: "Dihapus", description: "Data telah dihapus." });
    } catch (err) {
      toast({ variant: "destructive", title: "Gagal Menghapus" });
    }
  };

  const toggleStatus = async (item: any) => {
    if (!db) return;
    const newStatus = !item.statusAktif;
    try {
      await updateDoc(doc(db, "umkm", item.id), { statusAktif: newStatus });
      toast({ title: "Status Diubah", description: `Usaha kini ${newStatus ? 'Aktif' : 'Non-Aktif'}.` });
    } catch (err) {
      toast({ variant: "destructive", title: "Gagal mengubah status" });
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <PageHeader title="UMKM Warga" backUrl="/admin" />

      <div className="px-2">
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Cari Produk atau Penjual..." 
            className="pl-11 h-14 rounded-3xl bg-white border-none android-shadow"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full h-14 rounded-3xl bg-teal-600 shadow-lg mb-6 hover:bg-teal-700 text-white">
              <Plus className="w-5 h-5 mr-2" /> Promosikan Usaha Baru
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-[2.5rem] w-[95%] max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle>{editingItem ? "Edit UMKM" : "Pendaftaran UMKM"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase opacity-50">Nama Usaha / Produk</Label>
                <Input value={formData.namaUsaha} onChange={e => setFormData({...formData, namaUsaha: e.target.value})} placeholder="Contoh: Catering Bu Budi" className="rounded-2xl h-12" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase opacity-50">Pemilik</Label>
                  <Input value={formData.pemilik} onChange={e => setFormData({...formData, pemilik: e.target.value})} className="rounded-2xl h-12" required />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase opacity-50">Kategori</Label>
                  <select 
                    value={formData.kategori} 
                    onChange={e => setFormData({...formData, kategori: e.target.value})}
                    className="w-full h-12 px-4 rounded-2xl border bg-background text-sm"
                  >
                    <option value="Kuliner">Kuliner</option>
                    <option value="Jasa">Jasa</option>
                    <option value="Kerajinan">Kerajinan</option>
                    <option value="Pakaian">Pakaian</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase opacity-50">No. WhatsApp (Aktif)</Label>
                <Input value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} placeholder="628..." className="rounded-2xl h-12" required />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase opacity-50">Alamat Usaha</Label>
                <Input value={formData.alamat} onChange={e => setFormData({...formData, alamat: e.target.value})} placeholder="Blok A No. 10" className="rounded-2xl h-12" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase opacity-50">Deskripsi Singkat</Label>
                <Textarea value={formData.deskripsi} onChange={e => setFormData({...formData, deskripsi: e.target.value})} placeholder="Jelaskan produk unggulan Anda" className="rounded-2xl min-h-[80px]" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase opacity-50">Link Foto Produk (URL)</Label>
                <Input value={formData.foto} onChange={e => setFormData({...formData, foto: e.target.value})} placeholder="https://..." className="rounded-2xl h-12" />
              </div>
              <DialogFooter className="pt-4 gap-2">
                <Button type="button" variant="ghost" className="flex-1 rounded-2xl" onClick={handleCloseDialog}>Batal</Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : editingItem ? "Simpan Perubahan" : "Simpan & Publikasikan"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <div className="space-y-4">
          {loading ? (
            <div className="p-12 text-center text-muted-foreground">Memuat data UMKM...</div>
          ) : filteredBusinesses.length === 0 ? (
            <div className="p-20 text-center bg-white rounded-[2.5rem] border border-dashed text-muted-foreground text-sm">
              <Store className="w-12 h-12 mx-auto mb-4 opacity-10" />
              Belum ada UMKM terdaftar.
            </div>
          ) : (
            filteredBusinesses.map((b: any) => (
              <div key={b.id} className="bg-white overflow-hidden rounded-[2.5rem] android-shadow border border-white/50 mb-4 group">
                <div className="h-40 bg-gray-100 relative">
                  <img src={b.foto || `https://picsum.photos/seed/${b.id}/400/200`} alt={b.namaUsaha} className="w-full h-full object-cover" />
                  <Badge className={cn(
                    "absolute top-4 right-4 border-none rounded-xl",
                    b.statusAktif !== false ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                  )}>
                    {b.statusAktif !== false ? 'Aktif' : 'Non-Aktif'}
                  </Badge>
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-white/90 text-teal-700 border-none rounded-xl">{b.kategori}</Badge>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-base font-bold text-foreground">{b.namaUsaha}</h3>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <User className="w-3 h-3" /> {b.pemilik}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-teal-600 rounded-full" onClick={() => handleEdit(b)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className={cn("h-8 w-8 rounded-full", b.statusAktif !== false ? "text-emerald-500" : "text-rose-500")} onClick={() => toggleStatus(b)}>
                        {b.statusAktif !== false ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 rounded-full">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-3xl w-[90%] max-w-sm mx-auto">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Hapus UMKM?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Apakah Anda yakin ingin menghapus data usaha {b.namaUsaha}?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="flex-row gap-2 mt-4">
                            <AlertDialogCancel className="flex-1 mt-0 rounded-2xl h-11">Batal</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDelete(b.id)}
                              className="flex-1 rounded-2xl h-11 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Hapus
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{b.deskripsi || "Tanpa deskripsi produk."}</p>
                  <div className="flex items-center gap-4 pt-4 border-t">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold opacity-60">
                      <Phone className="w-3 h-3" /> {b.whatsapp}
                    </div>
                    {b.alamat && (
                      <div className="flex items-center gap-1.5 text-[10px] font-bold opacity-60">
                        <MapPin className="w-3 h-3" /> {b.alamat}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
