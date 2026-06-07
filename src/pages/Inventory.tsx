import React, { useEffect, useState } from "react";
import { collection, onSnapshot, query, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Package, Plus, Search, Edit2, Trash2, X, Camera, AlertTriangle, Download, ShoppingBag, Store } from "lucide-react";
import { formatCurrency, OperationType, handleFirestoreError } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";

interface Product {
  id: string;
  name: string;
  code: string;
  category: string;
  supplier: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  minimumStock: number;
  description?: string;
  imageUrl?: string;
  
  // Legacy aliases for backward compatibility
  price?: number;
  quantity?: number;
}

const CATEGORIES = [
  "Rações",
  "Medicamentos",
  "Brinquedos",
  "Higiene",
  "Acessórios",
  "Petiscos",
  "Comedouros",
  "Bebedouros",
  "Coleiras"
];

export const Inventory: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({
    name: "",
    code: "",
    category: "",
    supplier: "",
    costPrice: 0,
    salePrice: 0,
    stock: 0,
    minimumStock: 0,
    description: "",
    imageUrl: ""
  });

  useEffect(() => {
    const q = query(collection(db, "products"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => {
        const data = doc.data();
        // Load with safe defaults and correct fallback mappings
        return {
          id: doc.id,
          name: data.name || "",
          code: data.code || "",
          category: data.category || "",
          supplier: data.supplier || "Geral",
          costPrice: typeof data.costPrice === "number" ? data.costPrice : (data.price ? data.price * 0.6 : 0),
          salePrice: typeof data.salePrice === "number" ? data.salePrice : (data.price || 0),
          stock: typeof data.stock === "number" ? data.stock : (data.quantity || 0),
          minimumStock: typeof data.minimumStock === "number" ? data.minimumStock : 5,
          description: data.description || "",
          imageUrl: data.imageUrl || ""
        } as Product;
      });
      setProducts(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "products");
    });
    return () => unsubscribe();
  }, []);

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData(product);
    } else {
      setEditingProduct(null);
      setFormData({
        name: "",
        code: "",
        category: "",
        supplier: "",
        costPrice: 0,
        salePrice: 0,
        stock: 0,
        minimumStock: 0,
        description: "",
        imageUrl: ""
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const cost = Number(formData.costPrice || 0);
      const sale = Number(formData.salePrice || 0);
      const currentStock = Number(formData.stock || 0);
      const minStock = Number(formData.minimumStock || 0);

      const payload = {
        name: formData.name,
        code: formData.code,
        category: formData.category,
        supplier: formData.supplier || "Geral",
        costPrice: cost,
        salePrice: sale,
        stock: currentStock,
        minimumStock: minStock,
        description: formData.description || "",
        imageUrl: formData.imageUrl || "",
        
        // Unified legacy mapping compatibility fields for existing Sales rules
        price: sale,
        quantity: currentStock
      };

      if (editingProduct) {
        const docRef = doc(db, "products", editingProduct.id);
        await updateDoc(docRef, payload);
      } else {
        await addDoc(collection(db, "products"), { ...payload, createdAt: new Date() });
      }
      setIsModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "products");
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Deseja realmente excluir este produto?")) {
      try {
        await deleteDoc(doc(db, "products", id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, "products");
      }
    }
  };

  const exportToCSV = () => {
    const headers = ["Código/SKU", "Nome", "Categoria", "Fornecedor", "Preço de Custo", "Preço de Venda", "Estoque Atual", "Estoque Mínimo", "Margem Lucro R$"];
    const rows = products.map(p => [
      p.code || "",
      p.name || "",
      p.category || "",
      p.supplier || "",
      p.costPrice || 0,
      p.salePrice || 0,
      p.stock || 0,
      p.minimumStock || 0,
      (p.salePrice - p.costPrice).toFixed(2)
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(";"), ...rows.map(e => e.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(";"))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Estoque_PetShop_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "" || p.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-text-main">Controle de Estoque</h2>
          <p className="text-sm text-gray-500">Gerência de rações, medicamentos, brinquedos e acessórios com alerta de reposição</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center w-full lg:w-auto">
          <button 
            onClick={exportToCSV}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all shadow-sm font-bold text-xs uppercase tracking-wider border border-gray-200"
          >
            <Download size={14} /> EXPORTAR CSV
          </button>
          
          <select
            className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-primary shadow-sm text-gray-700"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">Todas as Categorias</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <div className="relative flex-1 sm:w-64 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
            <input
              type="text"
              placeholder="Pesquisar por nome ou SKU..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none shadow-sm text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </header>

      {/* Grid of Products */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => {
          const isLowStock = product.stock <= product.minimumStock;
          const markUp = product.salePrice - product.costPrice;

          return (
            <motion.div
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              key={product.id}
              onClick={() => handleOpenModal(product)}
              className="bg-white rounded-xl p-4 shadow-card border border-gray-100 hover:shadow-lg transition-all relative overflow-hidden group cursor-pointer"
            >
              {isLowStock && (
                <div className="absolute top-0 right-0 bg-danger text-white text-[9px] font-black px-2.5 py-1 rounded-bl-lg flex items-center gap-1 z-10 animate-pulse uppercase tracking-wider">
                  <AlertTriangle size={10} /> REPOSIÇÃO (Min: {product.minimumStock})
                </div>
              )}
              
              <div className="aspect-square bg-gray-50 rounded-lg mb-4 flex items-center justify-center text-gray-300 relative overflow-hidden shrink-0 border border-gray-50">
                {product.imageUrl ? (
                  <img referrerPolicy="no-referrer" src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                ) : (
                  <Package size={44} strokeWidth={1} className="text-amber-500 opacity-80" />
                )}
                {isLowStock && (
                  <div className="absolute inset-0 bg-red-500/5" />
                )}
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-start gap-2">
                  <h4 className="font-bold text-gray-900 truncate group-hover:text-primary transition-colors text-sm" title={product.name}>{product.name}</h4>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-extrabold text-[#F59E0B] bg-amber-50 border border-amber-150 px-2 py-0.5 rounded uppercase tracking-wider">{product.category}</span>
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest truncate max-w-[124px]">{product.code}</span>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex justify-between items-end mt-4">
                  <div>
                    <p className="text-[8px] text-gray-400 uppercase font-black tracking-wider">Preço de Venda</p>
                    <p className="text-base font-black text-amber-600">{formatCurrency(product.salePrice)}</p>
                    {product.costPrice > 0 && (
                      <p className="text-[9px] text-green-500 font-bold">Margem: {formatCurrency(markUp)}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] text-gray-400 uppercase font-black tracking-wider">Qtd</p>
                    <p className={`text-base font-black ${isLowStock ? "text-danger" : "text-gray-700"}`}>
                      {String(product.stock).padStart(2, '0')}
                    </p>
                    <p className="text-[8px] text-gray-400 italic">Fornec: {product.supplier}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-50 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                <button
                  onClick={(e) => { e.stopPropagation(); handleOpenModal(product); }}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-[9px] tracking-wider uppercase font-black"
                >
                  <Edit2 size={12} /> EDITAR
                </button>
                <button
                  onClick={(e) => handleDelete(product.id, e)}
                  className="p-1.5 text-danger hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => handleOpenModal()}
        className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-primary-dark hover:scale-110 transition-all active:scale-95 z-30"
      >
        <Plus size={32} />
      </button>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-xl rounded-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="sidebar-gradient p-5 text-white flex justify-between items-center">
                <h3 className="font-bold flex items-center gap-2 uppercase tracking-tight text-sm">
                  <Package size={18} />
                  {editingProduct ? "Editar Produto de Pet Shop" : "Novo Produto de Pet Shop"}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/20 p-1 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nome do Produto</label>
                    <input
                      required
                      type="text"
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm font-medium"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Código / SKU de Barras</label>
                    <input
                      required
                      type="text"
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm font-medium"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Categoria do Pet Shop</label>
                    <select
                      required
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm font-medium"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      <option value="">Selecione a categoria...</option>
                      {CATEGORIES.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Fornecedor / Fabricante</label>
                    <input
                      type="text"
                      placeholder="Ex: Premier Pet, Purina, Bayer..."
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm font-medium"
                      value={formData.supplier}
                      onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Preço de Custo (R$)</label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm font-medium"
                      value={formData.costPrice}
                      onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Preço de Venda (R$)</label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm font-medium"
                      value={formData.salePrice}
                      onChange={(e) => setFormData({ ...formData, salePrice: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Quantidade em Estoque</label>
                    <input
                      required
                      type="number"
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm font-medium"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Alerta de Estoque Mínimo</label>
                    <input
                      required
                      type="number"
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm font-medium"
                      value={formData.minimumStock}
                      onChange={(e) => setFormData({ ...formData, minimumStock: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Imagem Ilustrativa (URL)</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm font-medium"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Descrição detalhada</label>
                  <textarea
                    rows={2}
                    placeholder="Especificações, peso, validade, indicação por idade..."
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none resize-none text-sm font-medium"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="pt-4 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 border border-gray-200 text-gray-500 font-bold rounded-xl hover:bg-gray-50 transition-colors uppercase text-xs tracking-widest"
                  >
                    CANCELAR
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors shadow-lg uppercase text-xs tracking-widest"
                  >
                    SALVAR PRODUTO
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
