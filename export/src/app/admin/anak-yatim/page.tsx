
"use client";

import { useState, useMemo } from "react";
import { collection, query, doc, updateDoc, addDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { useFirestore, useCollection } from "@/firebase";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Heart, 
  Search, 
  Edit2, 
  Trash2, 
  Plus, 
  Loader2,
  Calendar,
  School,
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
import { PageHeader } from "@/components/shared/page-header";

export default function AdminAnakYatimPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [ageFilter, setAgeFilter] = useState<string>("all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    nama: "",
    jenisKelamin: "Laki-laki",
    tanggalLahir: "",
    namaAyah: "",
    namaIbu: "",
    alamat: "",
    noHpWali: "",
    pendidikan: "SD",
    statusSekolah: "Sekolah",
    foto: "",
    keterangan: ""
  });

  const orphansQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, "anak_yatim"));
  }, [db]);

  const { data: orphans, loading } = useCollection(orphansQuery);

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const stats = useMemo(() => {
    if (!orphans) return { total: 0, sd: 0, smp: 0, sma: 0 };
    return orphans.reduce((acc: any, curr: any) => {
      acc.total++;
      const age = calculateAge(curr.tanggalLahir);
      if (age >= 7 && age <= 12) acc.sd++;
      else if (age >= 13 && age <= 15) acc.smp++;
      else if (age >= 16 && age <= 18) acc.sma++;
      return acc;
    }, { total: 0, sd: 0, smp: 0, sma: 0 });
  }, [orphans]);

  const filteredOrphans = useMemo(() => {
    if (!orphans) return [];
    return orphans.filter((o: any) => {
      const matchesSearch = o.nama?.toLowerCase().includes(searchTerm.toLowerCase());
      const age = calculateAge(o.tanggalLahir);
      let matchesAge = true;
      if (ageFilter === "sd") matchesAge = age >= 7 && age <= 12;
      else if (ageFilter === "smp") matchesAge = age >= 13 && age <= 15;
      else if (ageFilter === "sma") matchesAge = age >= 16 && age <= 18;
      return matchesSearch && matchesAge;
    });
  }, [orphans, searchTerm, ageFilter]);

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      nama: item.nama || "",
      jenisKelamin: item.jenisKelamin || "Laki-laki",
      tanggalLahir: item.tanggalLahir || "",
      namaAyah: item.namaAyah || "",
      namaIbu: item.namaIbu || "",
      alamat: item.alamat || "",
      noHpWali: item.noHpWali || "",
      pendidikan: item.pendidikan || "SD",
      statusSekolah: item.statusSekolah || "Sekolah",
      foto: item.foto || "",
      keterangan: item.keterangan || ""
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
    setFormData({
      nama: "",
      jenisKelamin: "Laki-laki",
      tanggalLahir: "",
      namaAyah: "",
      namaIbu: "",
      alamat: "",
      noHpWali: "",
      pendidikan: "SD",
      statusSekolah: "Sekolah",
      foto: "",
      keterangan: ""
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    setIsSubmitting(true);

    const payload = { 
      ...formData, 
      usia: calculateAge(formData.tanggalLahir),
      updatedAt: serverTimestamp() 
    };

    try {
      if (editingItem) {
        const docRef = doc(db, "anak_yatim", editingItem.id);
        await updateDoc(docRef, payload);
        toast({ title: "Berhasil", description: "Data anak yatim diperbarui." });
      } else {
        const newData = { ...payload, createdAt: serverTimestamp() };
        await addDoc(collection(db, "anak_yatim"), newData);
        toast({ title: "Berhasil", description: "Anak yatim baru ditambahkan." });
      }
      handleCloseDialog();
    } catch (error: any) {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ 
          path: editingItem ? `anak_yatim/${editingItem.id}` : 'anak_yatim', 
          operation: editingItem ? 'update' : 'create', 
          requestResourceData: payload 
        }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!db) return;
    try {
      await deleteDoc(doc(db, "anak_yatim", id));
      toast({ title: "Dihapus", description: "Data telah dihapus." });
    } catch (err) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `anak_yatim/${id}`, operation: 'delete' }));
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <PageHeader title="Data Anak Yatim" backUrl="/admin" />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-2">
        <Card className="rounded-3xl border-none shadow-sm bg-pink-50 text-pink-700">
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <Heart className="w-5 h-5 mb-1" />
            <p className="text-[10px] font-bold uppercase opacity-60">Total</p>
            <p className="text-xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-none shadow-sm bg-blue-50 text-blue-700">
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <School className="w-5 h-5 mb-1" />
            <p className="text-[10px] font-bold uppercase opacity-60">SD</p>
            <p className="text-xl font-bold">{stats.sd}</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-none shadow-sm bg-indigo-50 text-indigo-700">
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <School className="w-5 h-5 mb-1" />
            <p className="text-[10px] font-bold uppercase opacity-60">SMP</p>
            <p className="text-xl font-bold">{stats.smp}</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-none shadow-sm bg-emerald-50 text-emerald-700">
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <School className="w-5 h-5 mb-1" />
            <p className="text-[10px] font-bold uppercase opacity-60">SMA</p>
            <p className="text-xl font-bold">{stats.sma}</p>
          </CardContent>
        </Card>
      </div>

      <div className="px-2">
        <div className="flex flex-col gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Cari Nama..." 
              className="pl-11 h-12 rounded-3xl bg-white border-none android-shadow"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {['all', 'sd', 'smp', 'sma'].map((f) => (
              <Button 
                key={f} 
                variant={ageFilter === f ? "default" : "outline"} 
                size="sm" 
                className="rounded-full text-[10px] uppercase font-bold px-4 h-8"
                onClick={() => setAgeFilter(f)}
              >
                {f === 'all' ? 'Semua Usia' : `Usia ${f.toUpperCase()}`}
              </Button>
            ))}
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full h-12 rounded-2xl bg-primary shadow-lg mb-6">
              <Plus className="w-4 h-4 mr-2" />
              Tambah Data Baru
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-[2rem] w-[95%] max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle>{editingItem ? "Ubah Data Anak" : "Tambah Data Anak"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider opacity-50 font-bold">Nama Lengkap</Label>
                <Input value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} required className="rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wider opacity-50 font-bold">Jenis Kelamin</Label>
                  <select 
                    value={formData.jenisKelamin} 
                    onChange={e => setFormData({...formData, jenisKelamin: e.target.value})}
                    className="w-full h-10 px-3 py-2 rounded-xl border border-input bg-background text-xs"
                  >
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wider opacity-50 font-bold">Tanggal Lahir</Label>
                  <Input type="date" value={formData.tanggalLahir} onChange={e => setFormData({...formData, tanggalLahir: e.target.value})} required className="rounded-xl" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wider opacity-50 font-bold">Nama Alm. Ayah</Label>
                  <Input value={formData.namaAyah} onChange={e => setFormData({...formData, namaAyah: e.target.value})} className="rounded-xl" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wider opacity-50 font-bold">Nama Ibu</Label>
                  <Input value={formData.namaIbu} onChange={e => setFormData({...formData, namaIbu: e.target.value})} className="rounded-xl" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wider opacity-50 font-bold">Pendidikan</Label>
                  <select 
                    value={formData.pendidikan} 
                    onChange={e => setFormData({...formData, pendidikan: e.target.value})}
                    className="w-full h-10 px-3 py-2 rounded-xl border border-input bg-background text-xs"
                  >
                    <option value="Belum Sekolah">Belum Sekolah</option>
                    <option value="TK">TK</option>
                    <option value="SD">SD</option>
                    <option value="SMP">SMP</option>
                    <option value="SMA">SMA</option>
                    <option value="Kuliah">Kuliah</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wider opacity-50 font-bold">Status Sekolah</Label>
                  <select 
                    value={formData.statusSekolah} 
                    onChange={e => setFormData({...formData, statusSekolah: e.target.value})}
                    className="w-full h-10 px-3 py-2 rounded-xl border border-input bg-background text-xs"
                  >
                    <option value="Sekolah">Sekolah</option>
                    <option value="Tidak Sekolah">Tidak Sekolah</option>
                    <option value="Putus Sekolah">Putus Sekolah</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider opacity-50 font-bold">No. HP Wali</Label>
                <Input value={formData.noHpWali} onChange={e => setFormData({...formData, noHpWali: e.target.value})} className="rounded-xl" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider opacity-50 font-bold">Alamat</Label>
                <Input value={formData.alamat} onChange={e => setFormData({...formData, alamat: e.target.value})} className="rounded-xl" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider opacity-50 font-bold">URL Foto (Optional)</Label>
                <Input value={formData.foto} onChange={e => setFormData({...formData, foto: e.target.value})} placeholder="https://..." className="rounded-xl" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider opacity-50 font-bold">Keterangan</Label>
                <Textarea value={formData.keterangan} onChange={e => setFormData({...formData, keterangan: e.target.value})} className="rounded-xl min-h-[80px]" />
              </div>
              <DialogFooter className="pt-4 flex gap-2">
                <Button type="button" variant="ghost" className="flex-1" onClick={handleCloseDialog}>Batal</Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1 rounded-xl">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Simpan"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <div className="space-y-3">
          {loading ? (
            <div className="p-12 text-center text-muted-foreground">Memuat...</div>
          ) : filteredOrphans.length === 0 ? (
            <div className="p-20 text-center bg-white rounded-[2rem] border border-dashed text-muted-foreground text-sm">
              <Heart className="w-12 h-12 mx-auto mb-4 opacity-10" />
              Tidak ada data ditemukan.
            </div>
          ) : (
            filteredOrphans.map((item: any) => (
              <div key={item.id} className="bg-white p-4 rounded-3xl android-shadow border border-white/50 flex items-center gap-4">
                <Avatar className="w-14 h-14 bg-pink-50 border-2 border-pink-100">
                  <AvatarImage src={item.foto || `https://picsum.photos/seed/${item.id}/200`} />
                  <AvatarFallback className="text-pink-600 font-bold">{item.nama?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-foreground truncate">{item.nama}</h3>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {calculateAge(item.tanggalLahir)} Tahun • {item.pendidikan}
                  </p>
                  <p className="text-[9px] text-muted-foreground mt-0.5 truncate italic">Wali: {item.noHpWali || '-'}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 rounded-full" onClick={() => handleEdit(item)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 rounded-full">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-3xl w-[90%] max-w-sm mx-auto">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Data?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Apakah Anda yakin ingin menghapus data {item.nama}? Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="flex-row gap-2 mt-4">
                        <AlertDialogCancel className="flex-1 mt-0 rounded-2xl h-11">Batal</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDelete(item.id)}
                          className="flex-1 rounded-2xl h-11 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Hapus
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
