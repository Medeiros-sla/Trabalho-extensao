import React, { useEffect, useState } from "react";
import { collection, onSnapshot, query, addDoc, doc, writeBatch, orderBy, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { ShoppingCart, Search, Plus, Minus, Trash2, UserPlus, CheckCircle2, History, Filter, Download } from "lucide-react";
import { formatCurrency, OperationType, handleFirestoreError } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
}

export const Sales: React.FC = () => {
  const { user, profile } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [discount, setDiscount] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  useEffect(() => {
    const unsubProducts = onSnapshot(query(collection(db, "products")), (snap) => {
      setProducts(snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name || "",
          code: data.code || "",
          category: data.category || "",
          // Fetch from standard or custom fields safely
          salePrice: typeof data.salePrice === "number" ? data.salePrice : (data.price || 0),
          stock: typeof data.stock === "number" ? data.stock : (data.quantity || 0),
          price: typeof data.salePrice === "number" ? data.salePrice : (data.price || 0),
          quantity: typeof data.stock === "number" ? data.stock : (data.quantity || 0)
        };
      }));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "products");
    });

    const unsubClients = onSnapshot(query(collection(db, "clients")), (snap) => {
      setClients(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "clients");
    });

    const unsubSales = onSnapshot(query(collection(db, "sales"), orderBy("createdAt", "desc")), (snap) => {
      setSales(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "sales");
    });

    return () => {
      unsubProducts();
      unsubClients();
      unsubSales();
    };
  }, []);

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev; // Limit to stock
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { id: product.id, name: product.name, price: product.salePrice, quantity: 1, stock: product.stock }];
    });
  };

  const updateCartQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, Math.min(item.quantity + delta, item.stock));
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const total = Math.max(0, subtotal - discount);

  const handleFinalizeSale = async () => {
    if (!selectedClientId) return alert("Por favor, selecione um tutor de pet.");
    if (cart.length === 0) return alert("Seu carrinho de compras está vazio.");

    setIsFinalizing(true);
    try {
      const batch = writeBatch(db);
      
      const client = clients.find(c => c.id === selectedClientId);
      const saleData = {
        clientId: selectedClientId,
        clientName: client?.name || "Desconhecido",
        items: cart.map(i => ({
          id: i.id,
          name: i.name,
          price: i.price,
          quantity: i.quantity
        })),
        subtotal,
        discount,
        total,
        createdAt: serverTimestamp(),
        sellerId: user?.uid,
        sellerName: profile?.name || user?.email || "Vendedor",
      };

      // Add sale record
      const saleRef = doc(collection(db, "sales"));
      batch.set(saleRef, saleData);

      // Decrement product levels under both stock and quantity properties!
      cart.forEach(item => {
        const productRef = doc(db, "products", item.id);
        const newLevel = Math.max(0, item.stock - item.quantity);
        batch.update(productRef, {
          quantity: newLevel,
          stock: newLevel
        });
      });

      await batch.commit();
      setCart([]);
      setSelectedClientId("");
      setDiscount(0);
      alert("Operação de venda concluída!");
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "sales");
    } finally {
      setIsFinalizing(false);
    }
  };

  const exportSalesToCSV = () => {
    const headers = ["Data", "Cliente/Tutor", "Vendedor", "Qtd Itens", "Desconto", "Total"];
    const rows = sales.map(s => {
      const dateStr = s.createdAt ? new Date(s.createdAt.seconds * 1000).toLocaleDateString('pt-BR') : "Sem data";
      return [
        dateStr,
        s.clientName || "Geral",
        s.sellerName || "Vendedor",
        s.items?.reduce((ttl: number, i: any) => ttl + i.quantity, 0) || 0,
        s.discount || 0,
        s.total || 0
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(";"), ...rows.map(e => e.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(";"))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Vendas_PetShop_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-text-main">Venda de Balcão</h2>
          <p className="text-sm text-gray-500">Registre novas compras dos clientes e dê baixa automática no estoque</p>
        </div>
        <button 
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-black text-amber-700 hover:bg-gray-50 transition-colors shadow-sm"
        >
          {showHistory ? <Plus size={16} /> : <History size={16} />}
          {showHistory ? "NOVA VENDA" : "HISTÓRICO"}
        </button>
      </header>

      {showHistory ? (
        <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
            <h3 className="font-bold flex items-center gap-2 text-sm text-gray-700 uppercase tracking-tight">
              <History size={16} className="text-primary" />
              Relatório de Transações
            </h3>
            <button 
              onClick={exportSalesToCSV}
              className="flex items-center gap-1.5 px-3 py-1 bg-amber-500 text-white hover:bg-amber-600 rounded text-[10px] font-bold uppercase transition"
              title="Exportar registros de venda para planilha"
            >
              <Download size={12} /> Exportar CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50/50 text-[10px] uppercase text-gray-400 font-bold tracking-widest">
                <tr>
                  <th className="px-6 py-4 border-b">Data</th>
                  <th className="px-6 py-4 border-b">Cliente / Tutor</th>
                  <th className="px-6 py-4 border-b">Itens</th>
                  <th className="px-6 py-4 border-b">Vendedor</th>
                  <th className="px-6 py-4 border-b text-right">Total</th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-600">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 border-b whitespace-nowrap">
                      {sale.createdAt ? new Date(sale.createdAt.seconds * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : "Processando..."}
                    </td>
                    <td className="px-6 py-4 border-b whitespace-nowrap">
                      <p className="font-semibold text-gray-900">{sale.clientName}</p>
                    </td>
                    <td className="px-6 py-4 border-b whitespace-nowrap">
                      <p className="text-xs">{sale.items?.length || 0} itens</p>
                    </td>
                    <td className="px-6 py-4 border-b whitespace-nowrap">
                      <p className="text-xs opacity-60">{sale.sellerName}</p>
                    </td>
                    <td className="px-6 py-4 border-b text-right whitespace-nowrap">
                      <p className="font-bold text-primary">{formatCurrency(sale.total)}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Product Selection */}
          <div className="lg:col-span-8 space-y-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Pesquisar rações, brinquedos, medicamentos..."
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none shadow-card text-sm font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredProducts.map((p) => {
                const outOfStock = p.stock === 0;
                return (
                  <button
                    key={p.id}
                    disabled={outOfStock}
                    onClick={() => addToCart(p)}
                    className={`flex flex-col text-left bg-white p-5 rounded-xl border border-gray-100 shadow-card hover:border-amber-400 transition-all group relative ${outOfStock ? "opacity-50 grayscale cursor-not-allowed" : ""}`}
                  >
                    <div className="flex justify-between items-start w-full gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 truncate group-hover:text-primary transition-colors text-sm">{p.name}</h4>
                        <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">{p.category}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-black text-amber-600">{formatCurrency(p.salePrice)}</p>
                        <p className={`text-[9px] font-black uppercase ${p.stock < 5 ? (p.stock === 0 ? "text-red-500" : "text-amber-500") : "text-green-500"}`}>
                           {outOfStock ? "Esgotado" : `${p.stock} Unid.`}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 w-full flex justify-end opacity-0 group-hover:opacity-100 transition-all translate-y-1 group-hover:translate-y-0">
                      <div className="bg-primary text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase flex items-center gap-1 shadow-sm">
                        <Plus size={12} /> Selecionar
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cart Summary */}
          <div className="lg:col-span-4 sticky top-8">
            <div className="bg-white rounded-xl shadow-2xl border border-gray-150 overflow-hidden">
              <div className="sidebar-gradient p-4 text-white flex items-center gap-2">
                <ShoppingCart size={18} />
                <h3 className="font-bold text-xs tracking-tight uppercase">Resumo da Compra</h3>
              </div>

              <div className="p-6 space-y-6">
                {/* Tutor Selection */}
                <div className="space-y-1.5">
                   <div className="flex justify-between items-center">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Tutor Responsável</label>
                  </div>
                  <select 
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary text-xs font-semibold"
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                  >
                    <option value="">Selecione quem está comprando...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ""}</option>)}
                  </select>
                </div>

                {/* Cart Items list */}
                <div className="space-y-4 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                  {cart.length === 0 ? (
                    <div className="text-center py-8 text-gray-300">
                      <ShoppingCart size={36} className="mx-auto mb-2 opacity-10" />
                      <p className="text-[9px] uppercase font-bold tracking-widest">Selecione produtos à esquerda</p>
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                        <div className="flex-1 min-w-0">
                          <h5 className="text-xs font-bold text-gray-900 truncate">{item.name}</h5>
                          <p className="text-[10px] text-amber-600 font-bold">{formatCurrency(item.price)}</p>
                        </div>
                        <div className="flex items-center gap-1 bg-gray-50 rounded p-1 border border-gray-150">
                          <button 
                            onClick={() => updateCartQuantity(item.id, -1)}
                            className="w-4 h-4 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors"
                          >
                            <Minus size={10} />
                          </button>
                          <span className="text-[10px] font-black min-w-[16px] text-center">{String(item.quantity).padStart(2, '0')}</span>
                          <button 
                            onClick={() => updateCartQuantity(item.id, 1)}
                            className="w-4 h-4 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors"
                          >
                            <Plus size={10} />
                          </button>
                        </div>
                        <button 
                          onClick={() => updateCartQuantity(item.id, -999)}
                          className="text-gray-300 hover:text-danger p-1 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-4 border-t border-gray-100 space-y-2 shrink-0">
                  <div className="flex justify-between text-xs font-semibold text-gray-500">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-semibold text-gray-500">
                    <label>Desconto especial</label>
                    <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded px-2">
                      <span className="text-[10px] font-bold">R$</span>
                      <input 
                        type="number"
                        className="w-14 py-1 bg-transparent text-right outline-none font-black text-xs"
                        value={discount}
                        onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-gray-50">
                    <span className="font-extrabold text-xs uppercase tracking-wider text-gray-900">Total a Pagar</span>
                    <span className="text-lg font-black text-amber-600">{formatCurrency(total)}</span>
                  </div>
                </div>

                <button
                  disabled={isFinalizing || cart.length === 0}
                  onClick={handleFinalizeSale}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:grayscale uppercase text-xs tracking-widest shrink-0"
                >
                  {isFinalizing ? "Processando..." : "Emitir Venda"}
                  <CheckCircle2 size={15} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
