
"use client";

import { useMemo, useEffect } from "react";
import { collection, query, doc, updateDoc } from "firebase/firestore";
import { useFirestore, useCollection } from "@/firebase";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, CheckCircle } from "lucide-react";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { PageHeader } from "@/components/shared/page-header";

export default function AdminIuranPage() {
  const db = useFirestore();
  const { toast } = useToast();
  
  // 1. Fetch iuran
  const iuranQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, "iuran"));
  }, [db]);

  // 2. Fetch users for name lookup (if userName is missing in iuran doc)
  const usersQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, "users"));
  }, [db]);

  const { data: rawIuranList, loading: loadingIuran, error } = useCollection(iuranQuery);
  const { data: users } = useCollection(usersQuery);

  // Create a mapping of UID to User Name
  const userMap = useMemo(() => {
    const map: Record<string, string> = {};
    users?.forEach((u: any) => {
      if (u.uid) map[u.uid] = u.name;
    });
    return map;
  }, [users]);

  // Client-side sorting: Year desc, then Month
  const iuranList = useMemo(() => {
    if (!rawIuranList) return [];
    const monthOrder: Record<string, number> = {
      'januari': 1, 'februari': 2, 'maret': 3, 'april': 4, 'mei': 5, 'juni': 6,
      'juli': 7, 'agustus': 8, 'september': 9, 'oktober': 10, 'november': 11, 'desember': 12
    };

    return [...rawIuranList].sort((a: any, b: any) => {
      const yearA = a.year || 0;
      const yearB = b.year || 0;
      if (yearB !== yearA) return yearB - yearA;
      const m1 = monthOrder[(a.month || '').toLowerCase()] || 0;
      const m2 = monthOrder[(b.month || '').toLowerCase()] || 0;
      return m2 - m1;
    });
  }, [rawIuranList]);

  const handleUpdateStatus = (id: string, newStatus: string) => {
    if (!db) return;
    const iuranRef = doc(db, "iuran", id);
    updateDoc(iuranRef, { status: newStatus })
      .then(() => {
        toast({ title: "Status Diperbarui", description: `Iuran telah ditandai sebagai ${newStatus}.` });
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: iuranRef.path,
          operation: "update",
          requestResourceData: { status: newStatus },
        });
        errorEmitter.emit("permission-error", permissionError);
      });
  };

  const formatCurrency = (amount: any) => {
    const val = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(val || 0);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "lunas": return <Badge variant="default" className="bg-emerald-50 text-emerald-700 border-emerald-100">Lunas</Badge>;
      case "belum_bayar": return <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-100">Belum Bayar</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Iuran Warga" backUrl="/admin" />

      <div className="grid grid-cols-1 gap-6 px-2">
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
          <CardHeader className="bg-white border-b border-border/50">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="w-5 h-5 text-primary" />
              Monitor Iuran
            </CardTitle>
            <CardDescription>Daftar seluruh tagihan warga.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loadingIuran ? (
              <div className="p-12 text-center text-muted-foreground">Memuat data...</div>
            ) : error ? (
              <div className="p-12 text-center text-destructive">
                <p className="font-bold">Gagal memuat data</p>
                <p className="text-sm">{String(error)}</p>
              </div>
            ) : iuranList.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">Tidak ada data iuran.</div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="px-6">Warga</TableHead>
                    <TableHead className="px-6">Bulan</TableHead>
                    <TableHead className="px-6">Status</TableHead>
                    <TableHead className="px-6 text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {iuranList.map((item: any) => {
                    const uid = item.userId || item.userid;
                    const displayName = item.userName || userMap[uid] || "N/A";
                    const amountValue = item.amount ?? item.nominal ?? 0;

                    return (
                      <TableRow key={item.id} className="hover:bg-muted/5 transition-colors">
                        <TableCell className="px-6 font-medium">
                          <div className="text-sm">{displayName}</div>
                          <div className="text-[10px] font-mono opacity-50">{formatCurrency(amountValue)}</div>
                        </TableCell>
                        <TableCell className="px-6 capitalize text-xs">{item.month} {item.year}</TableCell>
                        <TableCell className="px-6">{getStatusBadge(item.status)}</TableCell>
                        <TableCell className="px-6 text-right">
                          <div className="flex justify-end gap-2">
                            {item.status !== "lunas" ? (
                              <Button 
                                size="sm" 
                                className="bg-emerald-600 hover:bg-emerald-700 h-8 text-[10px]"
                                onClick={() => handleUpdateStatus(item.id, "lunas")}
                              >
                                <CheckCircle className="w-3 h-3 mr-1" /> Verif
                              </Button>
                            ) : (
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="text-amber-600 h-8 text-[10px]"
                                onClick={() => handleUpdateStatus(item.id, "belum_bayar")}
                              >
                                Batal
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
