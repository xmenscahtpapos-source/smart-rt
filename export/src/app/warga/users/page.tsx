
"use client";

import { useState, useMemo } from "react";
import { collection, query, where } from "firebase/firestore";
import { useFirestore, useCollection } from "@/firebase";
import { 
  Users, 
  Search, 
  ArrowLeft,
  MapPin,
  Phone,
  ShieldCheck
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";

export default function WargaDirectoryPage() {
  const db = useFirestore();
  const [searchTerm, setSearchTerm] = useState("");

  const usersQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, "users"), where("role", "==", "warga"));
  }, [db]);

  const { data: residents, loading } = useCollection(usersQuery);

  const filteredResidents = useMemo(() => {
    if (!residents) return [];
    return residents.filter((u: any) => 
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.address?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [residents, searchTerm]);

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-4 px-2">
        <Link href="/warga" className="p-2 bg-white rounded-full shadow-sm">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </Link>
        <h1 className="text-xl font-bold">Direktori Warga</h1>
      </div>

      <div className="px-2">
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Cari tetangga atau alamat..." 
            className="pl-11 h-14 rounded-3xl bg-white border-none android-shadow"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="p-12 text-center text-muted-foreground">Memuat data warga...</div>
          ) : filteredResidents.length === 0 ? (
            <div className="p-20 text-center bg-white rounded-[2rem] border border-dashed text-muted-foreground text-sm">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-10" />
              Tidak ada data warga ditemukan.
            </div>
          ) : (
            filteredResidents.map((user: any) => (
              <div key={user.id} className="bg-white p-4 rounded-3xl android-shadow border border-white/50 flex items-center gap-4">
                <Avatar className="w-12 h-12 bg-primary/5">
                  <AvatarFallback className="text-primary font-bold">
                    {user.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-foreground truncate">{user.name}</h3>
                    {user.status === 'aktif' && <ShieldCheck className="w-3 h-3 text-primary" />}
                  </div>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-2">
                    <MapPin className="w-3 h-3 opacity-40" /> {user.address || "Alamat tidak tersedia"}
                  </p>
                </div>
                <Link href={`https://wa.me/${user.phone}`} target="_blank" className={!user.phone ? "pointer-events-none opacity-20" : ""}>
                  <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <Phone className="w-4 h-4" />
                  </div>
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
