import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Learning OS",
  description: "AI-Powered Personal Learning & Career Guidance Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-950 text-white min-h-screen flex`}>
        <div className="w-64 flex-shrink-0">
          <Sidebar />
        </div>
        <main className="flex-1 flex flex-col min-h-screen p-8">
          {children}
        </main>
      </body>
    </html>
  );
}
