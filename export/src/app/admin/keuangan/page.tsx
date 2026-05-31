
"use client";

import { useState, useMemo } from "react";
import { collection, query, orderBy, addDoc, deleteDoc, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { useFirestore, useCollection } from "@/firebase";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Wallet, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Trash2, 
  Loader2,
  Calendar,
  History,
  Download,
  Search,
  Edit2
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";

const KATEGORI_PEMASUKAN = ["Iuran Bulanan", "Donasi", "Bantuan", "Lainnya"];
const KATEGORI_PENGELUARAN = ["Kebersihan", "Keamanan", "Kegiatan RT", "Santunan", "Operasional", "Lainnya"];

export default function AdminKeuanganPage() {
  const db = useFirestore();
  const { profile } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<any>(null);
  
  const [filterType, setFilterType] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM

  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    jenis: "pemasukan",
    kategori: "Iuran Bulanan",
    nominal: 0,
    keterangan: ""
  });

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
      const matchesType = filterType === "all" || tx.jenis === filterType;
      const matchesSearch = tx.kategori?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           tx.keterangan?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesMonth = !selectedMonth || tx.tanggal.startsWith(selectedMonth);
      return matchesType && matchesSearch && matchesMonth;
    });
  }, [transactions, filterType, searchTerm, selectedMonth]);

  const handleEdit = (tx: any) => {
    setEditingTx(tx);
    setFormData({
      tanggal: tx.tanggal,
      jenis: tx.jenis,
      kategori: tx.kategori,
      nominal: tx.nominal,
      keterangan: tx.keterangan || ""
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !profile) return;
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        nominal: Number(formData.nominal),
        updatedAt: serverTimestamp(),
        updatedBy: profile.uid
      };

      if (editingTx) {
        await updateDoc(doc(db, "keuangan", editingTx.id), payload);
        toast({ title: "Berhasil", description: "Transaksi diperbarui." });
      } else {
        await addDoc(collection(db, "keuangan"), {
          ...payload,
          createdAt: serverTimestamp(),
          createdBy: profile.uid
        });
        toast({ title: "Berhasil", description: "Transaksi dicatat." });
      }
      
      setIsDialogOpen(false);
      setEditingTx(null);
      setFormData({
        tanggal: new Date().toISOString().split('T')[0],
        jenis: "pemasukan",
        kategori: "Iuran Bulanan",
        nominal: 0,
        keterangan: ""
      });
    } catch (err) {
      toast({ variant: "destructive", title: "Gagal Menyimpan" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!db) return;
    try {
      await deleteDoc(doc(db, "keuangan", id));
      toast({ title: "Dihapus", description: "Data transaksi telah dihapus." });
    } catch (err) {
      toast({ variant: "destructive", title: "Gagal Menghapus" });
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
  };

  const exportCSV = () => {
    if (filteredTransactions.length === 0) return;
    const headers = ["Tanggal", "Jenis", "Kategori", "Nominal", "Keterangan"];
    const rows = filteredTransactions.map((tx: any) => [
      tx.tanggal,
      tx.jenis,
      tx.kategori,
      tx.nominal,
      tx.keterangan
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Keuangan_RT_${selectedMonth || 'Semua'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-24">
      <PageHeader title="Keuangan RT" backUrl="/admin" />

      <div className="grid grid-cols-1 gap-4 px-2">
        <Card className="rounded-[2.5rem] bg-indigo-600 text-white border-none shadow-xl p-6 relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-xs opacity-60 font-bold uppercase tracking-widest mb-1">Total Saldo Kas RT</p>
            <h2 className="text-3xl font-bold mb-6">{formatCurrency(stats.total)}</h2>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
              <div>
                <p className="text-[9px] uppercase font-bold opacity-60 mb-1">Pemasukan (Bulan Ini)</p>
                <p className="text-sm font-bold text-emerald-300">+{formatCurrency(stats.monthlyIncome)}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase font-bold opacity-60 mb-1">Pengeluaran (Bulan Ini)</p>
                <p className="text-sm font-bold text-rose-300">-{formatCurrency(stats.monthlyExpense)}</p>
              </div>
            </div>
          </div>
          <Wallet className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 rotate-12" />
        </Card>
      </div>

      <div className="px-2">
        <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-1">
          <Button 
            variant={filterType === "all" ? "default" : "outline"} 
            size="sm" 
            className="rounded-full h-9 px-6 text-[11px] font-bold uppercase"
            onClick={() => setFilterType("all")}
          >Semua</Button>
          <Button 
            variant={filterType === "pemasukan" ? "default" : "outline"} 
            size="sm" 
            className="rounded-full h-9 px-6 text-[11px] font-bold uppercase border-emerald-200 text-emerald-700"
            onClick={() => setFilterType("pemasukan")}
          >Pemasukan</Button>
          <Button 
            variant={filterType === "pengeluaran" ? "default" : "outline"} 
            size="sm" 
            className="rounded-full h-9 px-6 text-[11px] font-bold uppercase border-rose-200 text-rose-700"
            onClick={() => setFilterType("pengeluaran")}
          >Pengeluaran</Button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="relative col-span-2">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Cari kategori atau keterangan..." 
              className="pl-11 h-12 rounded-2xl bg-white border-none android-shadow"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <Input 
            type="month" 
            className="h-12 rounded-2xl bg-white border-none android-shadow px-4"
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
          />
          <Button variant="outline" className="h-12 rounded-2xl bg-white border-none android-shadow" onClick={exportCSV}>
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingTx(null);
            setFormData({
              tanggal: new Date().toISOString().split('T')[0],
              jenis: "pemasukan",
              kategori: "Iuran Bulanan",
              nominal: 0,
              keterangan: ""
            });
          }
        }}>
          <DialogTrigger asChild>
            <Button className="w-full h-14 rounded-3xl bg-primary shadow-lg mb-8">
              <Plus className="w-5 h-5 mr-2" /> Catat Transaksi Baru
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-[2.5rem] w-[95%] max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle>{editingTx ? "Edit Transaksi" : "Input Keuangan"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase opacity-50">Jenis</Label>
                  <select 
                    value={formData.jenis} 
                    onChange={e => {
                      const newJenis = e.target.value;
                      setFormData({
                        ...formData, 
                        jenis: newJenis,
                        kategori: newJenis === "pemasukan" ? KATEGORI_PEMASUKAN[0] : KATEGORI_PENGELUARAN[0]
                      });
                    }}
                    className="w-full h-12 px-4 rounded-2xl border bg-background text-sm"
                  >
                    <option value="pemasukan">Pemasukan</option>
                    <option value="pengeluaran">Pengeluaran</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase opacity-50">Tanggal</Label>
                  <Input type="date" value={formData.tanggal} onChange={e => setFormData({...formData, tanggal: e.target.value})} className="rounded-2xl h-12" required />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase opacity-50">Kategori</Label>
                <select 
                  value={formData.kategori} 
                  onChange={e => setFormData({...formData, kategori: e.target.value})}
                  className="w-full h-12 px-4 rounded-2xl border bg-background text-sm"
                >
                  {(formData.jenis === "pemasukan" ? KATEGORI_PEMASUKAN : KATEGORI_PENGELUARAN).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase opacity-50">Nominal (IDR)</Label>
                <Input type="number" value={formData.nominal} onChange={e => setFormData({...formData, nominal: Number(e.target.value)})} className="rounded-2xl h-12 font-bold" required />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase opacity-50">Keterangan</Label>
                <Input value={formData.keterangan} onChange={e => setFormData({...formData, keterangan: e.target.value})} placeholder="Contoh: Donasi dari Blok A10" className="rounded-2xl h-12" />
              </div>
              <DialogFooter className="pt-4 gap-2">
                <Button type="button" variant="ghost" className="flex-1 rounded-2xl" onClick={() => setIsDialogOpen(false)}>Batal</Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1 rounded-2xl bg-indigo-600 hover:bg-indigo-700">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : editingTx ? "Simpan Perubahan" : "Simpan Transaksi"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <History className="w-4 h-4" /> Riwayat Transaksi
            </h2>
            <span className="text-[10px] font-bold opacity-40">{filteredTransactions.length} Transaksi</span>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="p-12 text-center text-muted-foreground">Memuat...</div>
            ) : filteredTransactions.length === 0 ? (
              <div className="p-16 text-center bg-white rounded-[2.5rem] border border-dashed text-muted-foreground text-sm">
                Tidak ada data untuk periode ini.
              </div>
            ) : (
              filteredTransactions.map((tx: any) => (
                <div key={tx.id} className="bg-white p-4 rounded-[2rem] android-shadow border border-white/50 flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                    tx.jenis === "pemasukan" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                  )}>
                    {tx.jenis === "pemasukan" ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownLeft className="w-6 h-6" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-foreground truncate">{tx.kategori}</h3>
                    <p className="text-[9px] text-muted-foreground/60 flex items-center gap-1.5 mt-0.5 truncate">
                      <Calendar className="w-3 h-3" /> {new Date(tx.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })} • {tx.keterangan || "-"}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn(
                      "text-sm font-bold",
                      tx.jenis === "pemasukan" ? "text-emerald-600" : "text-rose-600"
                    )}>
                      {tx.jenis === "pemasukan" ? "+" : "-"}{formatCurrency(tx.nominal)}
                    </p>
                    <div className="flex justify-end gap-1 mt-1">
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground rounded-full" onClick={() => handleEdit(tx)}>
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-red-500 rounded-full">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-3xl w-[90%] max-w-sm mx-auto">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Hapus Transaksi?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Apakah Anda yakin ingin menghapus catatan transaksi ini?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="flex-row gap-2 mt-4">
                            <AlertDialogCancel className="flex-1 mt-0 rounded-2xl h-11">Batal</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDelete(tx.id)}
                              className="flex-1 rounded-2xl h-11 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Hapus
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
