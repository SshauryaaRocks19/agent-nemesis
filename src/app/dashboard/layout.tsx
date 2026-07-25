"use client";

import { Sidebar } from "@/components/dashboard/sidebar";
import { Play } from "lucide-react";
import { usePathname } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Simple breadcrumb logic based on path
  const paths = pathname.split('/').filter(Boolean);
  const breadcrumb = paths.length > 1 ? paths[1].charAt(0).toUpperCase() + paths[1].slice(1) : "Overview";

  return (
    <div className="flex h-screen overflow-hidden relative z-10">
      <Sidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="h-16 flex-shrink-0 border-b border-border/40 bg-background/80 backdrop-blur-md flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono">
            <span>Dashboard</span>
            <span>/</span>
            <span className="text-foreground">{breadcrumb}</span>
          </div>
          
          <button className="inline-flex h-9 items-center justify-center rounded-md bg-secondary border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80">
            <Play className="mr-2 h-4 w-4 text-trust-healthy" />
            Run Analysis
          </button>
        </header>
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
