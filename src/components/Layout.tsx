import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Package, ShoppingCart, Users, BarChart3, Settings, LogOut, Menu, X, Bell, Plus } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { cn } from "../lib/utils";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);
  const [lowStockAlerts, setLowStockAlerts] = React.useState<any[]>([]);

  React.useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const snap = await getDocs(collection(db, "products"));
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const lowStock = items.filter((p: any) => {
          const stock = typeof p.stock === "number" ? p.stock : (p.quantity || 0);
          const minimum = typeof p.minimumStock === "number" ? p.minimumStock : 5;
          return stock <= minimum;
        });
        setLowStockAlerts(lowStock);
      } catch (err) {
        console.error("Erro ao carregar notificações de estoque:", err);
      }
    };
    fetchAlerts();
  }, []);

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
    <div className="min-h-screen bg-bg-base flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden sidebar-gradient text-white p-4 flex justify-between items-center shadow-md">
        <span className="text-xl font-bold tracking-tight uppercase">VendasPro</span>
        <div className="flex items-center gap-2">
          {/* Notification icon on mobile */}
          <div className="relative">
            <button 
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="p-2 relative hover:bg-white/10 rounded-full transition-colors focus:outline-none"
            >
              {lowStockAlerts.length > 0 && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-danger rounded-full border-2 border-[#1E293B]"></span>
              )}
              <Bell size={22} className="text-white" />
            </button>

            {/* Mobile Notification Dropdown */}
            {isNotificationsOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsNotificationsOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-72 bg-bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-border text-text-main">
                  <div className="p-4 flex items-center justify-between bg-bg-base/70">
                    <span className="text-xs font-bold text-text-main uppercase tracking-wider">Notificações</span>
                    {lowStockAlerts.length > 0 && (
                      <span className="px-2 py-0.5 bg-danger/10 text-danger text-xs font-black rounded-full uppercase tracking-wider">
                        {lowStockAlerts.length} Alerta{lowStockAlerts.length > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {lowStockAlerts.length === 0 ? (
                      <div className="p-6 text-center text-xs text-text-muted italic">
                        🐾 Você não possui novas notificações
                      </div>
                    ) : (
                      lowStockAlerts.map((prod: any) => {
                        const stock = typeof prod.stock === "number" ? prod.stock : (prod.quantity || 0);
                        return (
                          <div key={prod.id} className="p-4 flex items-start gap-3 hover:bg-bg-elevated/40 transition-colors">
                            <div className="p-1 px-2.5 bg-danger/10 text-danger font-black text-xs rounded-lg shrink-0">
                              {stock}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-text-main truncate">{prod.name}</p>
                              <p className="text-xs text-text-secondary mt-0.5">Estoque crítico!</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
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
                  ? "bg-white/10 text-primary font-bold border-l-4 border-primary" 
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon size={20} className="shrink-0" />
              <span className="text-sm font-medium tracking-wide">{item.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-6 mt-auto border-t border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-black text-primary shrink-0 border border-primary/30">
              {(profile?.name?.[0] || profile?.username?.[0] || "U").toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold truncate">{profile?.name || "Usuário"}</p>
                <span className={cn(
                  "px-2 py-0.5 rounded text-xs font-black uppercase tracking-wider border",
                  profile?.role === "admin" ? "bg-amber-500/20 text-primary border-primary/20" : "bg-white/10 text-white/80 border-white/15"
                )}>
                  {profile?.role === "admin" ? "Admin" : "Vendedor"}
                </span>
              </div>
              <p className="text-xs text-white/60 truncate">{profile?.email}</p>
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
        <header className="h-16 bg-bg-card shadow-sm flex items-center justify-between px-8 border-b border-border shrink-0 hidden md:flex">
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <span>Home</span>
            <span className="text-text-muted">/</span>
            <span className="text-text-main font-semibold">Dashboard Principal</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-2 relative hover:bg-bg-elevated/50 rounded-full transition-colors focus:outline-none"
              >
                {lowStockAlerts.length > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-danger rounded-full border-2 border-bg-card animate-pulse"></span>
                )}
                <Bell size={20} className="text-text-secondary" />
              </button>

              {/* Notification Popover */}
              {isNotificationsOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsNotificationsOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 bg-bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-border text-text-main">
                    <div className="p-4 flex items-center justify-between bg-bg-base/70">
                      <span className="text-xs font-bold text-text-main uppercase tracking-wider">Notificações</span>
                      {lowStockAlerts.length > 0 && (
                        <span className="px-2.5 py-0.5 bg-danger/10 text-danger text-xs font-black rounded-full uppercase tracking-wider">
                          {lowStockAlerts.length} Alerta{lowStockAlerts.length > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {lowStockAlerts.length === 0 ? (
                        <div className="p-6 text-center text-xs text-text-muted italic">
                          🐾 Você não possui novas notificações
                        </div>
                      ) : (
                        lowStockAlerts.map((prod: any) => {
                          const stock = typeof prod.stock === "number" ? prod.stock : (prod.quantity || 0);
                          return (
                            <div key={prod.id} className="p-4 flex items-start gap-3 hover:bg-bg-elevated/40 transition-colors">
                              <div className="p-1 px-2.5 bg-danger/10 text-danger font-black text-xs rounded-lg border border-danger/15 shrink-0">
                                {stock}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-text-main truncate">{prod.name}</p>
                                <p className="text-xs text-text-secondary mt-0.5">Estoque crítico! Reabastecer o quanto antes.</p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
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
