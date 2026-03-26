"use client";

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

const AUTH_ROUTES = ["/auth/login", "/auth/register", "/"];
const NO_SHELL_ROUTES = ["/auth/login", "/auth/register", "/"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const isAuthPage = NO_SHELL_ROUTES.some(r => pathname === r);

  if (isAuthPage) return <>{children}</>;

  return (
    <div className="flex min-h-screen">
      <div className="w-64 flex-shrink-0 sticky top-0 h-screen">
        <Sidebar />
      </div>
      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}
