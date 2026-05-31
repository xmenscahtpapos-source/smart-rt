
"use client";

import { useState, useMemo } from "react";
import { collection, query, orderBy } from "firebase/firestore";
import { useFirestore, useCollection } from "@/firebase";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Calendar,
  History,
  Search,
  PieChart,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";

export default function WargaKeuanganPage() {
  const db = useFirestore();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM

  const financeQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, "keuangan"), orderBy("tanggal", "desc"));
  }, [db]);

  const { data: transactions, loading } = useCollection(financeQuery);

  const stats = useMemo(() => {
    if (!transactions) return { total: 0, income: 0, expense: 0, monthlyIncome: 0, monthlyExpense: 0 };
    const now = new Date();
    const currentMonthStr = now.toISOString().slice(0, 7);

    return transactions.reduce((acc, curr: any) => {
      const txNominal = Number(curr.nominal);
      const isCurrentMonth = curr.tanggal.startsWith(currentMonthStr);

      if (curr.jenis === "pemasukan") {
        acc.income += txNominal;
        if (isCurrentMonth) acc.monthlyIncome += txNominal;
      } else {
        acc.expense += txNominal;
        if (isCurrentMonth) acc.monthlyExpense += txNominal;
      }
      acc.total = acc.income - acc.expense;
      return acc;
    }, { total: 0, income: 0, expense: 0, monthlyIncome: 0, monthlyExpense: 0 });
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    return transactions.filter((tx: any) => {
      const matchesSearch = tx.kategori?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           tx.keterangan?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesMonth = !selectedMonth || tx.tanggal.startsWith(selectedMonth);
      return matchesSearch && matchesMonth;
    });
  }, [transactions, searchTerm, selectedMonth]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6 pb-32 max-w-md mx-auto overflow-x-hidden">
      <PageHeader title="Laporan Kas RT" backUrl="/warga" />

      <div className="px-4 space-y-6">
        {/* Balance Hero Card */}
        <Card className="rounded-[2.5rem] bg-indigo-600 text-white border-none shadow-xl p-8 relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-[10px] opacity-60 font-bold uppercase tracking-[0.2em] mb-2">Total Saldo Kas RT</p>
            <h2 className="text-3xl font-bold mb-8">{formatCurrency(stats.total)}</h2>
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/10">
              <div className="space-y-1">
                <p className="text-[9px] uppercase font-bold opacity-60 tracking-widest">Pemasukan (Bulan Ini)</p>
                <p className="text-sm font-bold text-emerald-300 flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5" /> {formatCurrency(stats.monthlyIncome)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] uppercase font-bold opacity-60 tracking-widest">Pengeluaran (Bulan Ini)</p>
                <p className="text-sm font-bold text-rose-300 flex items-center gap-1">
                  <ArrowDownLeft className="w-3.5 h-3.5" /> {formatCurrency(stats.monthlyExpense)}
                </p>
              </div>
            </div>
          </div>
          <PieChart className="absolute -right-6 -bottom-6 w-40 h-40 opacity-10 rotate-12" />
        </Card>

        {/* Filter Section */}
        <div className="space-y-5 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-50">
          <div className="space-y-2">
             <Label className="text-[10px] font-bold uppercase tracking-widest opacity-50 ml-1">Periode Laporan</Label>
             <Input 
                type="month" 
                className="h-12 rounded-2xl bg-slate-50 border-none shadow-none focus:ring-1 px-4 text-sm font-bold"
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
              />
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Cari transaksi..." 
              className="pl-12 h-12 rounded-2xl bg-slate-50 border-none shadow-none focus:ring-1 text-sm"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* List Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <History className="w-4 h-4" /> Riwayat Transaksi
            </h2>
            <Badge variant="outline" className="text-[9px] font-bold rounded-full px-3 opacity-50">{filteredTransactions.length} Data</Badge>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="p-12 text-center text-muted-foreground bg-white rounded-3xl border border-dashed">Memuat...</div>
            ) : filteredTransactions.length === 0 ? (
              <div className="p-16 text-center bg-white rounded-[2.5rem] border border-dashed text-muted-foreground text-xs italic">
                Belum ada catatan keuangan untuk periode ini.
              </div>
            ) : (
              filteredTransactions.map((tx: any) => (
                <div key={tx.id} className="bg-white p-5 rounded-[1.75rem] shadow-sm border border-slate-50 flex items-center gap-4 active:scale-95 transition-all">
                  <div className={cn(
                    "w-12 h-12 rounded-[1rem] flex items-center justify-center shrink-0 shadow-sm",
                    tx.jenis === "pemasukan" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                  )}>
                    {tx.jenis === "pemasukan" ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownLeft className="w-6 h-6" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-foreground truncate">{tx.kategori}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                       <p className="text-[9px] text-muted-foreground/60 flex items-center gap-1 shrink-0">
                         <Calendar className="w-3 h-3" /> {new Date(tx.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                       </p>
                       <span className="w-1 h-1 rounded-full bg-slate-200 shrink-0" />
                       <p className="text-[9px] text-muted-foreground truncate italic">{tx.keterangan || "-"}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn(
                      "text-sm font-bold",
                      tx.jenis === "pemasukan" ? "text-emerald-600" : "text-rose-600"
                    )}>
                      {tx.jenis === "pemasukan" ? "+" : "-"}{formatCurrency(tx.nominal)}
                    </p>
                    <ChevronRight className="w-3 h-3 text-slate-200 ml-auto mt-1" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Footer Info */}
        <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 text-center">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Informasi Kas Transparan Smart RT</p>
        </div>
      </div>
    </div>
  );
}
