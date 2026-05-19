import React, { useEffect, useState } from "react";
import { collection, onSnapshot, query, addDoc, doc, updateDoc, writeBatch, Timestamp, orderBy, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { ShoppingCart, Search, Plus, Minus, Trash2, UserPlus, CheckCircle2, History, Filter } from "lucide-react";
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
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubClients = onSnapshot(query(collection(db, "clients")), (snap) => {
      setClients(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubSales = onSnapshot(query(collection(db, "sales"), orderBy("createdAt", "desc")), (snap) => {
      setSales(snap.docs.map(d => ({ id: d.id, ...d.data() })));
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
        if (existing.quantity >= product.quantity) return prev; // Limit to stock
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { id: product.id, name: product.name, price: product.price, quantity: 1, stock: product.quantity }];
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
  const total = subtotal - discount;

  const handleFinalizeSale = async () => {
    if (!selectedClientId) return alert("Selecione um cliente");
    if (cart.length === 0) return alert("Carrinho vazio");

    setIsFinalizing(true);
    try {
      const batch = writeBatch(db);
      
      const client = clients.find(c => c.id === selectedClientId);
      const saleData = {
        clientId: selectedClientId,
        clientName: client?.name || "Desconhecido",
        items: cart,
        subtotal,
        discount,
        total,
        createdAt: serverTimestamp(),
        sellerId: user?.uid,
        sellerName: profile?.name || user?.email,
      };

      // Add sale record
      const saleRef = doc(collection(db, "sales"));
      batch.set(saleRef, saleData);

      // Update product quantities
      cart.forEach(item => {
        const productRef = doc(db, "products", item.id);
        batch.update(productRef, {
          quantity: item.stock - item.quantity
        });
      });

      await batch.commit();
      setCart([]);
      setSelectedClientId("");
      setDiscount(0);
      alert("Venda realizada com sucesso!");
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "sales");
    } finally {
      setIsFinalizing(false);
    }
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-text-main">Gestão de Vendas</h2>
          <p className="text-sm text-gray-500">Registre novas operações e consulte o histórico</p>
        </div>
        <button 
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors shadow-card"
        >
          {showHistory ? <Plus size={16} /> : <History size={16} />}
          {showHistory ? "NOVA VENDA" : "HISTÓRICO"}
        </button>
      </header>

      {showHistory ? (
        <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
            <h3 className="font-bold flex items-center gap-2 text-sm text-gray-700">
              <History size={16} className="text-primary" />
              Últimas Vendas
            </h3>
            <button className="p-2 text-gray-400 hover:text-gray-600">
              <Filter size={16} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50/50 text-[10px] uppercase text-gray-400 font-bold tracking-widest">
                <tr>
                  <th className="px-6 py-4 border-b">Data</th>
                  <th className="px-6 py-4 border-b">Cliente</th>
                  <th className="px-6 py-4 border-b">Itens</th>
                  <th className="px-6 py-4 border-b">Vendedor</th>
                  <th className="px-6 py-4 border-b text-right">Total</th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-600">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 border-b whitespace-nowrap">
                      {sale.createdAt?.toDate().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4 border-b whitespace-nowrap">
                      <p className="font-semibold text-gray-900">{sale.clientName}</p>
                    </td>
                    <td className="px-6 py-4 border-b whitespace-nowrap">
                      <p className="text-xs">{sale.items?.length} itens</p>
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
                placeholder="Pesquisar produto..."
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none shadow-card text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredProducts.map((p) => (
                <button
                  key={p.id}
                  disabled={p.quantity === 0}
                  onClick={() => addToCart(p)}
                  className={`flex flex-col text-left bg-white p-5 rounded-xl border border-gray-100 shadow-card hover:border-primary transition-all group ${p.quantity === 0 ? "opacity-50 grayscale cursor-not-allowed" : ""}`}
                >
                  <div className="flex justify-between items-start w-full gap-4">
                    <div className="flex-1 overflow-hidden">
                      <h4 className="font-bold text-gray-900 truncate group-hover:text-primary transition-colors">{p.name}</h4>
                      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Cód: {p.code}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-primary">{formatCurrency(p.price)}</p>
                      <p className={`text-[10px] font-bold ${p.quantity < 5 ? "text-danger" : "text-green-500"} uppercase`}>
                         {p.quantity} unid.
                      </p>
                    </div>
                  </div>
                  <div className="mt-6 w-full flex justify-end opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                    <div className="bg-primary text-white px-4 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-sm">
                      <Plus size={14} /> ADICIONAR
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Cart / Checkout */}
          <div className="lg:col-span-4 sticky top-8">
            <div className="bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden">
              <div className="sidebar-gradient p-4 text-white flex items-center gap-2">
                <ShoppingCart size={18} />
                <h3 className="font-bold text-sm tracking-tight uppercase">Resumo da Venda</h3>
              </div>

              <div className="p-6 space-y-6">
                {/* Client Select */}
                <div className="space-y-2">
                   <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Cliente</label>
                    <button className="text-primary flex items-center gap-1 text-[10px] font-bold hover:underline">
                      <UserPlus size={12} /> NOVO
                    </button>
                  </div>
                  <select 
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary text-sm font-medium"
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                  >
                    <option value="">Selecione o cliente...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                {/* Cart Items */}
                <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                  {cart.length === 0 ? (
                    <div className="text-center py-12 text-gray-300">
                      <ShoppingCart size={40} className="mx-auto mb-2 opacity-10" />
                      <p className="text-[10px] uppercase font-bold tracking-widest">Carrinho vazio</p>
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 group">
                        <div className="flex-1 min-w-0">
                          <h5 className="text-xs font-bold text-gray-900 truncate">{item.name}</h5>
                          <p className="text-[10px] text-primary font-bold">{formatCurrency(item.price)}</p>
                        </div>
                        <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg p-1 border border-gray-100">
                          <button 
                            onClick={() => updateCartQuantity(item.id, -1)}
                            className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="text-[10px] font-bold min-w-[20px] text-center">{String(item.quantity).padStart(2, '0')}</span>
                          <button 
                            onClick={() => updateCartQuantity(item.id, 1)}
                            className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        <button 
                          onClick={() => updateCartQuantity(item.id, -999)}
                          className="text-gray-300 hover:text-danger p-1 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-6 border-t border-gray-100 space-y-2">
                  <div className="flex justify-between text-xs font-medium text-gray-500">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-medium text-gray-500">
                    <label>Desconto</label>
                    <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded px-2">
                      <span className="text-[10px]">R$</span>
                      <input 
                        type="number"
                        className="w-16 py-1 bg-transparent text-right outline-none font-bold"
                        value={discount}
                        onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between pt-4">
                    <span className="font-bold text-gray-900">Total Geral</span>
                    <span className="text-xl font-bold text-primary">{formatCurrency(total)}</span>
                  </div>
                </div>

                <button
                  disabled={isFinalizing || cart.length === 0}
                  onClick={handleFinalizeSale}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:grayscale uppercase text-xs tracking-widest"
                >
                  {isFinalizing ? "PROCESSANDO..." : "FINALIZAR VENDA"}
                  <CheckCircle2 size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
