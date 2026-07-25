import {ClerkProvider} from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import type { Metadata } from "next";
import { Viga, JetBrains_Mono, Outfit } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const viga = Viga({
  weight: "400",
  variable: "--font-viga",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
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



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html
        lang="en"
        className={`${viga.variable} ${outfit.variable} ${jetbrainsMono.variable} h-full antialiased dark`}
      >
        <body className="min-h-full flex flex-col bg-background text-foreground">
          <ClerkProvider appearance={{ theme: shadcn }}>
            {children}
            <Toaster position="bottom-right" theme="dark" />
          </ClerkProvider>
        </body>
    </html>
  );
}