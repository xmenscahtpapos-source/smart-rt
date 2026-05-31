
"use client";

import { useState, useMemo } from "react";
import { collection, query, doc, updateDoc, addDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { useFirestore, useCollection } from "@/firebase";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  UserPlus, 
  Search, 
  Edit2, 
  Trash2, 
  Users, 
  Loader2,
  Home,
  ShieldCheck
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

export default function AdminUsersPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [rtFilter, setRtFilter] = useState("all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    nik: "",
    kk: "",
    phone: "",
    address: "",
    rt: "",
    rw: "",
    status: "aktif"
  });

  const usersQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, "users"));
  }, [db]);

  const { data: allUsers, loading } = useCollection(usersQuery);

  const filteredUsers = useMemo(() => {
    if (!allUsers) return [];
    return allUsers.filter((u: any) => {
      const matchesSearch = u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          u.nik?.includes(searchTerm);
      const matchesRt = rtFilter === "all" || u.rt === rtFilter;
      return matchesSearch && matchesRt && u.role === "warga";
    });
  }, [allUsers, searchTerm, rtFilter]);

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setFormData({
      name: user.name || "",
      email: user.email || "",
      nik: user.nik || "",
      kk: user.kk || "",
      phone: user.phone || "",
      address: user.address || "",
      rt: user.rt || "",
      rw: user.rw || "",
      status: user.status || "aktif"
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingUser(null);
    setFormData({ 
      name: "", email: "", nik: "", kk: "", phone: "", 
      address: "", rt: "", rw: "", status: "aktif" 
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    setIsSubmitting(true);

    const payload = { ...formData, updatedAt: serverTimestamp() };

    try {
      if (editingUser) {
        const userRef = doc(db, "users", editingUser.id);
        await updateDoc(userRef, payload);
        toast({ title: "Berhasil", description: "Data warga diperbarui." });
      } else {
        const newUser = { 
          ...formData, 
          role: "warga", 
          createdAt: serverTimestamp(), 
          uid: Math.random().toString(36).substring(7) 
        };
        await addDoc(collection(db, "users"), newUser);
        toast({ title: "Berhasil", description: "Warga baru ditambahkan." });
      }
      handleCloseDialog();
    } catch (error: any) {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ 
          path: editingUser ? `users/${editingUser.id}` : 'users', 
          operation: editingUser ? 'update' : 'create', 
          requestResourceData: payload 
        }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!db) return;
    try {
      await deleteDoc(doc(db, "users", userId));
      toast({ title: "Dihapus", description: "Data warga telah dihapus." });
    } catch (err) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `users/${userId}`, operation: 'delete' }));
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <PageHeader title="Data Warga" backUrl="/admin" />

      <div className="px-2">
        <div className="flex flex-col gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Cari Nama, NIK, atau Email..." 
              className="pl-11 h-12 rounded-3xl bg-white border-none android-shadow"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            <Button 
              variant={rtFilter === 'all' ? "default" : "outline"} 
              size="sm" 
              className="rounded-full h-8 text-[10px] font-bold uppercase"
              onClick={() => setRtFilter('all')}
            >Semua RT</Button>
            {['01', '02', '03', '04'].map(rt => (
              <Button 
                key={rt}
                variant={rtFilter === rt ? "default" : "outline"} 
                size="sm" 
                className="rounded-full h-8 text-[10px] font-bold uppercase"
                onClick={() => setRtFilter(rt)}
              >RT {rt}</Button>
            ))}
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full h-12 rounded-2xl bg-primary shadow-lg mb-6">
              <UserPlus className="w-4 h-4 mr-2" />
              Tambah Warga Baru
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-[2rem] w-[95%] max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle>{editingUser ? "Ubah Data Warga" : "Warga Baru"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wider opacity-50 font-bold">NIK</Label>
                  <Input value={formData.nik} onChange={e => setFormData({...formData, nik: e.target.value})} placeholder="320..." className="rounded-xl" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wider opacity-50 font-bold">No. KK</Label>
                  <Input value={formData.kk} onChange={e => setFormData({...formData, kk: e.target.value})} placeholder="320..." className="rounded-xl" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider opacity-50 font-bold">Nama Lengkap</Label>
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className="rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wider opacity-50 font-bold">No. HP</Label>
                  <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="rounded-xl" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wider opacity-50 font-bold">Status</Label>
                  <select 
                    value={formData.status} 
                    onChange={e => setFormData({...formData, status: e.target.value})}
                    className="w-full h-10 px-3 py-2 rounded-xl border border-input bg-background text-xs"
                  >
                    <option value="aktif">Aktif</option>
                    <option value="nonaktif">Non-Aktif</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider opacity-50 font-bold">Alamat Rumah (No. Rumah)</Label>
                <Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Blok A No. 1" className="rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wider opacity-50 font-bold">RT</Label>
                  <Input value={formData.rt} onChange={e => setFormData({...formData, rt: e.target.value})} placeholder="01" className="rounded-xl" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wider opacity-50 font-bold">RW</Label>
                  <Input value={formData.rw} onChange={e => setFormData({...formData, rw: e.target.value})} placeholder="05" className="rounded-xl" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider opacity-50 font-bold">Email</Label>
                <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="rounded-xl" />
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
          ) : filteredUsers.length === 0 ? (
            <div className="p-20 text-center bg-white rounded-[2rem] border border-dashed text-muted-foreground text-sm">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-10" />
              Tidak ada data warga.
            </div>
          ) : (
            filteredUsers.map((user: any) => (
              <div key={user.id} className="bg-white p-4 rounded-3xl android-shadow border border-white/50 flex items-center gap-4">
                <Avatar className="w-12 h-12 bg-primary/10">
                  <AvatarFallback className="text-primary font-bold">{user.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-foreground truncate">{user.name}</h3>
                    {user.status === 'aktif' && <ShieldCheck className="w-3 h-3 text-primary" />}
                  </div>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-2">
                    <Home className="w-3 h-3 opacity-40" /> {user.address || '-'} • RT {user.rt || '00'}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 rounded-full" onClick={() => handleEdit(user)}>
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
                        <AlertDialogTitle>Hapus Warga?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Apakah Anda yakin ingin menghapus data warga {user.name}? Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="flex-row gap-2 mt-4">
                        <AlertDialogCancel className="flex-1 mt-0 rounded-2xl h-11">Batal</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDelete(user.id)}
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
