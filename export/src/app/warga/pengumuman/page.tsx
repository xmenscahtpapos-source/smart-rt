
"use client";

import { useMemo } from "react";
import { collection, query, orderBy } from "firebase/firestore";
import { useFirestore, useCollection } from "@/firebase";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Info } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";

export default function WargaPengumumanPage() {
  const db = useFirestore();

  const pengumumanQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, "pengumuman"), orderBy("date", "desc"));
  }, [db]);

  const { data: announcements, loading } = useCollection(pengumumanQuery);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6 pb-20">
      <PageHeader title="Berita RT" backUrl="/warga" />

      <div className="grid grid-cols-1 gap-6 px-2">
        {loading ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-dashed">
            <p className="text-muted-foreground">Memuat pengumuman...</p>
          </div>
        ) : announcements.length === 0 ? (
          <div className="p-20 text-center bg-white rounded-3xl border border-dashed flex flex-col items-center justify-center space-y-4">
            <Info className="w-16 h-16 text-muted-foreground/20" />
            <div className="space-y-1">
              <p className="text-xl font-bold text-muted-foreground">Belum ada pengumuman</p>
            </div>
          </div>
        ) : (
          announcements.map((item: any) => (
            <Card key={item.id} className="border-none shadow-sm rounded-3xl overflow-hidden bg-white group">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="outline" className="capitalize text-primary border-primary/20 bg-primary/5 text-[10px]">
                    {item.type || "Umum"}
                  </Badge>
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {formatDate(item.date)}
                  </div>
                </div>
                <CardTitle className="text-base leading-tight group-hover:text-primary transition-colors">{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="py-2">
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line text-xs">
                  {item.content}
                </p>
              </CardContent>
              <CardFooter className="bg-muted/5 py-3 text-[9px] text-muted-foreground flex justify-end italic border-t border-border/10">
                Diterbitkan oleh Pengurus RT
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
