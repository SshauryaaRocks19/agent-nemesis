import Link from "next/link";
import { LayoutDashboard, MessageSquare, Route, ShieldAlert, Settings } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Conversations", href: "/dashboard/conversations", icon: MessageSquare },
  { name: "Agent Chain", href: "/dashboard/chain/latest", icon: Route },
  { name: "Proof", href: "/dashboard/proof", icon: ShieldAlert },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col w-64 border-r border-border bg-sidebar text-sidebar-foreground h-full sticky top-0">
      <div className="p-6 flex items-center h-16 border-b border-border/40">
        <Link href="/" className="font-heading font-extrabold text-xl tracking-tight">
          AgentNemesis
        </Link>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all group",
                isActive 
                  ? "bg-secondary text-foreground" 
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              )}
            >
              <Icon className={cn(
                "h-4 w-4", 
                isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
              )} />
              {item.name}
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-trust-healthy" />
              )}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-border/40">
        <button className="flex items-center gap-3 px-3 py-2.5 w-full rounded-md text-sm font-medium text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-all group">
          <Settings className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
          Settings
        </button>
      </div>
    </div>
  );
}
