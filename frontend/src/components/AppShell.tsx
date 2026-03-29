import { useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import Sidebar from "./Sidebar";

const AUTH_ROUTES = ["/auth/login", "/auth/register", "/"];
const NO_SHELL_ROUTES = ["/auth/login", "/auth/register", "/"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAuthPage = NO_SHELL_ROUTES.some(r => pathname === r);

  if (isAuthPage) return <>{children}</>;

  return (
    <div className="flex min-h-screen relative overflow-x-hidden">
      {/* Mobile Menu Toggle */}
      <div className="lg:hidden fixed top-4 right-4 z-[60]">
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
          className="p-3 bg-gray-900/90 backdrop-blur-xl border border-gray-800 rounded-2xl text-white shadow-2xl shadow-black hover:bg-red-600/20 transition-all border-red-500/20"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Sidebar / Mobile Drawer */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 transform transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] 
        ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} 
        lg:relative lg:flex-shrink-0 lg:sticky lg:top-0 lg:h-screen lg:z-10 bg-[#0c0505] shadow-2xl lg:shadow-none`}>
        <Sidebar onClose={() => setMobileMenuOpen(false)} />
      </div>

      {/* Backdrop overlay for mobile */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-md lg:hidden transition-opacity duration-300" 
          onClick={() => setMobileMenuOpen(false)} 
        />
      )}

      <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-x-hidden w-full relative">
        {children}
      </main>
    </div>
  );
}
