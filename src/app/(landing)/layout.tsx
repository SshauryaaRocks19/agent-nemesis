import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SmoothScroll } from "@/components/layout/smooth-scroll";
import { Navbar, NavBody, NavItems, NavbarButton } from "@/components/ui/resizable-navbar";

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SmoothScroll>
      <div className="min-h-screen flex flex-col relative z-10">
        <Navbar>
          <NavBody>
            <Link href="/" className="flex items-center space-x-2 relative z-20 mr-4">
              <span className="font-heading font-extrabold text-3xl tracking-tight text-poppy-outline-sm">AgentNemesis</span>
            </Link>
            <NavItems 
              items={[
                { name: "Docs", link: "/docs" },
                { name: "GitHub", link: "https://github.com/SshauryaaRocks19/agent-nemesis" }
              ]} 
            />
            <div className="flex items-center space-x-4 relative z-20">
              <NavbarButton href="/dashboard" variant="primary" className="flex items-center">
                Dashboard <ArrowRight className="inline-block ml-2 w-4 h-4" />
              </NavbarButton>
            </div>
          </NavBody>
        </Navbar>
        <main className="flex-1">{children}</main>
      </div>
    </SmoothScroll>
  );
}

