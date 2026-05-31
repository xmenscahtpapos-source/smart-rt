
"use client";

import { useMemo, useState } from "react";
import { collection, query, orderBy, addDoc, doc, deleteDoc } from "firebase/firestore";
import { useFirestore, useCollection } from "@/firebase";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Bell, Plus, Trash2, Calendar, Megaphone, Loader2 } from "lucide-react";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { PageHeader } from "@/components/shared/page-header";

export default function AdminPengumumanPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "Umum",
  });

  const pengumumanQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, "pengumuman"), orderBy("date", "desc"));
  }, [db]);

  const { data: announcements, loading } = useCollection(pengumumanQuery);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    if (!formData.title || !formData.content) {
      toast({ variant: "destructive", title: "Gagal", description: "Lengkapi judul dan isi pengumuman." });
      return;
    }

    setIsSubmitting(true);
    const newAnnouncement = {
      title: formData.title,
      content: formData.content,
      type: formData.type,
      date: new Date().toISOString(),
    };

    addDoc(collection(db, "pengumuman"), newAnnouncement)
      .then(() => {
        toast({ title: "Berhasil", description: "Pengumuman telah diterbitkan." });
        setFormData({ title: "", content: "", type: "Umum" });
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: "pengumuman",
          operation: "create",
          requestResourceData: newAnnouncement,
        });
        errorEmitter.emit("permission-error", permissionError);
      })
      .finally(() => setIsSubmitting(false));
  };

  const handleDelete = (id: string) => {
    if (!db) return;
    const docRef = doc(db, "pengumuman", id);
    deleteDoc(docRef).catch(async (error) => {
      const permissionError = new FirestorePermissionError({
        path: docRef.path,
        operation: "delete",
      });
      errorEmitter.emit("permission-error", permissionError);
    });
    toast({ title: "Dihapus", description: "Pengumuman telah dihapus." });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6 pb-20">
      <PageHeader title="Berita RT" backUrl="/admin" />

      <div className="grid grid-cols-1 gap-8 px-2">
        <Card className="border-none shadow-sm rounded-3xl h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Plus className="w-5 h-5 text-primary" />
              Buat Baru
            </CardTitle>
            <CardDescription>Buat pengumuman baru untuk warga.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold opacity-50">Kategori</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                  <SelectTrigger className="rounded-xl h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Umum">Umum</SelectItem>
                    <SelectItem value="Kegiatan">Kegiatan</SelectItem>
                    <SelectItem value="Keamanan">Keamanan</SelectItem>
                    <SelectItem value="Darurat">Darurat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold opacity-50">Judul Pengumuman</Label>
                <Input 
                  placeholder="Contoh: Kerja Bakti Minggu Ini" 
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="rounded-xl h-12"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold opacity-50">Isi Pengumuman</Label>
                <Textarea 
                  placeholder="Tuliskan detail informasi di sini..." 
                  className="min-h-[120px] rounded-xl"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full rounded-xl h-12 shadow-lg" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Megaphone className="w-4 h-4 mr-2" />}
                Terbitkan Sekarang
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
          <CardHeader className="bg-white border-b border-border/50">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="w-5 h-5 text-primary" />
              Riwayat Pengumuman
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-12 text-center text-muted-foreground">Memuat data...</div>
            ) : announcements.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground italic">Belum ada pengumuman.</div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="px-6">Info</TableHead>
                    <TableHead className="px-6 text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {announcements.map((a: any) => (
                    <TableRow key={a.id} className="hover:bg-muted/5">
                      <TableCell className="px-6 py-4">
                        <div className="font-bold text-sm">{a.title}</div>
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(a.date)} • <span className="text-primary font-bold">{a.type}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-red-500 hover:text-red-600 h-10 w-10"
                          onClick={() => handleDelete(a.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
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
