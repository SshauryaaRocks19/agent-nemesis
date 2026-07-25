import type { Metadata } from "next";
import { Viga, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const viga = Viga({
  weight: "400",
  variable: "--font-viga",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AgentNemesis",
  description: "Does your agent do what it says? Trust-auditing dashboard for AI agents.",
};

import { Grain } from "@/components/ui/grain";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html
        lang="en"
        className={`${viga.variable} ${jetbrainsMono.variable} h-full antialiased dark`}
      >
        <body className="min-h-full flex flex-col bg-background text-foreground">
        <Grain />
        {children}
      </body>
    </html>
  );
}
