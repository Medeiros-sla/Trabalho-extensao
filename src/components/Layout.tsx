import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Package, ShoppingCart, Users, BarChart3, Settings, LogOut, Menu, X, Bell, Plus } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { cn } from "../lib/utils";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const navItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Estoque", path: "/estoque", icon: Package },
    { name: "Vendas", path: "/vendas", icon: ShoppingCart },
    { name: "Clientes", path: "/clientes", icon: Users },
    { name: "Relatórios", path: "/relatorios", icon: BarChart3 },
    { name: "Configurações", path: "/config", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-[#1565C0] text-white p-4 flex justify-between items-center shadow-md">
        <span className="text-xl font-bold">VendasPro</span>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar (Desktop & Mobile) */}
      <aside className={cn(
        "fixed inset-0 z-50 transform md:relative md:translate-x-0 transition-transform duration-300 ease-in-out sidebar-gradient text-white w-64 flex flex-col shadow-xl",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <div className="w-6 h-6 bg-primary rounded-sm transform rotate-45"></div>
          </div>
          <span className="text-xl font-bold tracking-tight uppercase">VendasPro</span>
        </div>

        <nav className="flex-1 px-4 mt-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                isActive 
                  ? "bg-white/10 text-white font-medium border-l-4 border-white" 
                  : "text-white/70 hover:bg-white/5"
              )}
            >
              <item.icon size={20} className="shrink-0" />
              <span className="text-sm font-medium tracking-wide">{item.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-6 mt-auto border-t border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-blue-300 flex items-center justify-center text-xs font-bold text-primary-dark shrink-0">
              {profile?.name?.[0] || "U"}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold truncate">{profile?.name || "Usuário"}</p>
                <span className={cn(
                  "px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider scale-90",
                  profile?.role === "admin" ? "bg-amber-500/25 text-amber-200" : "bg-blue-400/25 text-blue-200"
                )}>
                  {profile?.role === "admin" ? "Admin" : "Vendedor"}
                </span>
              </div>
              <p className="text-[10px] text-white/60 truncate">{profile?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2 text-white/70 hover:text-white hover:bg-red-500/20 rounded-lg transition-colors text-sm font-medium"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header from Design */}
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-8 border-b border-gray-200 shrink-0 hidden md:flex">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Home</span>
            <span className="text-gray-300">/</span>
            <span className="text-text-main font-medium">Dashboard Principal</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 relative hover:bg-gray-50 rounded-full transition-colors">
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              <Bell size={20} className="text-gray-400" />
            </button>
            <button 
              onClick={() => navigate("/vendas")}
              className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-primary-dark transition-colors shadow-sm"
            >
              <Plus size={18} /> Nova Venda
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};
