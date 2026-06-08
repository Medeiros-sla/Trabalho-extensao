import React, { useEffect, useState } from "react";
import { collection, query, getDocs, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { FileDown, Filter, Calendar, BarChart3, PieChartIcon, TrendingUp, Package, Percent } from "lucide-react";
import { formatCurrency, OperationType, handleFirestoreError } from "../lib/utils";
import { format } from "date-fns";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface Sale {
  id: string;
  clientId: string;
  clientName: string;
  items: {
    id: string;
    name: string;
    price: number;
    quantity: number;
  }[];
  subtotal: number;
  discount: number;
  total: number;
  createdAt?: any;
}

interface Product {
  id: string;
  name: string;
  category: string;
}

export const Reports: React.FC = () => {
  const [salesData, setSalesData] = useState<Sale[]>([]);
  const [productsData, setProductsData] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReportsData = async () => {
      try {
        const prodSnap = await getDocs(collection(db, "products"));
        const prods = prodSnap.docs.map(d => ({
          id: d.id,
          name: d.data().name || "",
          category: d.data().category || "Outros"
        } as Product));
        setProductsData(prods);

        const salesSnap = await getDocs(query(collection(db, "sales"), orderBy("createdAt", "asc")));
        const sales = salesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Sale));
        setSalesData(sales);
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, "reports");
      } finally {
        setLoading(false);
      }
    };
    fetchReportsData();
  }, []);

  const getSaleDate = (sale: Sale) => {
    if (sale.createdAt && typeof sale.createdAt.toDate === "function") {
      return sale.createdAt.toDate();
    }
    if (sale.createdAt && sale.createdAt.seconds) {
      return new Date(sale.createdAt.seconds * 1000);
    }
    return new Date();
  };

  // CHART 1: BEST SELLING PRODUCTS (Produtos mais vendidos) - calculated dynamically!
  const productQuantities: { [key: string]: number } = {};
  salesData.forEach((sale) => {
    if (sale.items && Array.isArray(sale.items)) {
      sale.items.forEach((item) => {
        productQuantities[item.name] = (productQuantities[item.name] || 0) + item.quantity;
      });
    }
  });

  const bestSellingProductsData = Object.keys(productQuantities)
    .map((name) => ({ name, quantidade: productQuantities[name] }))
    .sort((a, b) => b.quantidade - a.quantidade)
    .slice(0, 5);

  // CHART 2: REVENUE BY MONTH (Faturamento por mês) - calculated dynamically!
  const monthlyRevenueMap: { [key: string]: number } = {};
  salesData.forEach((sale) => {
    const d = getSaleDate(sale);
    // Format Month/Year (e.g. "04/2026")
    const monthKey = format(d, "MM/yyyy");
    monthlyRevenueMap[monthKey] = (monthlyRevenueMap[monthKey] || 0) + sale.total;
  });

  const monthlyRevenueData = Object.keys(monthlyRevenueMap).map((month) => ({
    mes: month,
    faturamento: monthlyRevenueMap[month]
  })).slice(-6); // Last 6 months

  // CHART 3: SALES BY CATEGORY (Vendas por categoria) - calculated dynamically using product category mappings!
  const productToCategoryMap = productsData.reduce((acc, p) => {
    acc[p.id] = p.category;
    return acc;
  }, {} as { [id: string]: string });

  const categoryRevenueMap: { [key: string]: number } = {};
  salesData.forEach((sale) => {
    if (sale.items && Array.isArray(sale.items)) {
      sale.items.forEach((item) => {
        // Map item to category or product name lookup fallback
        const cat = productToCategoryMap[item.id] || "Acessórios";
        categoryRevenueMap[cat] = (categoryRevenueMap[cat] || 0) + (item.price * item.quantity);
      });
    }
  });

  const categoryRevenueTotals = Object.keys(categoryRevenueMap).map((catName) => ({
    name: catName,
    value: Math.round(categoryRevenueMap[catName])
  })).sort((a, b) => b.value - a.value);

  // CHART 4: DAILY REVENUE EVOLUTION (Evolução de vendas por período) - calculated dynamically!
  const dailyTurnoverMap: { [key: string]: number } = {};
  salesData.forEach((sale) => {
    const d = getSaleDate(sale);
    const dateStr = format(d, "dd/MM");
    dailyTurnoverMap[dateStr] = (dailyTurnoverMap[dateStr] || 0) + sale.total;
  });

  const dailyEvolutionData = Object.keys(dailyTurnoverMap).map((date) => ({
    data: date,
    faturamento: dailyTurnoverMap[date]
  })).slice(-15); // Long rolling 15 days window

  const CHART_COLORS = ["#D97706", "#F59E0B", "#FBBF24", "#EF4444", "#3B82F6", "#10B981", "#8B5CF6", "#EC4899", "#6B7280"];

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(217, 119, 6); // Autumn Amber Pet Shop Color
    doc.text("Relatorio Gerencial de Vendas", 14, 18);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(110, 110, 110);
    doc.text(`Pet Shop Management System - Emitido em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 25);
    doc.line(14, 28, 196, 28);

    let finalTotal = 0;
    const tableData = salesData.map((sale) => {
      finalTotal += sale.total;
      return [
        format(getSaleDate(sale), "dd/MM/yyyy HH:mm"),
        sale.clientName,
        sale.items?.reduce((ttl, i) => ttl + i.quantity, 0) || 0,
        `R$ ${(sale.discount || 0).toFixed(2)}`,
        `R$ ${(sale.total || 0).toFixed(2)}`
      ];
    });

    autoTable(doc, {
      head: [["Data/Hora", "Cliente / Tutor", "Qtd Itens", "Desconto", "Total Venda"]],
      body: tableData,
      startY: 32,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [217, 119, 6] } as any,
      foot: [["", "Totais Consolidados", "", "", `R$ ${finalTotal.toFixed(2)}`]],
      footStyles: { fillColor: [243, 244, 246], textColor: [0, 0, 0], fontStyle: "bold" } as any,
    });

    doc.save(`relatorio_financeiro_petshop_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-24">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const overallTotalRevenue = salesData.reduce((acc, curr) => acc + curr.total, 0);

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-text-main">Relatórios & Inteligência</h2>
          <p className="text-sm text-text-secondary font-medium font-sans">Desempenho e comportamento do estoque do Pet Shop por período</p>
        </div>
        <div className="flex gap-3 shrink-0">
          <button 
            onClick={exportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 transition-all shadow-lg active:scale-95 text-xs uppercase tracking-wider"
          >
            <FileDown size={14} /> EXPORTAR PDF
          </button>
        </div>
      </header>

      {/* Graphs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CHART 1: Evolução de vendas por período (Evolution over period) */}
        <div className="bg-bg-card p-6 rounded-xl shadow-card border border-border flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-bold text-text-main flex items-center gap-2 text-sm uppercase tracking-tight">
              <TrendingUp size={18} className="text-amber-600" />
              Evolução Diária do Faturamento (15 Dias)
            </h4>
          </div>
          <div className="h-[280px]">
            {dailyEvolutionData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-text-muted">Nenhum dado diário consolidado</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyEvolutionData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.5} />
                  <XAxis dataKey="data" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: 'var(--color-text-secondary)', fontWeight: 'bold'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: 'var(--color-text-secondary)', fontWeight: 'bold'}} tickFormatter={(v) => `R$ ${v}`} />
                  <Tooltip contentStyle={{ 
                    borderRadius: '12px', 
                    border: '1px solid var(--color-border)', 
                    backgroundColor: 'var(--color-bg-card)', 
                    color: 'var(--color-text-main)',
                    boxShadow: 'var(--shadow-md)', 
                    fontSize: '12px', 
                    fontWeight: 'bold' 
                  }} />
                  <Line type="monotone" dataKey="faturamento" stroke="#D97706" strokeWidth={3} dot={{r: 4, fill: "#fff", stroke: "#D97706", strokeWidth: 2}} activeDot={{r: 6}} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* CHART 2: Produtos mais vendidos (Best selling products) */}
        <div className="bg-bg-card p-6 rounded-xl shadow-card border border-border flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-bold text-text-main flex items-center gap-2 text-sm uppercase tracking-tight">
              <BarChart3 size={18} className="text-amber-600" />
              Produtos Mais Vendidos (Volume Unid.)
            </h4>
          </div>
          <div className="h-[280px]">
            {bestSellingProductsData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-text-muted">Nenhum produto vendido em estoque</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bestSellingProductsData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" opacity={0.5} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: 'var(--color-text-secondary)', fontWeight: 'bold'}} width={90} />
                  <Tooltip contentStyle={{ 
                    borderRadius: '12px', 
                    border: '1px solid var(--color-border)', 
                    backgroundColor: 'var(--color-bg-card)', 
                    color: 'var(--color-text-main)',
                    boxShadow: 'var(--shadow-md)', 
                    fontSize: '11px', 
                    fontWeight: 'bold' 
                  }} />
                  <Bar dataKey="quantidade" radius={[0, 4, 4, 0]}>
                    {bestSellingProductsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* CHART 3: Faturamento por mês */}
        <div className="bg-bg-card p-6 rounded-xl shadow-card border border-border flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-bold text-text-main flex items-center gap-2 text-sm uppercase tracking-tight">
              <Calendar size={18} className="text-amber-600" />
              Histórico de Faturamento por Mês
            </h4>
          </div>
          <div className="h-[280px]">
            {monthlyRevenueData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-text-muted">Sem histórico mensal de vendas</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.5} />
                  <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: 'var(--color-text-secondary)', fontWeight: 'bold'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: 'var(--color-text-secondary)', fontWeight: 'bold'}} tickFormatter={(v) => `R$${v}`} />
                  <Tooltip contentStyle={{ 
                    borderRadius: '12px', 
                    border: '1px solid var(--color-border)', 
                    backgroundColor: 'var(--color-bg-card)', 
                    color: 'var(--color-text-main)',
                    boxShadow: 'var(--shadow-md)', 
                    fontSize: '11px', 
                    fontWeight: 'bold' 
                  }} />
                  <Bar dataKey="faturamento" radius={[4, 4, 0, 0]} fill="#D97706">
                    {monthlyRevenueData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* CHART 4: Distribuição por Categoria de Pet Shop */}
        <div className="bg-bg-card p-6 rounded-xl shadow-card border border-border flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-bold text-text-main flex items-center gap-2 text-sm uppercase tracking-tight">
              <PieChartIcon size={18} className="text-amber-600" />
              Distribuição por Categoria de Pet Shop
            </h4>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 h-[280px]">
            {categoryRevenueTotals.length === 0 ? (
              <div className="text-center text-text-muted">Nenhuma categoria registrada com saídas</div>
            ) : (
              <>
                <div className="relative shrink-0">
                  <ResponsiveContainer width={180} height={180}>
                     <PieChart>
                      <Pie
                        data={categoryRevenueTotals}
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                         {categoryRevenueTotals.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                         ))}
                      </Pie>
                      <Tooltip 
                        formatter={(v) => `R$ ${v}`} 
                        contentStyle={{ 
                          borderRadius: '12px', 
                          border: '1px solid var(--color-border)', 
                          backgroundColor: 'var(--color-bg-card)', 
                          color: 'var(--color-text-main)',
                          fontSize: '11px', 
                          fontWeight: 'bold' 
                        }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-lg font-black text-text-main">{formatCurrency(overallTotalRevenue)}</span>
                    <span className="text-xs font-black text-text-muted uppercase tracking-widest text-[10px]">Total Geral</span>
                  </div>
                </div>

                <div className="flex-1 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar space-y-3">
                  {categoryRevenueTotals.slice(0, 5).map((item, index) => {
                    const percentageValue = overallTotalRevenue > 0 ? `${Math.round((item.value / overallTotalRevenue) * 100)}%` : "0%";
                    return (
                      <div key={item.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                          <span className="font-medium text-text-secondary truncate max-w-[120px]">{item.name}</span>
                        </div>
                        <div className="text-right shrink-0 pl-2">
                          <span className="font-black text-text-main">{formatCurrency(item.value)}</span>
                          <span className="text-xs font-bold text-text-muted ml-1.5">({percentageValue})</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
