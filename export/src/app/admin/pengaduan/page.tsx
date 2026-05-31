
"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, getDocs, updateDoc, doc } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/shared/page-header";

export default function AdminPengaduan() {
  const db = useFirestore();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
      if (!db) return;
      try {
        const q = query(collection(db, "pengaduan"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        setComplaints(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [db]);

  const handleResolve = async (id: string) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, "pengaduan", id), { status: "selesai" });
      setComplaints(prev => prev.map(c => c.id === id ? { ...c, status: "selesai" } : c));
      toast({ title: "Laporan Ditandai Selesai" });
    } catch (err) {
      toast({ variant: "destructive", title: "Gagal Mengupdate Status" });
    }
  };

  const getUrgencyColor = (u: string) => {
    switch (u) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Laporan & Pengaduan" backUrl="/admin" />

      <div className="grid grid-cols-1 gap-6 px-2">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground">Memuat pengaduan...</div>
        ) : complaints.length === 0 ? (
          <div className="text-center p-20 bg-white rounded-3xl border border-dashed">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Belum ada pengaduan dari warga.</p>
          </div>
        ) : (
          complaints.map((c) => (
            <Card key={c.id} className="border-none shadow-sm hover:shadow-md transition-all rounded-3xl overflow-hidden">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="capitalize text-[10px]">{c.status || 'Baru'}</Badge>
                    {c.urgency && <Badge className={`capitalize text-[10px] ${getUrgencyColor(c.urgency)}`}>{c.urgency}</Badge>}
                  </div>
                  <CardTitle className="text-base">Laporan dari {c.userName || 'Warga'}</CardTitle>
                  <CardDescription className="text-[10px]">Dilaporkan pada {new Date(c.createdAt).toLocaleDateString('id-ID')}</CardDescription>
                </div>
                {c.status !== 'selesai' && (
                  <Button variant="ghost" size="icon" onClick={() => handleResolve(c.id)} title="Tandai Selesai">
                    <CheckCircle className="w-6 h-6 text-emerald-500" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/30 p-4 rounded-xl italic text-muted-foreground text-sm">
                  "{c.text}"
                </div>
                {c.address && (
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Alamat: {c.address}</p>
                )}
              </CardContent>
              <CardFooter className="bg-white border-t border-muted/20 py-3">
                {c.status === 'selesai' ? (
                  <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
                    <CheckCircle className="w-4 h-4" />
                    Masalah Selesai
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">Sedang menunggu tindak lanjut.</p>
                )}
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
