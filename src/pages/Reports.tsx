import React, { useEffect, useState } from "react";
import { collection, query, getDocs, orderBy, Timestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { FileDown, Filter, Calendar, BarChart3, PieChartIcon, TrendingUp } from "lucide-react";
import { formatCurrency } from "../lib/utils";
import { startOfMonth, endOfMonth, eachDayOfInterval, format, startOfToday, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export const Reports: React.FC = () => {
  const [salesData, setSalesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSales = async () => {
      const q = query(collection(db, "sales"), orderBy("createdAt", "asc"));
      const snap = await getDocs(q);
      setSalesData(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    };
    fetchSales();
  }, []);

  // Process data for charts
  const salesByProduct = salesData.reduce((acc: any, sale) => {
    sale.items.forEach((item: any) => {
      acc[item.name] = (acc[item.name] || 0) + item.quantity;
    });
    return acc;
  }, {});

  const barData = Object.keys(salesByProduct).map(name => ({ name, value: salesByProduct[name] })).sort((a, b) => b.value - a.value).slice(0, 5);

  const salesByDate = salesData.reduce((acc: any, sale) => {
    const date = format(sale.createdAt.toDate(), "dd/MM");
    acc[date] = (acc[date] || 0) + sale.total;
    return acc;
  }, {});

  const lineData = Object.keys(salesByDate).map(date => ({ date, total: salesByDate[date] }));

  const COLORS = ["#1E88E5", "#1565C0", "#42A5F5", "#64B5F6", "#90CAF9"];

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Relatório de Vendas - VendasPro", 14, 15);
    
    const tableData = salesData.map(sale => [
      format(sale.createdAt.toDate(), "dd/MM/yyyy HH:mm"),
      sale.clientName,
      sale.items.length,
      formatCurrency(sale.total)
    ]);

    autoTable(doc, {
      head: [["Data", "Cliente", "Itens", "Total"]],
      body: tableData,
      startY: 25,
    });

    doc.save("relatorio_vendas.pdf");
  };

  return (    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-text-main">Relatórios & Inteligência</h2>
          <p className="text-sm text-gray-500">Analise detalhadamente o desempenho e tendências do seu negócio</p>
        </div>
        <div className="flex gap-3">
           <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:bg-gray-50 transition-colors shadow-card">
            <Filter size={14} /> FILTRAR
          </button>
          <button 
            onClick={exportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-all shadow-lg active:scale-95 text-[10px] uppercase tracking-widest"
          >
            <FileDown size={14} /> EXPORTAR PDF
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Period */}
        <div className="bg-white p-6 rounded-xl shadow-card border border-gray-100">
           <div className="flex justify-between items-center mb-8">
            <h4 className="font-bold text-gray-800 flex items-center gap-2">
              <TrendingUp size={20} className="text-primary" />
              Evolução Diária
            </h4>
            <span className="text-[10px] font-bold text-green-500 bg-green-50 px-2 py-1 rounded-full uppercase tracking-tighter">+8.2% vs ontem</span>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} tickFormatter={(v) => `R$ ${v}`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="total" stroke="#1E88E5" strokeWidth={4} dot={{r: 4, fill: "#fff", stroke: "#1E88E5", strokeWidth: 2}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Most Sold Products */}
        <div className="bg-white p-6 rounded-xl shadow-card border border-gray-100">
           <div className="flex justify-between items-center mb-8">
            <h4 className="font-bold text-gray-800 flex items-center gap-2">
              <BarChart3 size={20} className="text-primary-dark" />
              Top 5 Produtos
            </h4>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest cursor-pointer hover:text-primary transition-colors">VER DETALHES</span>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} width={100} />
                <Tooltip 
                  cursor={{fill: 'transparent'}} 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

         {/* Sales by Category (Mocked as categories are hard) */}
         <div className="bg-white p-6 rounded-xl shadow-card border border-gray-100 lg:col-span-2">
            <div className="flex justify-between items-center mb-8">
              <h4 className="font-bold text-gray-800 flex items-center gap-2">
                <PieChartIcon size={20} className="text-primary" />
                Distribuição de Receita por Categoria
              </h4>
              <button className="text-[10px] font-bold text-primary flex items-center gap-1 uppercase tracking-widest">Ajustar Metas <TrendingUp size={10} /></button>
            </div>
          <div className="flex flex-col md:flex-row items-center justify-around gap-8">
            <div className="relative">
              <ResponsiveContainer width={240} height={240}>
                 <PieChart>
                  <Pie
                    data={[
                      { name: "Eletrônicos", value: 400 },
                      { name: "Roupas", value: 300 },
                      { name: "Alimentos", value: 300 },
                      { name: "Outros", value: 200 },
                    ]}
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                     {COLORS.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-gray-700">R$ 12k</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Mês</span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6">
               {[
                  { name: "Eletrônicos", value: "35%", color: "bg-[#1E88E5]" },
                  { name: "Roupas", value: "25%", color: "bg-[#1565C0]" },
                  { name: "Alimentos", value: "25%", color: "bg-[#42A5F5]" },
                  { name: "Outros", value: "15%", color: "bg-[#64B5F6]" },
               ].map(item => (
                 <div key={item.name} className="flex items-center gap-4 group">
                    <div className={`w-3 h-3 rounded-full transition-transform group-hover:scale-125 ${item.color}`} />
                    <div className="min-w-[120px]">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.name}</p>
                      <p className="text-lg font-bold text-gray-700">{item.value}</p>
                    </div>
                 </div>
               ))}
            </div>
          </div>
         </div>
      </div>
    </div>
  );
};
