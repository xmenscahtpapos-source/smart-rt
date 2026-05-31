
"use client";

import { useMemo } from "react";
import { collection, query, where } from "firebase/firestore";
import { useFirestore, useCollection } from "@/firebase";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, CheckCircle2, AlertCircle, Calendar, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { cn } from "@/lib/utils";

export default function WargaIuranPage() {
  const db = useFirestore();
  const { profile } = useAuth();

  const iuranQuery = useMemo(() => {
    if (!db || !profile?.uid) return null;
    return query(
      collection(db, "iuran"),
      where("userId", "==", profile.uid)
    );
  }, [db, profile?.uid]);

  const iuranQueryAlt = useMemo(() => {
    if (!db || !profile?.uid) return null;
    return query(
      collection(db, "iuran"),
      where("userid", "==", profile.uid)
    );
  }, [db, profile?.uid]);

  const { data: rawData, loading: loading1 } = useCollection(iuranQuery);
  const { data: rawDataAlt, loading: loading2 } = useCollection(iuranQueryAlt);

  const iuranList = useMemo(() => {
    const all = [...(rawData || []), ...(rawDataAlt || [])];
    const uniqueIds = new Set();
    const uniqueList = all.filter(item => {
      const id = (item as any).id;
      if (uniqueIds.has(id)) return false;
      uniqueIds.add(id);
      return true;
    });

    const monthOrder: Record<string, number> = {
      'januari': 1, 'februari': 2, 'maret': 3, 'april': 4, 'mei': 5, 'juni': 6,
      'juli': 7, 'agustus': 8, 'september': 9, 'oktober': 10, 'november': 11, 'desember': 12
    };

    return [...uniqueList].sort((a: any, b: any) => {
      const yearA = a.year || 0;
      const yearB = b.year || 0;
      if (yearB !== yearA) return yearB - yearA;
      const m1 = monthOrder[(a.month || '').toLowerCase()] || 0;
      const m2 = monthOrder[(b.month || '').toLowerCase()] || 0;
      return m2 - m1;
    });
  }, [rawData, rawDataAlt]);

  const formatCurrency = (amount: any) => {
    const val = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(val || 0);
  };

  const loading = loading1 || loading2;

  const summary = useMemo(() => {
    if (!iuranList) return { unpaid: 0, total: 0 };
    return iuranList.reduce((acc, curr: any) => {
      if (curr.status !== 'lunas') acc.unpaid++;
      acc.total++;
      return acc;
    }, { unpaid: 0, total: 0 });
  }, [iuranList]);

  return (
    <div className="space-y-6 pb-32 max-w-md mx-auto">
      <PageHeader title="Iuran Bulanan" backUrl="/warga" />

      <div className="px-4 space-y-6">
        {/* Status Card */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-none shadow-sm rounded-3xl bg-white p-4 flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center mb-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Dibayar</p>
            <p className="text-xl font-bold">{summary.total - summary.unpaid}</p>
          </Card>
          <Card className="border-none shadow-sm rounded-3xl bg-white p-4 flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center mb-2">
              <AlertCircle className="w-5 h-5 text-rose-600" />
            </div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Menunggu</p>
            <p className="text-xl font-bold">{summary.unpaid}</p>
          </Card>
        </div>

        {/* History Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Riwayat Tagihan
            </h2>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="p-12 text-center text-muted-foreground bg-white rounded-3xl border border-dashed">Memuat data...</div>
            ) : iuranList.length === 0 ? (
              <div className="p-20 text-center bg-white rounded-[2.5rem] shadow-sm border border-dashed flex flex-col items-center gap-3">
                <CreditCard className="w-12 h-12 opacity-5 text-muted-foreground" />
                <p className="text-muted-foreground text-sm font-medium">Belum ada tagihan iuran.</p>
              </div>
            ) : (
              iuranList.map((item: any) => {
                const amountValue = item.amount ?? item.nominal ?? 0;
                const isPaid = item.status === "lunas";
                
                return (
                  <div key={item.id} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-50 flex items-center gap-4 active:scale-95 transition-transform">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                      isPaid ? "bg-emerald-50" : "bg-amber-50"
                    )}>
                      <CreditCard className={cn(
                        "w-6 h-6",
                        isPaid ? "text-emerald-600" : "text-amber-600"
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-foreground truncate capitalize">{item.month} {item.year}</h3>
                      <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">{formatCurrency(amountValue)}</p>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-2">
                      <Badge 
                        variant={isPaid ? "default" : "secondary"}
                        className={cn(
                          "text-[10px] rounded-full px-3 py-1 border-none font-bold",
                          isPaid ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
                        )}
                      >
                        {isPaid ? "LUNAS" : "BELUM BAYAR"}
                      </Badge>
                      <ArrowRight className="w-4 h-4 text-slate-200" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Info Card */}
        <Card className="border-none shadow-sm rounded-3xl bg-slate-50 overflow-hidden">
          <CardContent className="p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Cara Pembayaran</h3>
              <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">
                Silakan lakukan pembayaran melalui bendahara RT atau transfer ke rekening yang telah ditentukan. Kirimkan bukti bayar melalui menu Pengaduan.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
