"use client";

import { Sidebar } from "@/components/dashboard/sidebar";
import { Search, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full bg-background font-sans text-foreground">
      <Sidebar />
      <div className="flex w-full flex-col lg:pl-64">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-4">
          <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
            <form 
              className="ml-auto flex-1 sm:flex-initial"
              onSubmit={(e) => {
                e.preventDefault();
                const q = new FormData(e.currentTarget).get("q");
                if (q) window.location.href = `/dashboard/search?q=${encodeURIComponent(q.toString())}`;
              }}
            >
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  name="q"
                  type="search"
                  placeholder="Search agents, metrics..."
                  className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px] bg-muted/40 border-none"
                />
              </div>
            </form>
            <button className="rounded-full w-8 h-8 flex items-center justify-center bg-muted/50 hover:bg-muted text-muted-foreground transition-colors">
              <Bell className="h-4 w-4" />
            </button>
            <Separator orientation="vertical" className="h-6" />
            <Show when="signed-out">
              <SignInButton />
              <SignUpButton />
            </Show>
            <Show when="signed-in">
              <UserButton />
            </Show>
          </div>
        </header>
        
        {/* Main Content Area */}
        <main className="flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          <div className="mx-auto grid w-full max-w-7xl items-start gap-6 pt-4 pb-12">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
