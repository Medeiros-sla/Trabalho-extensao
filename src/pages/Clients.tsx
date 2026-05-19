import React, { useEffect, useState } from "react";
import { collection, onSnapshot, query, addDoc, updateDoc, deleteDoc, doc, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Users, Plus, Search, Mail, Phone, MapPin, X, History, ShoppingBag } from "lucide-react";
import { formatCurrency, OperationType, handleFirestoreError } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

export const Clients: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientSales, setClientSales] = useState<any[]>([]);
  const [formData, setFormData] = useState<Partial<Client>>({ name: "", email: "", phone: "", address: "" });

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, "clients")), (snap) => {
      setClients(snap.docs.map(d => ({ id: d.id, ...d.data() } as Client)));
    });
    return () => unsub();
  }, []);

  const handleOpenDetails = async (client: Client) => {
    setSelectedClient(client);
    const q = query(collection(db, "sales"), where("clientId", "==", client.id), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    setClientSales(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedClient && !isModalOpen) {
          // logic for update when we add edit button later
      } else {
          await addDoc(collection(db, "clients"), { ...formData, createdAt: new Date() });
      }
      setIsModalOpen(false);
      setFormData({ name: "", email: "", phone: "", address: "" });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "clients");
    }
  };

  const filtered = clients.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-text-main">Gestão de Clientes</h2>
          <p className="text-sm text-gray-500">Relacionamento e histórico completo de compras</p>
        </div>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Pesquisar cliente..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none shadow-card text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map((client) => (
          <motion.div
            layout
            key={client.id}
            onClick={() => handleOpenDetails(client)}
            className="bg-white p-6 rounded-xl shadow-card border border-gray-100 hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-blue-50 text-primary rounded-xl flex items-center justify-center font-bold text-xl border border-blue-100 shadow-sm">
                {client.name?.[0]}
              </div>
              <div className="flex-1 overflow-hidden">
                <h4 className="font-bold text-gray-900 group-hover:text-primary transition-colors truncate">{client.name}</h4>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest truncate">{client.email}</p>
              </div>
            </div>
            
            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3 text-xs text-gray-500 bg-gray-50 p-2 rounded-lg border border-gray-100">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-primary-dark">
                  <Phone size={14} />
                </div>
                <span className="font-medium">{client.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500 bg-gray-50 p-2 rounded-lg border border-gray-100">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-primary-dark">
                  <MapPin size={14} />
                </div>
                <span className="truncate font-medium">{client.address}</span>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-gray-50 flex justify-between items-center bg-gray-50/50 -mx-6 -mb-6 px-6 py-4 transition-all group-hover:bg-primary/5">
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Acessar Histórico</span>
              <History size={16} className="text-primary opacity-50 group-hover:opacity-100 transition-opacity" />
            </div>
          </motion.div>
        ))}
      </div>

       {/* FAB */}
       <button
        onClick={() => { setSelectedClient(null); setIsModalOpen(true); }}
        className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-primary-dark hover:scale-110 transition-all active:scale-95 z-30"
      >
        <Plus size={32} />
      </button>

      {/* Details/Registration Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 32 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 32 }}
              className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
            >
               <div className="sidebar-gradient p-5 text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <Users size={18} />
                  </div>
                  <h3 className="font-bold uppercase tracking-tight">
                    {selectedClient ? "Perfil do Cliente" : "Novo Cliente"}
                  </h3>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/20 p-2 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              {selectedClient ? (
                <div className="p-8 overflow-y-auto space-y-8 custom-scrollbar">
                  <div className="flex flex-col md:flex-row gap-8">
                    <div className="w-24 h-24 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center text-3xl font-bold text-primary shadow-sm shrink-0">
                      {selectedClient.name?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">{selectedClient.name}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
                        <div className="flex items-center gap-2 text-gray-500 text-xs font-medium">
                          <Mail size={14} className="text-primary-dark" /> {selectedClient.email}
                        </div>
                        <div className="flex items-center gap-2 text-gray-500 text-xs font-medium">
                          <Phone size={14} className="text-primary-dark" /> {selectedClient.phone}
                        </div>
                        <div className="flex items-center gap-2 text-gray-500 text-xs font-medium sm:col-span-2">
                          <MapPin size={14} className="text-primary-dark" /> {selectedClient.address}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                      <h4 className="font-bold text-xs uppercase tracking-widest text-gray-400 flex items-center gap-2">
                         <ShoppingBag size={14} className="text-primary" />
                         Últimas Compras
                      </h4>
                      <span className="text-[10px] font-bold text-primary bg-blue-50 px-3 py-1 rounded-full uppercase">{clientSales.length} Pedidos</span>
                    </div>
                    <div className="space-y-4">
                      {clientSales.length === 0 ? (
                        <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                          <ShoppingBag size={48} className="mx-auto mb-2 opacity-10" />
                          <p className="text-xs uppercase font-bold tracking-widest">Nenhuma compra registrada</p>
                        </div>
                      ) : (
                        clientSales.map(sale => (
                          <div key={sale.id} className="flex justify-between items-center p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                             <div>
                               <p className="font-bold text-sm text-gray-900">{new Date(sale.createdAt.seconds * 1000).toLocaleDateString('pt-BR')}</p>
                               <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{sale.items.length} itens no total</p>
                             </div>
                             <div className="text-right">
                               <p className="font-bold text-primary text-base">{formatCurrency(sale.total)}</p>
                               <button className="text-[10px] text-gray-400 font-bold uppercase hover:text-primary transition-colors">Ver Detalhes</button>
                             </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSave} className="p-8 space-y-6">
                   <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nome Completo</label>
                    <input required className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary text-sm font-medium" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">E-mail</label>
                      <input type="email" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary text-sm font-medium" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Telefone</label>
                      <input className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary text-sm font-medium" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Endereço Completo</label>
                    <textarea rows={3} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary resize-none text-sm font-medium" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                  </div>
                  <div className="pt-4">
                    <button type="submit" className="w-full py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark shadow-lg transition-all active:scale-95 uppercase text-xs tracking-widest">SALVAR CLIENTE</button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
