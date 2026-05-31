
"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useAuth as useFirebaseInstance, useFirestore, useStorage } from "@/firebase";
import { signOut } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { useRouter } from "next/navigation";
import { 
  ShieldCheck, 
  LogOut, 
  Mail, 
  UserCircle,
  Camera,
  Loader2,
  ChevronRight,
  Phone,
  MapPin,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
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
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";

export default function AdminProfilePage() {
  const { profile } = useAuth();
  const auth = useFirebaseInstance();
  const db = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUpdating, setIsUpdating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [name, setName] = useState(profile?.name || "");
  const [phone, setPhone] = useState(profile?.phone || "");

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      localStorage.clear();
      sessionStorage.clear();
      router.replace("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDimension = 800;
          if (width > height) {
            if (width > maxDimension) { height *= maxDimension / width; width = maxDimension; }
          } else {
            if (height > maxDimension) { width *= maxDimension / height; height = maxDimension; }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (blob) resolve(blob); else reject(new Error('Canvas conversion failed'));
          }, 'image/webp', 0.8);
        };
      };
      reader.onerror = reject;
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !storage || !profile?.uid || !db) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ variant: "destructive", title: "File Terlalu Besar", description: "Maksimal 2 MB." });
      return;
    }
    setUploading(true);
    try {
      const compressedBlob = await compressImage(file);
      const storageRef = ref(storage, `profile-images/${profile.uid}`);
      const uploadTask = uploadBytesResumable(storageRef, compressedBlob);
      uploadTask.on('state_changed', 
        (snapshot) => setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100), 
        (error) => { toast({ variant: "destructive", title: "Gagal", description: error.message }); setUploading(false); }, 
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          await updateDoc(doc(db, "users", profile.uid), { photoURL: url });
          toast({ title: "Berhasil", description: "Foto diperbarui." });
          setUploading(false);
          setUploadProgress(0);
        }
      );
    } catch (err) { setUploading(false); }
  };

  const handleUpdate = async () => {
    if (!db || !profile?.uid) return;
    setIsUpdating(true);
    try {
      await updateDoc(doc(db, "users", profile.uid), { name, phone });
      toast({ title: "Berhasil", description: "Profil diperbarui." });
    } catch (err) { toast({ variant: "destructive", title: "Gagal" }); }
    finally { setIsUpdating(false); }
  };

  const items = [
    { label: "Ubah Nama", icon: UserCircle, action: "name", value: profile?.name },
    { label: "Ubah Nomor HP", icon: Phone, action: "phone", value: profile?.phone },
    { label: "Ubah Foto Profil", icon: Camera, onClick: () => fileInputRef.current?.click() },
    { label: "Ubah Password", icon: Lock, onClick: () => toast({ title: "Info", description: "Cek email pemulihan." }) },
  ];

  return (
    <div className="space-y-6 pb-24">
      <PageHeader title="Profil Admin" backUrl="/admin" />
      
      <div className="px-2">
        <div className="bg-secondary text-white p-8 rounded-[3rem] shadow-xl flex flex-col items-center gap-4 mb-8">
          <div className="relative">
            <Avatar className="w-24 h-24 border-4 border-white/20">
              <AvatarImage src={profile?.photoURL || `https://picsum.photos/seed/admin/200`} />
              <AvatarFallback className="bg-white/10 text-white text-3xl font-bold">A</AvatarFallback>
            </Avatar>
            <button 
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full shadow-lg border-2 border-secondary bg-white text-secondary flex items-center justify-center active:scale-90 transition-transform"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
          </div>

          {uploading && <div className="w-full max-w-[150px]"><Progress value={uploadProgress} className="h-1 bg-white/20" /></div>}

          <div className="text-center">
            <h2 className="text-xl font-bold text-white">{profile?.name}</h2>
            <div className="flex items-center justify-center gap-1.5 text-xs text-teal-100 mt-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Administrator Lingkungan</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] overflow-hidden border border-white/50 android-shadow mb-6">
          {items.map((item, idx) => (
            <button key={idx} onClick={item.onClick} className={cn("w-full flex items-center justify-between p-5 active:bg-muted/5 transition-colors text-left", idx !== items.length - 1 && "border-b border-gray-50")}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-muted-foreground"><item.icon className="w-5 h-5" /></div>
                <div>
                  <span className="text-sm font-bold block text-foreground/80">{item.label}</span>
                  {item.value && <span className="text-[10px] text-muted-foreground">{item.value}</span>}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
            </button>
          ))}
        </div>

        <div className="bg-white rounded-[2rem] p-6 android-shadow border border-white/50 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary"><Mail className="w-6 h-6" /></div>
            <div><p className="text-[10px] font-bold uppercase text-muted-foreground">Email Terdaftar</p><p className="text-sm font-bold">{profile?.email}</p></div>
          </div>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="w-full h-14 rounded-3xl border-rose-100 text-rose-600 hover:bg-rose-50 bg-white shadow-sm mt-8 flex items-center justify-center gap-3">
              <LogOut className="w-5 h-5" />
              <span className="font-bold">Keluar Portal Admin</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="rounded-3xl w-[90%] max-w-sm mx-auto">
            <AlertDialogHeader><AlertDialogTitle>Konfirmasi Keluar</AlertDialogTitle><AlertDialogDescription>Keluar dari aplikasi?</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter className="flex-row gap-2 mt-4"><AlertDialogCancel className="flex-1 mt-0 rounded-2xl h-11">Batal</AlertDialogCancel><AlertDialogAction onClick={handleLogout} className="flex-1 rounded-2xl h-11 bg-destructive">Keluar</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
