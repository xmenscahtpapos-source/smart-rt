"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useAuth, useFirestore } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

export default function RegisterPage() {
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
  });
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !db) return;
    
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      const profileData = {
        uid: user.uid,
        name: formData.name,
        email: formData.email,
        address: formData.address,
        phone: formData.phone,
        role: "warga",
        status: "aktif", // Langsung aktif tanpa verifikasi
        createdAt: new Date().toISOString(),
      };

      const userRef = doc(db, "users", user.uid);
      setDoc(userRef, profileData).catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: userRef.path,
          operation: 'create',
          requestResourceData: profileData,
        });
        errorEmitter.emit('permission-error', permissionError);
      });

      toast({
        title: "Registrasi Berhasil",
        description: "Akun Anda telah aktif. Selamat datang di INFO POS.",
      });
      
      router.push("/login");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registrasi Gagal",
        description: error.message || "Terjadi kesalahan saat mendaftar.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <Card className="w-full max-w-md shadow-2xl rounded-3xl overflow-hidden border-none">
        <CardHeader className="space-y-1 bg-secondary text-white pb-8">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-secondary">
              <UserPlus className="w-6 h-6" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center font-headline">INFO POS</CardTitle>
          <CardDescription className="text-emerald-100 text-center">Gabung sebagai warga di lingkungan Anda.</CardDescription>
        </CardHeader>
        <CardContent className="pt-8">
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nama">Nama Lengkap</Label>
              <Input id="nama" placeholder="Budi Santoso" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="budi@email.com" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Nomor HP / WhatsApp</Label>
              <Input id="phone" placeholder="0812xxxx" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Alamat Rumah</Label>
              <Input id="address" placeholder="Blok A No. 12" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} required />
            </div>
            <Button type="submit" className="w-full h-11 bg-secondary hover:bg-secondary/90 rounded-xl mt-4" disabled={loading}>
              {loading ? "Mendaftarkan..." : "Daftar Sekarang"}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-center w-full text-muted-foreground">
            Sudah punya akun? <Link href="/login" className="text-secondary font-semibold hover:underline">Masuk</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}