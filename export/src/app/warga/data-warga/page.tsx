
"use client";

import { useState, useMemo } from "react";
import { collection, query, where } from "firebase/firestore";
import { useFirestore, useCollection } from "@/firebase";
import { 
  Users, 
  Search, 
  Phone, 
  ShieldCheck,
  Home
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";

export default function WargaDataWargaPage() {
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
      <PageHeader title="Daftar Warga RT" backUrl="/warga" />

      <div className="px-2">
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Cari nama atau alamat..." 
            className="pl-11 h-12 rounded-3xl bg-white border-none android-shadow"
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
              Belum ada data warga.
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
                  <div className="flex flex-col gap-0.5 mt-1">
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                      <Home className="w-3 h-3 opacity-40" /> {user.address || "Alamat -"}
                    </p>
                    <p className="text-[9px] font-bold text-muted-foreground/60 uppercase">
                      RT {user.rt || "00"} / RW {user.rw || "00"}
                    </p>
                  </div>
                </div>
                {user.phone && (
                  <Link href={`https://wa.me/${user.phone.replace(/^0/, '62')}`} target="_blank">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                      <Phone className="w-4 h-4" />
                    </div>
                  </Link>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
