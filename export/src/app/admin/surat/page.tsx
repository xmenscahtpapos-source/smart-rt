
"use client";

import { useMemo } from "react";
import { collection, query, orderBy, doc, updateDoc } from "firebase/firestore";
import { useFirestore, useCollection } from "@/firebase";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { FileText, CheckCircle, Printer } from "lucide-react";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { PageHeader } from "@/components/shared/page-header";

export default function AdminSuratPage() {
  const db = useFirestore();
  const { toast } = useToast();

  const suratQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, "surat"), orderBy("createdAt", "desc"));
  }, [db]);

  const { data: suratList, loading } = useCollection(suratQuery);

  const handleUpdateStatus = (id: string, newStatus: string) => {
    if (!db) return;
    const suratRef = doc(db, "surat", id);
    updateDoc(suratRef, { status: newStatus, updatedAt: new Date().toISOString() })
      .then(() => {
        toast({ title: "Status Diperbarui", description: `Surat ditandai sebagai ${newStatus}.` });
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: suratRef.path,
          operation: "update",
          requestResourceData: { status: newStatus },
        });
        errorEmitter.emit("permission-error", permissionError);
      });
  };

  const handlePrint = (surat: any) => {
    toast({ title: "Mempersiapkan Cetak", description: `Menyiapkan format ${surat.type} untuk ${surat.userName}...` });
    setTimeout(() => {
       window.print();
    }, 1000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "diajukan": return <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 text-[10px]">Baru</Badge>;
      case "diproses": return <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-100 text-[10px]">Proses</Badge>;
      case "selesai": return <Badge variant="default" className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[10px]">Selesai</Badge>;
      case "ditolak": return <Badge variant="destructive" className="bg-red-50 text-red-700 border-red-100 text-[10px]">Ditolak</Badge>;
      default: return <Badge className="text-[10px]">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-20 print:p-0">
      <div className="print:hidden">
        <PageHeader title="Surat Pengantar" backUrl="/admin" />
      </div>

      <div className="px-2">
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden print:shadow-none print:border-none">
          <CardHeader className="bg-white border-b border-border/50 print:hidden">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5 text-primary" />
              Antrean Surat
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-12 text-center text-muted-foreground">Memuat data...</div>
            ) : suratList.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">Tidak ada permohonan.</div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/30 print:hidden">
                  <TableRow>
                    <TableHead className="px-6">Warga</TableHead>
                    <TableHead className="px-6">Info</TableHead>
                    <TableHead className="px-6 text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suratList.map((s: any) => (
                    <TableRow key={s.id} className="hover:bg-muted/5">
                      <TableCell className="px-6 py-4">
                        <div className="font-bold text-sm">{s.userName}</div>
                        <div className="text-[10px] text-muted-foreground line-clamp-1">{s.userAddress}</div>
                        <div className="mt-1">{getStatusBadge(s.status)}</div>
                      </TableCell>
                      <TableCell className="px-6">
                        <div className="font-medium text-primary text-xs">{s.type}</div>
                        <div className="text-[10px] italic line-clamp-1">"{s.purpose}"</div>
                      </TableCell>
                      <TableCell className="px-6 text-right print:hidden">
                        <div className="flex justify-end gap-1">
                          {s.status === 'diajukan' && (
                            <Button size="sm" variant="outline" className="h-8 text-[10px] px-2" onClick={() => handleUpdateStatus(s.id, 'diproses')}>
                              Proses
                            </Button>
                          )}
                          {s.status === 'diproses' && (
                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-8 text-[10px] px-2" onClick={() => handleUpdateStatus(s.id, 'selesai')}>
                              <CheckCircle className="w-3 h-3 mr-1" /> Selesai
                            </Button>
                          )}
                          {s.status === 'selesai' && (
                            <Button size="sm" variant="outline" className="text-primary border-primary/20 h-8 text-[10px] px-2" onClick={() => handlePrint(s)}>
                              <Printer className="w-3 h-3 mr-1" /> Cetak
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
