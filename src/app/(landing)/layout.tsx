import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SmoothScroll } from "@/components/layout/smooth-scroll";

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SmoothScroll>
      <div className="min-h-screen flex flex-col relative z-10">
        <header className="fixed top-0 z-50 w-full bg-background/80 backdrop-blur-md">
          <div className="container flex h-16 items-center justify-between mx-auto px-8 max-w-7xl">
            <Link href="/" className="flex items-center space-x-2">
              <span className="font-heading font-extrabold text-xl tracking-tight">AgentNemesis</span>
            </Link>
            <nav className="flex items-center gap-8">
              <Link href="/docs" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Docs
              </Link>
              <Link href="https://github.com/SshauryaaRocks19/agent-nemesis" target="_blank" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                GitHub
              </Link>
              <Link
                href="/dashboard"
                className="group inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Dashboard
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </SmoothScroll>
  );
}

