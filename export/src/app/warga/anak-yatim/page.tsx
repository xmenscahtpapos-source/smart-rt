
"use client";

import { useState, useMemo } from "react";
import { collection, query } from "firebase/firestore";
import { useFirestore, useCollection } from "@/firebase";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Heart, 
  Search, 
  Calendar,
  School,
  Baby,
  MapPin,
  Phone,
  ChevronRight,
  User
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared/page-header";

export default function WargaAnakYatimPage() {
  const db = useFirestore();
  const [searchTerm, setSearchTerm] = useState("");

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

  const filteredOrphans = useMemo(() => {
    if (!orphans) return [];
    return orphans.filter((o: any) => 
      o.nama?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [orphans, searchTerm]);

  return (
    <div className="space-y-6 pb-32 max-w-md mx-auto">
      <PageHeader title="Data Anak Yatim" backUrl="/warga" />

      <div className="px-4">
        {/* Search Section */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Cari Nama Anak..." 
            className="pl-12 h-14 rounded-2xl bg-white border-none shadow-sm text-sm"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {/* List Section */}
        <div className="space-y-4">
          {loading ? (
            <div className="p-12 text-center text-muted-foreground bg-white rounded-3xl border border-dashed">Memuat data...</div>
          ) : filteredOrphans.length === 0 ? (
            <div className="p-20 text-center bg-white rounded-[2rem] border border-dashed text-muted-foreground text-sm flex flex-col items-center gap-3">
              <Heart className="w-12 h-12 opacity-5 text-pink-500" />
              <p className="font-bold opacity-30">Belum ada data anak yatim.</p>
            </div>
          ) : (
            filteredOrphans.map((item: any) => (
              <Dialog key={item.id}>
                <DialogTrigger asChild>
                  <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-50 flex items-center gap-5 active:scale-95 transition-all">
                    <Avatar className="w-16 h-16 bg-pink-50 border-2 border-pink-100 shadow-sm shrink-0">
                      <AvatarImage src={item.foto || `https://picsum.photos/seed/${item.id}/200`} />
                      <AvatarFallback className="text-pink-600 font-bold text-lg">{item.nama?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-foreground truncate">{item.nama}</h3>
                      <div className="flex flex-col gap-1 mt-1">
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-pink-400" /> {calculateAge(item.tanggalLahir)} Tahun
                        </p>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                          <School className="w-3 h-3 text-pink-400" /> {item.pendidikan}
                        </p>
                      </div>
                      <span className="inline-block mt-3 px-3 py-1 bg-pink-50 text-pink-600 text-[8px] font-bold rounded-full border border-pink-100 uppercase tracking-widest">
                        {item.statusSekolah}
                      </span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-200" />
                  </div>
                </DialogTrigger>
                <DialogContent className="rounded-[2.5rem] w-[95%] max-w-sm mx-auto p-0 overflow-hidden border-none shadow-2xl">
                  <div className="bg-pink-600 p-10 flex flex-col items-center text-white relative">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                       <Heart className="absolute -left-4 -top-4 w-32 h-32 rotate-12" />
                    </div>
                    <Avatar className="w-28 h-28 border-4 border-white/20 mb-5 shadow-2xl relative z-10">
                      <AvatarImage src={item.foto || `https://picsum.photos/seed/${item.id}/200`} />
                      <AvatarFallback className="text-pink-600 bg-white font-bold text-3xl">{item.nama?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <h2 className="text-2xl font-bold relative z-10">{item.nama}</h2>
                    <p className="text-pink-100 text-sm font-medium opacity-80 mt-1">{calculateAge(item.tanggalLahir)} Tahun • {item.jenisKelamin}</p>
                  </div>
                  <div className="p-8 space-y-6 bg-white">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-4 rounded-2xl space-y-1">
                        <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest">Pendidikan</p>
                        <p className="text-xs font-bold flex items-center gap-2">
                          <School className="w-3.5 h-3.5 text-pink-500" /> {item.pendidikan}
                        </p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl space-y-1">
                        <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest">Status</p>
                        <p className="text-xs font-bold flex items-center gap-2">
                          <Baby className="w-3.5 h-3.5 text-pink-500" /> {item.statusSekolah}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center shrink-0">
                           <User className="w-4 h-4 text-pink-500" />
                         </div>
                         <div className="flex-1">
                           <p className="text-[9px] uppercase font-bold text-muted-foreground">Orang Tua</p>
                           <p className="text-xs font-medium">Alm. Ayah: <span className="font-bold text-foreground">{item.namaAyah || '-'}</span></p>
                           <p className="text-xs font-medium">Ibu: <span className="font-bold text-foreground">{item.namaIbu || '-'}</span></p>
                         </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center shrink-0 mt-1">
                          <MapPin className="w-4 h-4 text-pink-500" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[9px] uppercase font-bold text-muted-foreground">Alamat Tinggal</p>
                          <p className="text-xs leading-relaxed font-medium">{item.alamat || '-'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                          <Phone className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[9px] uppercase font-bold text-muted-foreground">Kontak Wali</p>
                          <p className="text-xs font-bold text-emerald-700">{item.noHpWali || '-'}</p>
                        </div>
                      </div>
                    </div>
                    
                    {item.keterangan && (
                      <div className="bg-slate-50 p-5 rounded-2xl italic text-[11px] text-muted-foreground leading-relaxed border-l-4 border-pink-200">
                        "{item.keterangan}"
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
