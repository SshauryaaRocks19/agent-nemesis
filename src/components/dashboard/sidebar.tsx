import Link from "next/link";
import { LayoutDashboard, MessageSquare, Route, ShieldAlert, Settings } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const navItems = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Conversations", href: "/dashboard/conversations", icon: MessageSquare },
  { name: "Agent Chain", href: "/dashboard/agent-chain", icon: Route },
  { name: "Demo Agents", href: "/dashboard/demo-agents", icon: ShieldAlert },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r bg-background lg:flex">
      <div className="flex h-14 items-center border-b px-6 py-4">
        <Link href="/" className="font-heading font-extrabold text-xl tracking-tight text-poppy-outline-sm">
          AgentNemesis
        </Link>
      </div>
      
      <div className="px-6 py-4">
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full w-fit">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-live" />
          <span className="text-xs font-mono font-medium text-emerald-500 tracking-wider">LIVE FEED</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors group relative",
                isActive 
                  ? "bg-secondary text-foreground" 
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              )}
            >
              {isActive && (
                <motion.div 
                  layoutId="sidebar-active-indicator"
                  className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-indigo-500 rounded-r-full"
                />
              )}
              
              <Icon className={cn("h-4 w-4", isActive ? "text-indigo-500" : "text-muted-foreground group-hover:text-foreground")} />
              
              <span className="relative z-10">{item.name}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t">
        <Link href="/dashboard/settings" className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-sm font-medium text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors group">
          <Settings className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
