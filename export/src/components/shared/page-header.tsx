
"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface PageHeaderProps {
  title: string;
  backUrl?: string;
}

export function PageHeader({ title, backUrl }: PageHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (backUrl) {
      router.push(backUrl);
    } else {
      if (window.history.length > 1) {
        router.back();
      } else {
        router.push("/");
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur-md border-b border-border/50 -mx-4 px-4 py-3 mb-6">
      <div className="flex items-center gap-3 max-w-md mx-auto">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-11 w-11 rounded-full hover:bg-muted active:scale-90 transition-transform shrink-0"
          onClick={handleBack}
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold tracking-tight truncate">{title}</h1>
      </div>
    </header>
  );
}
