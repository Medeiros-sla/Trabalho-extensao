import React, { useEffect, useState } from "react";
import { collection, getDocs, query, limit } from "firebase/firestore";
import { db } from "../lib/firebase";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, AlertTriangle, Package, DollarSign, Users, Award, ShoppingBag, ArrowRight, Lightbulb } from "lucide-react";
import { formatCurrency, OperationType, handleFirestoreError } from "../lib/utils";
import { startOfDay, startOfMonth } from "date-fns";
import { motion } from "motion/react";

interface ProductRanking {
  name: string;
  qtySold: number;
}

export const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    monthlyRevenue: 0,
    dailySalesCount: 0,
    lowStockCount: 0,
    totalClients: 0,
    totalProducts: 4
  });

  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [topProductsRanking, setTopProductsRanking] = useState<ProductRanking[]>([]);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const now = new Date();
        const startDay = startOfDay(now);
        const startMonth = startOfMonth(now);

        // Fetch sales
        const salesSnap = await getDocs(collection(db, "sales"));
        const salesDocs = salesSnap.docs.map(d => d.data());

        // Calculate Monthly revenue & Daily sales count
        let monthlyRevenue = 0;
        let dailySalesCount = 0;

        salesDocs.forEach(s => {
          const createdAtDate = s.createdAt?.toDate ? s.createdAt.toDate() : null;
          if (createdAtDate) {
            if (createdAtDate >= startMonth) {
              monthlyRevenue += (s.total || 0);
            }
            if (createdAtDate >= startDay) {
              dailySalesCount += 1;
            }
          }
        });

        // Compute genuine best-selling products ranking
        const productStatsMap: { [key: string]: { name: string; qty: number } } = {};
        salesDocs.forEach(s => {
          if (s.items && Array.isArray(s.items)) {
            s.items.forEach((item: any) => {
              if (item.name) {
                const existing = productStatsMap[item.name] || { name: item.name, qty: 0 };
                existing.qty += (item.quantity || 1);
                productStatsMap[item.name] = existing;
              }
            });
          }
        });

        const sortedRanking: ProductRanking[] = Object.values(productStatsMap)
          .sort((a, b) => b.qty - a.qty)
          .slice(0, 5)
          .map(entry => ({ name: entry.name, qtySold: entry.qty }));

        // Fetch clients count
        const clientsSnap = await getDocs(collection(db, "clients"));
        const totalClients = clientsSnap.size;

        // Fetch products for listing & low stock calculation
        const productsSnap = await getDocs(collection(db, "products"));
        const productsList = productsSnap.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || "",
            code: data.code || "",
            category: data.category || "",
            stock: typeof data.stock === "number" ? data.stock : (data.quantity || 0),
            minimumStock: typeof data.minimumStock === "number" ? data.minimumStock : 5
          };
        });

        // Count items with stock lower or equal to minimum stock
        const lowStockItems = productsList.filter(p => p.stock <= p.minimumStock);
        
        setMetrics({
          monthlyRevenue,
          dailySalesCount,
          lowStockCount: lowStockItems.length,
          totalClients,
          totalProducts: productsList.length
        });

        setLowStockProducts(lowStockItems.slice(0, 5));
        
        // If no real ranking computed yet, provide safe default empty state
        if (sortedRanking.length === 0) {
          setTopProductsRanking([
            { name: "Sem vendas registrada", qtySold: 0 }
          ]);
        } else {
          setTopProductsRanking(sortedRanking);
        }

        setLoading(false);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, "dashboard");
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  const cards = [
    { title: "Faturamento do Mês", value: formatCurrency(metrics.monthlyRevenue), icon: DollarSign, color: "border-amber-500 text-amber-600 bg-amber-50" },
    { title: "Vendas do Dia", value: metrics.dailySalesCount, icon: ShoppingBag, color: "border-blue-500 text-blue-600 bg-blue-50" },
    { title: "Estoque em Alerta", value: metrics.lowStockCount, icon: AlertTriangle, color: "border-red-500 text-red-600 bg-red-50" },
    { title: "Clientes / Tutores", value: metrics.totalClients, icon: Users, color: "border-purple-500 text-purple-600 bg-purple-50" },
    { title: "Produtos no Catálogo", value: metrics.totalProducts, icon: Package, color: "border-teal-500 text-teal-600 bg-teal-50" }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-24">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      <header className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-bold text-text-main">Dashboard Operacional</h2>
          <p className="text-sm text-gray-500 font-medium">Indicadores financeiros e operacionais do seu Pet Shop em tempo real</p>
        </div>
      </header>

      {/* Real Indicators Cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((card, idx) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`bg-white p-5 rounded-xl shadow-card border-l-4 border-solid border-l-amber-500 flex flex-col justify-between`}
            style={{ borderLeftColor: card.color.split(" ")[0].replace("border-", "") }}
          >
            <div className="flex justify-between items-start mb-4">
              <span className="text-[9px] uppercase font-black text-gray-400 tracking-wider leading-tight">{card.title}</span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.color.split(" ").slice(1).join(" ")} shrink-0`}>
                <card.icon size={16} />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight">{card.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Top Product Ranking chart widget */}
        <div className="bg-white p-6 rounded-xl shadow-card border border-gray-100 lg:col-span-7 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-bold text-[#1F2937] flex items-center gap-2 text-sm uppercase tracking-tight">
              <Award size={18} className="text-amber-500" />
              Ranking de Campeões de Venda
            </h4>
          </div>
          
          <div className="h-[280px] w-full">
            {topProductsRanking.length === 1 && topProductsRanking[0].qtySold === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
                <Package size={48} className="opacity-10 mb-2" />
                <p className="text-xs font-bold uppercase tracking-wider">Aguardando as primeiras movimentações</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProductsRanking}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#9CA3AF", fontWeight: "bold" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#9CA3AF" }} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(239, 68, 68, 0.02)' }}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '11px', fontWeight: 'bold' }}
                   />
                  <Bar dataKey="qtySold" radius={[6, 6, 0, 0]} label={{ position: 'top', fontSize: 10, fontWeight: 'bold', fill: '#D97706' }}>
                    {topProductsRanking.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? "#D97706" : "#F59E0B"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Low Stock alerting listing widget */}
        <div className="bg-white p-6 rounded-xl shadow-card border border-gray-100 lg:col-span-5 flex flex-col self-stretch">
          <div className="flex justify-between items-center mb-6 border-b border-gray-50 pb-3">
            <h4 className="font-bold text-[#1F2937] flex items-center gap-2 text-sm uppercase tracking-tight">
              <AlertTriangle size={17} className="text-danger" />
              Ruptura de Estoque / Alertas
            </h4>
            <span className="text-[10px] font-black uppercase text-red-600 bg-red-50 border border-red-100 px-2.5 py-1 rounded-full">{metrics.lowStockCount} alertas</span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[220px] custom-scrollbar">
            {lowStockProducts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 py-12">
                <Package size={40} className="mx-auto mb-2 opacity-10 text-green-500" />
                <p className="text-xs uppercase font-extrabold text-green-600">Estoque 100% Abastecido!</p>
              </div>
            ) : (
              lowStockProducts.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3.5 bg-red-50/50 rounded-xl border border-red-100 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-white rounded-lg flex flex-col items-center justify-center font-black text-red-600 border border-red-150 shadow-sm shrink-0">
                      <span className="text-xs leading-none">{item.stock}</span>
                      <span className="text-[7px] text-gray-400 font-bold uppercase tracking-tight">Qtd</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-gray-900 truncate" title={item.name}>{item.name}</p>
                      <p className="text-[9px] text-gray-400 uppercase font-bold">Categoria: {item.category}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-red-100 text-red-600 text-[8px] font-extrabold rounded uppercase tracking-wider shrink-0">Reposição</span>
                </div>
              ))
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-50 shrink-0">
            <div className="bg-blue-50 p-3.5 rounded-lg border border-blue-150 flex items-start gap-2.5">
              <Lightbulb size={24} className="text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[9px] text-blue-600 font-extrabold uppercase tracking-wider mb-0.5">Dica Operacional de Vendas</p>
                <p className="text-[11px] text-blue-800 leading-snug font-medium">O estoque de rações e petiscos costuma ter maior saída nos finais de semana. Verifique o abastecimento toda sexta-feira pela manhã!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
