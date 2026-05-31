
"use client";

import { useState, useMemo } from "react";
import { collection, query, orderBy } from "firebase/firestore";
import { useFirestore, useCollection } from "@/firebase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Store, 
  Search, 
  Phone, 
  MessageCircle, 
  ChevronRight,
  Info,
  Tag
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";

const KATEGORI_UMKM = ["Semua", "Kuliner", "Jasa", "Kerajinan", "Pakaian", "Lainnya"];

export default function WargaUMKMPage() {
  const db = useFirestore();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("Semua");

  const umkmQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, "umkm"), orderBy("createdAt", "desc"));
  }, [db]);

  const { data: businesses, loading } = useCollection(umkmQuery);

  const filteredBusinesses = useMemo(() => {
    if (!businesses) return [];
    return businesses.filter((b: any) => {
      const matchesSearch = b.namaUsaha?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          b.pemilik?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === "Semua" || b.kategori === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [businesses, searchTerm, activeCategory]);

  return (
    <div className="space-y-6 pb-32 max-w-md mx-auto overflow-x-hidden">
      <PageHeader title="UMKM Warga" backUrl="/warga" />

      <div className="px-4">
        {/* Search and Filters */}
        <div className="flex flex-col gap-5 mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Cari Produk atau Jasa..." 
              className="pl-12 h-14 rounded-2xl bg-white border-none shadow-sm text-sm"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4">
            {KATEGORI_UMKM.map((cat) => (
              <Button 
                key={cat} 
                variant={activeCategory === cat ? "default" : "outline"} 
                size="sm" 
                className={cn(
                  "rounded-full h-10 px-6 text-[10px] font-bold uppercase shrink-0 transition-all",
                  activeCategory === cat ? "bg-teal-600 shadow-lg shadow-teal-100 border-none" : "bg-white border-none shadow-sm"
                )}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        {/* List Section */}
        <div className="space-y-5">
          {loading ? (
            <div className="p-12 text-center text-muted-foreground bg-white rounded-3xl border border-dashed">Memuat data...</div>
          ) : filteredBusinesses.length === 0 ? (
            <div className="p-20 text-center bg-white rounded-[2.5rem] border border-dashed text-muted-foreground text-sm flex flex-col items-center gap-3">
              <Store className="w-12 h-12 opacity-5" />
              <p className="font-bold opacity-30">Belum ada UMKM yang terdaftar.</p>
            </div>
          ) : (
            filteredBusinesses.map((b: any) => (
              <Dialog key={b.id}>
                <DialogTrigger asChild>
                  <div className="bg-white overflow-hidden rounded-[2rem] shadow-md border border-slate-50 active:scale-95 transition-all">
                    <div className="h-48 relative bg-slate-100">
                      <img 
                        src={b.foto || `https://picsum.photos/seed/${b.id}/600/400`} 
                        alt={b.namaUsaha} 
                        className="w-full h-full object-cover"
                        data-ai-hint="product photo"
                      />
                      <Badge className="absolute top-4 left-4 bg-white/95 text-teal-700 border-none rounded-xl text-[9px] font-bold uppercase px-3">
                        {b.kategori}
                      </Badge>
                    </div>
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-bold text-foreground leading-tight">{b.namaUsaha}</h3>
                          <div className="flex items-center gap-2 mt-1">
                             <Avatar className="w-5 h-5">
                               <AvatarFallback className="text-[8px] bg-slate-100">{b.pemilik?.charAt(0)}</AvatarFallback>
                             </Avatar>
                             <p className="text-[10px] text-muted-foreground font-bold">{b.pemilik}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-300" />
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-5">
                        {b.deskripsi || "Informasi produk berkualitas dari warga lingkungan RT."}
                      </p>
                      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                        <div className="flex items-center gap-1.5 text-teal-600">
                          <Tag className="w-3 h-3" />
                          <span className="text-[9px] font-bold uppercase tracking-tighter">Ready Stok</span>
                        </div>
                        <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 rounded-xl h-10 px-5 text-[11px] font-bold shadow-lg shadow-emerald-100">
                          <Phone className="w-3.5 h-3.5 mr-2" /> Detail Order
                        </Button>
                      </div>
                    </div>
                  </div>
                </DialogTrigger>
                <DialogContent className="rounded-[2.5rem] w-[95%] max-w-md mx-auto p-0 overflow-hidden border-none shadow-2xl">
                  <div className="h-64 relative">
                    <img 
                      src={b.foto || `https://picsum.photos/seed/${b.id}/600/400`} 
                      alt={b.namaUsaha} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8">
                      <Badge className="w-fit mb-3 bg-teal-500 border-none rounded-lg text-[10px] font-bold uppercase px-3">{b.kategori}</Badge>
                      <h2 className="text-2xl font-bold text-white">{b.namaUsaha}</h2>
                    </div>
                  </div>
                  <div className="p-8 space-y-6 bg-white">
                    <div className="flex items-center gap-5 p-5 bg-slate-50 rounded-2xl">
                      <Avatar className="w-14 h-14 border-4 border-white shadow-sm">
                        <AvatarFallback className="bg-teal-100 text-teal-700 font-bold text-xl">
                          {b.pemilik?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Penjual / Pemilik</p>
                        <p className="text-lg font-bold">{b.pemilik}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                        <Info className="w-4 h-4 text-teal-600" /> Deskripsi Produk
                      </p>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {b.deskripsi || "Produk lokal berkualitas yang diproduksi langsung oleh warga. Mari dukung ekonomi lingkungan kita dengan membeli produk UMKM RT."}
                      </p>
                    </div>

                    <div className="pt-6 border-t flex flex-col gap-3">
                      <Link href={`https://wa.me/${b.whatsapp?.replace(/^0/, '62')}`} target="_blank" className="w-full">
                        <Button className="w-full h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-lg font-bold shadow-lg shadow-emerald-100 flex items-center justify-center gap-3">
                          <MessageCircle className="w-6 h-6" />
                          Chat WhatsApp
                        </Button>
                      </Link>
                      <p className="text-[9px] text-center text-muted-foreground italic font-medium">Klik tombol di atas untuk pemesanan langsung.</p>
                    </div>
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
