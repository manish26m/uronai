import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import AppShell from "@/components/AppShell";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const sora = Sora({ subsets: ["latin"], variable: "--font-sora", weight: ["400", "600", "700", "800"], display: "swap" });

export const metadata: Metadata = {
  title: "UronAI — AI-Powered Adaptive Learning",
  description: "Build personalized learning roadmaps, practice with AI-generated quizzes, and get matched to real career paths. Powered by Gemini.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${sora.variable} font-sans antialiased bg-[#0c0505] text-white min-h-screen`}>
        <SessionProvider>
          <AppShell>{children}</AppShell>
        </SessionProvider>
      </body>
    </html>
  );
}
