
"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useAuth as useFirebaseInstance, useFirestore, useStorage } from "@/firebase";
import { signOut } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { useRouter } from "next/navigation";
import { 
  User, 
  Phone, 
  Lock, 
  LogOut, 
  ChevronRight, 
  ShieldCheck,
  MapPin,
  AtSign,
  Camera,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";

export default function WargaProfilePage() {
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
  const [address, setAddress] = useState(profile?.address || "");

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
            if (width > maxDimension) {
              height *= maxDimension / width;
              width = maxDimension;
            }
          } else {
            if (height > maxDimension) {
              width *= maxDimension / height;
              height = maxDimension;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Canvas conversion failed'));
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
      toast({ variant: "destructive", title: "File Terlalu Besar", description: "Maksimal ukuran file adalah 2 MB." });
      return;
    }

    setUploading(true);
    try {
      const compressedBlob = await compressImage(file);
      const storageRef = ref(storage, `profile-images/${profile.uid}`);
      const uploadTask = uploadBytesResumable(storageRef, compressedBlob);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        }, 
        (error) => {
          toast({ variant: "destructive", title: "Upload Gagal", description: error.message });
          setUploading(false);
        }, 
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          await updateDoc(doc(db, "users", profile.uid), {
            photoURL: downloadURL
          });
          toast({ title: "Berhasil", description: "Foto profil berhasil diperbarui." });
          setUploading(false);
          setUploadProgress(0);
        }
      );
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Gagal memproses gambar." });
      setUploading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!db || !profile?.uid) return;
    setIsUpdating(true);
    try {
      await updateDoc(doc(db, "users", profile.uid), {
        name,
        phone,
        address
      });
      toast({ title: "Berhasil", description: "Profil telah diperbarui." });
    } catch (err) {
      toast({ variant: "destructive", title: "Gagal", description: "Tidak dapat memperbarui profil." });
    } finally {
      setIsUpdating(false);
    }
  };

  const profileItems = [
    { label: "Ubah Nama", icon: User, action: "dialog-name", value: profile?.name },
    { label: "Ubah Nomor HP", icon: Phone, action: "dialog-phone", value: profile?.phone },
    { label: "Ubah Alamat", icon: MapPin, action: "dialog-address", value: profile?.address },
    { label: "Ubah Foto Profil", icon: Camera, onClick: () => fileInputRef.current?.click() },
    { label: "Ubah Password", icon: Lock, onClick: () => toast({ title: "Info", description: "Fitur ubah password dapat diakses melalui portal pemulihan email." }) },
  ];

  return (
    <div className="space-y-6 pb-24">
      <PageHeader title="Profil Saya" backUrl="/warga" />
      
      <div className="px-2">
        <div className="bg-white p-6 rounded-[2.5rem] android-shadow border border-white/50 flex flex-col items-center gap-4 mb-8">
          <div className="relative">
            <Avatar className="w-24 h-24 border-4 border-primary/10 shadow-sm">
              <AvatarImage src={profile?.photoURL || `https://picsum.photos/seed/${profile?.uid}/200`} />
              <AvatarFallback className="bg-primary/5 text-primary text-3xl font-bold">
                {profile?.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <button 
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full shadow-lg border-2 border-white bg-primary text-white flex items-center justify-center active:scale-90 transition-transform disabled:opacity-50"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/png, image/jpeg, image/jpg" 
              onChange={handleFileChange} 
            />
          </div>
          
          {uploading && (
            <div className="w-full max-w-[150px] space-y-1">
              <Progress value={uploadProgress} className="h-1" />
              <p className="text-[8px] text-center font-bold text-primary uppercase">Mengunggah...</p>
            </div>
          )}

          <div className="text-center">
            <h2 className="text-lg font-bold">{profile?.name}</h2>
            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              <span>{profile?.role === 'warga' ? 'Warga Terverifikasi' : 'Admin RT'}</span>
            </div>
          </div>
          
          <div className="w-full grid grid-cols-1 gap-4 pt-6 border-t mt-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                <AtSign className="w-4 h-4 text-primary opacity-60" />
              </div>
              <div className="flex-1">
                <p className="text-[9px] uppercase font-bold text-muted-foreground">Email</p>
                <p className="text-xs font-medium">{profile?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-primary opacity-60" />
              </div>
              <div className="flex-1">
                <p className="text-[9px] uppercase font-bold text-muted-foreground">Alamat Rumah</p>
                <p className="text-xs font-medium">{profile?.address || "Belum diatur"}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] overflow-hidden border border-white/50 android-shadow mb-6">
          {profileItems.map((item, iIdx) => {
            const isLast = iIdx === profileItems.length - 1;
            
            const content = (
              <button 
                key={iIdx}
                onClick={item.onClick}
                className={cn(
                  "w-full flex items-center justify-between p-5 active:bg-muted/5 transition-colors text-left",
                  !isLast && "border-b border-gray-50"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-muted-foreground">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-bold block text-foreground/80">{item.label}</span>
                    {item.value && <span className="text-[10px] text-muted-foreground">{item.value}</span>}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
              </button>
            );

            if (item.action === "dialog-name") {
              return (
                <Dialog key={iIdx}>
                  <DialogTrigger asChild>{content}</DialogTrigger>
                  <DialogContent className="rounded-[2.5rem] w-[95%] max-w-sm">
                    <DialogHeader><DialogTitle>Ubah Nama Lengkap</DialogTitle></DialogHeader>
                    <div className="py-4"><Input value={name} onChange={e => setName(e.target.value)} className="rounded-2xl h-12" /></div>
                    <DialogFooter><Button onClick={handleUpdateProfile} disabled={isUpdating} className="w-full rounded-2xl h-12">Simpan Perubahan</Button></DialogFooter>
                  </DialogContent>
                </Dialog>
              );
            }

            if (item.action === "dialog-phone") {
              return (
                <Dialog key={iIdx}>
                  <DialogTrigger asChild>{content}</DialogTrigger>
                  <DialogContent className="rounded-[2.5rem] w-[95%] max-w-sm">
                    <DialogHeader><DialogTitle>Ubah Nomor HP</DialogTitle></DialogHeader>
                    <div className="py-4"><Input value={phone} onChange={e => setPhone(e.target.value)} className="rounded-2xl h-12" /></div>
                    <DialogFooter><Button onClick={handleUpdateProfile} disabled={isUpdating} className="w-full rounded-2xl h-12">Simpan Perubahan</Button></DialogFooter>
                  </DialogContent>
                </Dialog>
              );
            }

            if (item.action === "dialog-address") {
              return (
                <Dialog key={iIdx}>
                  <DialogTrigger asChild>{content}</DialogTrigger>
                  <DialogContent className="rounded-[2.5rem] w-[95%] max-w-sm">
                    <DialogHeader><DialogTitle>Ubah Alamat</DialogTitle></DialogHeader>
                    <div className="py-4"><Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Blok A No. 12" className="rounded-2xl h-12" /></div>
                    <DialogFooter><Button onClick={handleUpdateProfile} disabled={isUpdating} className="w-full rounded-2xl h-12">Simpan Perubahan</Button></DialogFooter>
                  </DialogContent>
                </Dialog>
              );
            }

            return <div key={iIdx}>{content}</div>;
          })}
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="w-full h-14 rounded-3xl border-rose-100 text-rose-600 hover:bg-rose-50 bg-white shadow-sm mt-4 flex items-center justify-center gap-3">
              <LogOut className="w-5 h-5" />
              <span className="font-bold">Keluar Akun</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="rounded-3xl w-[90%] max-w-sm mx-auto">
            <AlertDialogHeader><AlertDialogTitle>Konfirmasi Keluar</AlertDialogTitle><AlertDialogDescription>Apakah Anda yakin ingin keluar dari aplikasi?</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter className="flex-row gap-2 mt-4"><AlertDialogCancel className="flex-1 mt-0 rounded-2xl h-11">Batal</AlertDialogCancel><AlertDialogAction onClick={handleLogout} className="flex-1 rounded-2xl h-11 bg-destructive">Keluar</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
