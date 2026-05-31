
"use client";

import { useState, useEffect } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useAuth as useFirebaseAuth } from "@/firebase";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { LogIn } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const auth = useFirebaseAuth();
  const { profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirection logic based on role and status
  useEffect(() => {
    if (!authLoading && profile) {
      if (profile.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/warga");
      }
    }
  }, [profile, authLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Login Berhasil",
        description: "Selamat datang kembali di INFO POS.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Gagal",
        description: "Email atau password salah. Silakan coba lagi.",
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <Card className="w-full max-w-md shadow-2xl rounded-3xl overflow-hidden border-none">
        <CardHeader className="space-y-1 bg-primary text-white pb-8">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-primary">
              <LogIn className="w-6 h-6" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center font-headline">Masuk INFO POS</CardTitle>
          <CardDescription className="text-emerald-100 text-center">Akses portal manajemen RT pintar Anda.</CardDescription>
        </CardHeader>
        <CardContent className="pt-8">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="nama@email.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                className="rounded-xl"
              />
            </div>
            <Button type="submit" className="w-full h-12 bg-primary hover:bg-primary/90 rounded-xl text-lg font-semibold mt-4 shadow-lg shadow-emerald-100" disabled={loading}>
              {loading ? "Memproses..." : "Masuk"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 pb-8">
          <div className="text-sm text-center text-muted-foreground">
            Belum punya akun? <Link href="/register" className="text-primary font-bold hover:underline">Daftar sekarang</Link>
          </div>
          <div className="bg-muted/30 p-3 rounded-xl text-[10px] text-center text-muted-foreground">
            Default Admin: admin@smartrt.com
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
