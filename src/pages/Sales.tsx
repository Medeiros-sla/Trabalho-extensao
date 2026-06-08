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
          <p className="text-sm text-text-secondary">Registre novas compras dos clientes e dê baixa automática no estoque</p>
        </div>
        <button 
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-2 px-4 py-2 bg-bg-card border border-border rounded-xl text-xs font-black text-primary hover:bg-bg-elevated transition-colors shadow-sm"
        >
          {showHistory ? <Plus size={16} /> : <History size={16} />}
          {showHistory ? "NOVA VENDA" : "HISTÓRICO"}
        </button>
      </header>

      {showHistory ? (
        <div className="bg-bg-card rounded-xl shadow-card border border-border overflow-hidden">
          <div className="p-4 border-b border-border bg-bg-base/50 flex justify-between items-center">
            <h3 className="font-bold flex items-center gap-2 text-sm text-text-main uppercase tracking-tight">
              <History size={16} className="text-primary" />
              Relatório de Transações
            </h3>
            <button 
              onClick={exportSalesToCSV}
              className="flex items-center gap-1.5 px-3 py-1 bg-primary text-white hover:bg-primary-hover rounded text-xs font-bold uppercase transition"
              title="Exportar registros de venda para planilha"
            >
              <Download size={12} /> Exportar CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-bg-base/30 text-xs uppercase text-text-muted font-bold tracking-widest border-b border-border">
                <tr>
                  <th className="px-6 py-4">Data</th>
                  <th className="px-6 py-4">Cliente / Tutor</th>
                  <th className="px-6 py-4">Itens</th>
                  <th className="px-6 py-4">Vendedor</th>
                  <th className="px-6 py-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="text-sm text-text-secondary">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-bg-elevated/40 border-b border-border transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {sale.createdAt ? new Date(sale.createdAt.seconds * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : "Processando..."}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="font-semibold text-text-main">{sale.clientName}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-xs">{sale.items?.length || 0} itens</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-xs text-text-muted">{sale.sellerName}</p>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
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
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
              <input
                type="text"
                placeholder="Pesquisar rações, brinquedos, medicamentos..."
                className="w-full pl-14 pr-4 py-3 bg-bg-card border border-border text-text-main rounded-xl focus:ring-2 focus:ring-primary outline-none shadow-card text-sm font-medium"
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
                    className={`flex flex-col text-left bg-bg-card p-5 rounded-xl border border-border shadow-card hover:border-primary transition-all group relative text-text-main ${outOfStock ? "opacity-50 grayscale cursor-not-allowed" : ""}`}
                  >
                    <div className="flex justify-between items-start w-full gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-text-main truncate group-hover:text-primary transition-colors text-sm">{p.name}</h4>
                        <p className="text-xs text-text-muted uppercase font-black tracking-widest">{p.category}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-black text-amber-600">{formatCurrency(p.salePrice)}</p>
                        <p className={`text-xs font-black uppercase ${p.stock < 5 ? (p.stock === 0 ? "text-red-500" : "text-amber-500") : "text-green-500"}`}>
                           {outOfStock ? "Esgotado" : `${p.stock} Unid.`}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 w-full flex justify-end opacity-0 group-hover:opacity-100 transition-all translate-y-1 group-hover:translate-y-0">
                      <div className="bg-primary text-white px-3 py-1 rounded-lg text-xs font-black uppercase flex items-center gap-1 shadow-sm">
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
            <div className="bg-bg-card rounded-xl shadow-2xl border border-border overflow-hidden text-text-main">
              <div className="bg-amber-600 p-4 text-white flex items-center gap-2">
                <ShoppingCart size={18} />
                <h3 className="font-bold text-xs tracking-tight uppercase">Resumo da Compra</h3>
              </div>

              <div className="p-6 space-y-6">
                {/* Tutor Selection */}
                <div className="space-y-1.5">
                   <div className="flex justify-between items-center">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-text-muted">Tutor Responsável</label>
                  </div>
                  <select 
                    className="w-full px-4 py-2 bg-bg-base border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary text-xs font-semibold text-text-main"
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
                    <div className="text-center py-8 text-text-muted bg-bg-base/35 border border-dashed border-border rounded-xl p-4">
                      <ShoppingCart size={36} className="mx-auto mb-2 opacity-20" />
                      <p className="text-xs uppercase font-bold tracking-widest text-text-muted">Selecione produtos à esquerda</p>
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                        <div className="flex-1 min-w-0">
                          <h5 className="text-xs font-bold text-text-main truncate">{item.name}</h5>
                          <p className="text-xs text-amber-600 font-bold">{formatCurrency(item.price)}</p>
                        </div>
                        <div className="flex items-center gap-1 bg-bg-base rounded p-1 border border-border">
                          <button 
                            onClick={() => updateCartQuantity(item.id, -1)}
                            className="w-4 h-4 flex items-center justify-center text-text-muted hover:text-text-main hover:bg-bg-elevated rounded transition-colors"
                          >
                            <Minus size={10} />
                          </button>
                          <span className="text-xs font-black min-w-[16px] text-center">{String(item.quantity).padStart(2, '0')}</span>
                          <button 
                            onClick={() => updateCartQuantity(item.id, 1)}
                            className="w-4 h-4 flex items-center justify-center text-text-muted hover:text-text-main hover:bg-bg-elevated rounded transition-colors"
                          >
                            <Plus size={10} />
                          </button>
                        </div>
                        <button 
                          onClick={() => updateCartQuantity(item.id, -999)}
                          className="text-text-muted hover:text-danger p-1 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-4 border-t border-border space-y-2 shrink-0">
                  <div className="flex justify-between text-xs font-semibold text-text-secondary">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-semibold text-text-secondary gap-3">
                    <span className="shrink-0">Desconto especial</span>
                    <div className="flex items-center gap-1 bg-bg-base border border-border rounded-xl px-2 w-28 sm:w-36 h-8 text-text-main transition-all focus-within:border-primary">
                      <span className="text-xs font-bold text-text-muted shrink-0 select-none">R$</span>
                      <input 
                        type="number"
                        className="w-full py-1 bg-transparent text-right outline-none font-black text-xs text-text-main [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        value={discount}
                        onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-border">
                    <span className="font-extrabold text-xs uppercase tracking-wider text-text-main">Total a Pagar</span>
                    <span className="text-lg font-black text-amber-600">{formatCurrency(total)}</span>
                  </div>
                </div>

                <button
                  disabled={isFinalizing || cart.length === 0}
                  onClick={handleFinalizeSale}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-white rounded-xl font-bold hover:bg-primary/95 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:grayscale uppercase text-xs tracking-widest shrink-0"
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
