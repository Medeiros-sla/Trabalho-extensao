import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, AlertTriangle, Package, DollarSign, Calendar, ArrowRight } from "lucide-react";
import { formatCurrency, cn } from "../lib/utils";
import { startOfDay, startOfWeek, startOfMonth, subDays } from "date-fns";
import { motion } from "motion/react";

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    today: 0,
    week: 0,
    month: 0,
  });
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const now = new Date();
        const startDay = startOfDay(now);
        const startWeek = startOfWeek(now);
        const startMonth = startOfMonth(now);

        const salesRef = collection(db, "sales");
        
        // Today
        const qToday = query(salesRef, where("createdAt", ">=", Timestamp.fromDate(startDay)));
        const snapToday = await getDocs(qToday);
        const totalToday = snapToday.docs.reduce((acc, doc) => acc + (doc.data().total || 0), 0);

        // Week
        const qWeek = query(salesRef, where("createdAt", ">=", Timestamp.fromDate(startWeek)));
        const snapWeek = await getDocs(qWeek);
        const totalWeek = snapWeek.docs.reduce((acc, doc) => acc + (doc.data().total || 0), 0);

        // Month
        const qMonth = query(salesRef, where("createdAt", ">=", Timestamp.fromDate(startMonth)));
        const snapMonth = await getDocs(qMonth);
        const totalMonth = snapMonth.docs.reduce((acc, doc) => acc + (doc.data().total || 0), 0);

        setStats({ today: totalToday, week: totalWeek, month: totalMonth });

        // Low stock
        const productsRef = collection(db, "products");
        const qLowStock = query(productsRef, where("quantity", "<", 5), limit(5));
        const snapLowStock = await getDocs(qLowStock);
        setLowStock(snapLowStock.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // Top products (Mocking for now as complex aggregation needs cloud functions or client-side processing)
        // I'll just pull all products and sort by some theoretical 'soldCount' or just show 5 products for UI purposes
        const snapTop = await getDocs(query(productsRef, limit(5)));
        setTopProducts(snapTop.docs.map((doc, idx) => ({ 
          name: doc.data().name, 
          value: Math.floor(Math.random() * 50) + 10 // Mock value for demo
        })));

        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const kpis = [
    { title: "Vendas Hoje", value: stats.today, icon: DollarSign, color: "border-blue-500" },
    { title: "Vendas Semana", value: stats.week, icon: Calendar, color: "border-[#1E88E5]" },
    { title: "Vendas Mês", value: stats.month, icon: TrendingUp, color: "border-[#1565C0]" },
  ];

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-bold text-text-main">Dashboard Principal</h2>
          <p className="text-sm text-gray-500">Acompanhamento de métricas em tempo real</p>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {kpis.map((kpi, idx) => (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={cn(
              "bg-white p-5 rounded-xl shadow-card border-l-4 flex items-center justify-between",
              kpi.color
            )}
          >
            <div>
              <p className="text-xs uppercase text-gray-500 font-bold mb-1">{kpi.title}</p>
              <div className="flex items-end gap-2">
                <h3 className="text-2xl font-bold text-text-main">{formatCurrency(kpi.value)}</h3>
                {idx < 2 ? (
                  <span className="text-green-500 text-xs font-bold pb-1">+12%</span>
                ) : (
                  <span className="text-red-400 text-xs font-bold pb-1">-2%</span>
                )}
              </div>
            </div>
            <kpi.icon size={24} className="text-gray-200" />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products Chart */}
        <div className="bg-white p-6 rounded-xl shadow-card border border-gray-100 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-bold text-gray-800 flex items-center gap-2">
              <Package size={20} className="text-primary" />
              Produtos Mais Vendidos
            </h4>
            <button className="text-primary text-xs font-bold">Ver Tudo</button>
          </div>
          <div className="h-[300px] w-full mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                 />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {topProducts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#1E88E5" : "#1565C0"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white p-6 rounded-xl shadow-card border border-gray-100 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-bold text-gray-800 flex items-center gap-2">
              <AlertTriangle size={20} className="text-danger" />
              Alerta de Estoque Baixo
            </h4>
            <button className="text-danger text-xs font-bold">Ver Alertas</button>
          </div>
          <div className="space-y-4 overflow-hidden">
            {lowStock.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Package size={48} className="mx-auto mb-2 opacity-20" />
                <p>Nenhum alerta crítico</p>
              </div>
            ) : (
              lowStock.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100 transition-colors hover:bg-red-100/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center font-bold text-red-600 shadow-sm border border-red-50">
                      {String(item.quantity).padStart(2, '0')}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-900">{item.name}</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">Cód: {item.code}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-red-100 text-red-600 text-[10px] font-bold rounded-full">BAIXO ESTOQUE</span>
                    <button className="text-red-400 hover:text-red-600 p-1 rounded-lg transition-colors">
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="mt-auto pt-6 bg-blue-50 p-4 rounded-lg border border-blue-100 mt-6">
            <p className="text-[10px] text-blue-600 font-bold uppercase mb-1 tracking-wider">Dica Pro</p>
            <p className="text-xs text-blue-800">O estoque de eletrônicos tende a esgotar mais rápido às sextas-feiras.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
