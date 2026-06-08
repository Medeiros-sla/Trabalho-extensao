import React, { useEffect, useState } from "react";
import { collection, onSnapshot, query, addDoc, updateDoc, doc, getDocs, where, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Users, Plus, Search, Phone, MapPin, X, History, ShoppingBag, Download, Edit, Trash2, Heart, PawPrint, MessageSquare, ClipboardList } from "lucide-react";
import { formatCurrency, OperationType, handleFirestoreError } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";

interface Pet {
  name: string;
  species: string;
  breed: string;
  birthDate: string;
  notes?: string;
}

interface Client {
  id: string;
  name: string;
  phone: string;
  whatsapp: string;
  cpf?: string;
  address: string;
  notes?: string;
  pets?: Pet[];
}

export const Clients: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientSales, setClientSales] = useState<any[]>([]);
  const [formData, setFormData] = useState<Partial<Client>>({
    name: "",
    phone: "",
    whatsapp: "",
    cpf: "",
    address: "",
    notes: "",
    pets: []
  });

  // Pet nested creation inside selected client
  const [showAddPetForm, setShowAddPetForm] = useState(false);
  const [petFormData, setPetFormData] = useState<Pet>({
    name: "",
    species: "Cachorro",
    breed: "",
    birthDate: "",
    notes: ""
  });

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, "clients")), (snap) => {
      setClients(snap.docs.map(d => ({ id: d.id, ...d.data() } as Client)));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, "clients");
    });
    return () => unsub();
  }, []);

  const handleOpenDetails = async (client: Client) => {
    setSelectedClient(client);
    setIsEditMode(false);
    setShowAddPetForm(false);
    try {
      const q = query(collection(db, "sales"), where("clientId", "==", client.id), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setClientSales(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, "sales");
    }
    setIsModalOpen(true);
  };

  const handleOpenCreate = () => {
    setSelectedClient(null);
    setIsEditMode(true);
    setShowAddPetForm(false);
    setFormData({
      name: "",
      phone: "",
      whatsapp: "",
      cpf: "",
      address: "",
      notes: "",
      pets: []
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (client: Client, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedClient(client);
    setIsEditMode(true);
    setShowAddPetForm(false);
    setFormData({
      name: client.name,
      phone: client.phone,
      whatsapp: client.whatsapp,
      cpf: client.cpf || "",
      address: client.address,
      notes: client.notes || "",
      pets: client.pets || []
    });
    setIsModalOpen(true);
  };

  const formatPhone = (val: string) => {
    const clean = val.replace(/\D/g, "");
    if (clean.length <= 10) {
      return clean.replace(/^(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").trim();
    }
    return clean.substring(0, 11).replace(/^(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").trim();
  };

  const formatCPF = (val: string) => {
    const clean = val.replace(/\D/g, "");
    return clean
      .substring(0, 11)
      .replace(/^(\d{3})(\d{3})(\d{3})(\d{0,2})/, (_, p1, p2, p3, p4) => {
        let res = p1;
        if (p2) res += `.${p2}`;
        if (p3) res += `.${p3}`;
        if (p4) res += `-${p4}`;
        return res;
      });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>, field: "phone" | "whatsapp") => {
    setFormData({ ...formData, [field]: formatPhone(e.target.value) });
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, cpf: formatCPF(e.target.value) });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedClient) {
        // Update client details
        await updateDoc(doc(db, "clients", selectedClient.id), {
          name: formData.name,
          phone: formData.phone,
          whatsapp: formData.whatsapp,
          cpf: formData.cpf || "",
          address: formData.address,
          notes: formData.notes || "",
          updatedAt: new Date()
        });
      } else {
        // Create client profile
        await addDoc(collection(db, "clients"), {
          name: formData.name,
          phone: formData.phone,
          whatsapp: formData.whatsapp,
          cpf: formData.cpf || "",
          address: formData.address,
          notes: formData.notes || "",
          pets: [],
          createdAt: new Date()
        });
      }
      setIsModalOpen(false);
      setIsEditMode(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "clients");
    }
  };

  const handleAddPet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    try {
      const updatedPets = [
        ...(selectedClient.pets || []),
        { ...petFormData }
      ];
      await updateDoc(doc(db, "clients", selectedClient.id), {
        pets: updatedPets
      });
      setSelectedClient({ ...selectedClient, pets: updatedPets });
      setShowAddPetForm(false);
      setPetFormData({ name: "", species: "Cachorro", breed: "", birthDate: "", notes: "" });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `clients/${selectedClient.id}`);
    }
  };

  const handleRemovePet = async (index: number) => {
    if (!selectedClient) return;
    if (!window.confirm("Deseja realmente remover este pet?")) return;
    try {
      const updatedPets = (selectedClient.pets || []).filter((_, i) => i !== index);
      await updateDoc(doc(db, "clients", selectedClient.id), {
        pets: updatedPets
      });
      setSelectedClient({ ...selectedClient, pets: updatedPets });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `clients/${selectedClient.id}`);
    }
  };

  const handleSyncWhatsapp = () => {
    setFormData(prev => ({ ...prev, whatsapp: prev.phone }));
  };

  const exportToCSV = () => {
    const headers = ["Nome", "Telefone", "WhatsApp", "CPF", "Endereço", "Observações", "Total de Pets"];
    const rows = clients.map(c => [
      c.name || "",
      c.phone || "",
      c.whatsapp || "",
      c.cpf || "",
      c.address || "",
      c.notes || "",
      c.pets ? c.pets.length : 0
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(";"), ...rows.map(e => e.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(";"))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Clientes_PetShop_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm) ||
    (c.cpf && c.cpf.includes(searchTerm))
  );

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-text-main">Clientes & Pets</h2>
          <p className="text-sm text-text-secondary">Gestão de tutores, animais cadastrados e histórico de visitas</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
          <button 
            onClick={exportToCSV}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-bg-card hover:bg-bg-elevated text-text-secondary rounded-xl transition-all shadow-sm font-bold text-xs uppercase tracking-wider border border-border"
          >
            <Download size={14} /> EXPORTAR CSV
          </button>
          <div className="relative max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
            <input
              type="text"
              placeholder="Pesquisar cliente, CPF ou tel..."
              className="w-full pl-14 pr-4 py-2 bg-bg-card border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none shadow-card text-sm text-text-main"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map((client) => (
          <motion.div
            layout
            key={client.id}
            onClick={() => handleOpenDetails(client)}
            className="bg-bg-card p-6 rounded-xl shadow-card border border-border hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-bold text-xl border border-primary/20 shadow-sm shrink-0">
                {client.name?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold text-text-main group-hover:text-primary transition-colors truncate text-base">{client.name}</h4>
                  <button 
                    onClick={(e) => handleOpenEdit(client, e)}
                    className="p-1 hover:bg-bg-elevated rounded text-text-muted hover:text-primary transition-colors duration-150"
                  >
                    <Edit size={14} />
                  </button>
                </div>
                <p className="text-xs text-text-muted font-bold uppercase tracking-widest truncate">
                  CPF: {client.cpf || "Não informado"}
                </p>
              </div>
            </div>
            
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3 text-xs text-text-secondary bg-bg-base p-2 rounded-lg border border-border">
                <div className="w-7 h-7 rounded-lg bg-bg-card flex items-center justify-center text-primary-dark shadow-sm">
                  <Phone size={13} />
                </div>
                <span className="font-semibold">{client.phone}</span>
                {client.whatsapp && client.whatsapp === client.phone ? (
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20 uppercase tracking-wider">WhatsApp</span>
                ) : null}
              </div>

              {/* Pets counts */}
              <div className="flex items-center gap-3 text-xs text-text-secondary bg-bg-base p-2 rounded-lg border border-border">
                <div className="w-7 h-7 rounded-lg bg-bg-card flex items-center justify-center text-primary shadow-sm">
                  <PawPrint size={13} />
                </div>
                <div className="flex-1 overflow-hidden">
                  {client.pets && client.pets.length > 0 ? (
                    <span className="font-bold text-primary">{client.pets.length} {client.pets.length === 1 ? "Pet" : "Pets"}: <span className="font-medium text-text-secondary text-xs truncate">{client.pets.map(p => p.name).join(", ")}</span></span>
                  ) : (
                    <span className="text-text-muted italic">Sem pets cadastrados</span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border flex justify-between items-center bg-bg-base/50 -mx-6 -mb-6 px-6 py-4 transition-all group-hover:bg-primary/5">
              <span className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-1">
                <Heart size={10} /> Perfil & Histórico
              </span>
              <History size={15} className="text-primary opacity-50 group-hover:opacity-100 transition-opacity" />
            </div>
          </motion.div>
        ))}
      </div>

       {/* Floating Action Button */}
       <button
        onClick={handleOpenCreate}
        className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-primary-dark hover:scale-110 transition-all active:scale-95 z-30"
      >
        <Plus size={32} />
      </button>

      {/* Profile/Registration Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 32 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 32 }}
              className="bg-bg-card border border-border w-full max-w-3xl rounded-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] text-text-main"
            >
               <div className="sidebar-gradient p-5 text-white flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <Users size={18} />
                  </div>
                  <h3 className="font-bold uppercase tracking-tight">
                    {isEditMode ? (selectedClient ? "Editar Cliente" : "Cadastrar Cliente") : "Perfil do Cliente / Pets"}
                  </h3>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/20 p-2 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto space-y-8 custom-scrollbar">
                {isEditMode ? (
                  /* Create / Edit Form */
                  <form onSubmit={handleSave} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Nome Completo do Tutor</label>
                        <input 
                          type="text"
                          required 
                          placeholder="Ex: João da Silva"
                          className="w-full px-4 py-2 bg-bg-base border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary text-sm font-medium transition-all text-text-main" 
                          value={formData.name} 
                          onChange={e => setFormData({...formData, name: e.target.value})} 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-text-muted uppercase tracking-widest">CPF (Opcional)</label>
                        <input 
                          type="text" 
                          placeholder="000.000.000-00"
                          className="w-full px-4 py-2 bg-bg-base border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary text-sm font-medium transition-all text-text-main" 
                          value={formData.cpf} 
                          onChange={handleCPFChange} 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Telefone de Contato</label>
                          <button 
                            type="button" 
                            onClick={handleSyncWhatsapp} 
                            className="text-xs font-bold text-primary hover:underline uppercase tracking-wide"
                          >
                            Mesmo p/ WhatsApp →
                          </button>
                        </div>
                        <input 
                          type="tel" 
                          required 
                          placeholder="(00) 00000-0000"
                          className="w-full px-4 py-2 bg-bg-base border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary text-sm font-medium transition-all text-text-main" 
                          value={formData.phone} 
                          onChange={e => handlePhoneChange(e, "phone")} 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-text-muted uppercase tracking-widest">WhatsApp</label>
                        <input 
                          type="tel" 
                          required 
                          placeholder="(00) 00000-0000"
                          className="w-full px-4 py-2 bg-bg-base border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary text-sm font-medium transition-all text-text-main" 
                          value={formData.whatsapp} 
                          onChange={e => handlePhoneChange(e, "whatsapp")} 
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Endereço Completo</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="Rua, Número, Bairro, Cidade"
                        className="w-full px-4 py-2 bg-bg-base border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary text-sm font-medium transition-all text-text-main" 
                        value={formData.address} 
                        onChange={e => setFormData({...formData, address: e.target.value})} 
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Observações do Cliente (Opcional)</label>
                      <textarea 
                        rows={3} 
                        placeholder="Ex: Prefere atendimento nos sábados de manhã..."
                        className="w-full px-4 py-3 bg-bg-base border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary text-sm font-medium transition-all resize-none text-text-main" 
                        value={formData.notes} 
                        onChange={e => setFormData({...formData, notes: e.target.value})} 
                      />
                    </div>

                    <div className="pt-4 flex gap-4">
                      <button 
                        type="button" 
                        onClick={() => { if (selectedClient) setIsEditMode(false); else setIsModalOpen(false); }}
                        className="flex-1 py-3 border border-border text-text-secondary hover:text-text-main hover:bg-bg-elevated font-bold rounded-xl transition-all uppercase text-xs tracking-widest"
                      >
                        Cancelar
                      </button>
                      <button 
                        type="submit" 
                        className="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark shadow-lg transition-all uppercase text-xs tracking-widest"
                      >
                        {selectedClient ? "ATUALIZAR TUTOR" : "FINALIZAR CADASTRO"}
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Client Profile details with PETS manager & Transactions */
                  selectedClient && (
                    <div className="space-y-8">
                      <div className="flex flex-col md:flex-row gap-8 pb-6 border-b border-border">
                        <div className="w-20 h-20 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center text-3xl font-bold text-primary shadow-sm shrink-0">
                          {selectedClient.name?.[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <h3 className="text-2xl font-bold text-text-main leading-tight">{selectedClient.name}</h3>
                            <button
                              onClick={(e) => handleOpenEdit(selectedClient, e)}
                              className="flex items-center gap-1 px-3 py-1.5 hover:bg-bg-elevated border border-border text-primary text-xs font-black tracking-widest uppercase rounded-lg transition-colors"
                            >
                              <Edit size={12} /> Editar Perfil
                            </button>
                          </div>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 text-xs text-text-secondary font-medium">
                            <p className="flex items-center gap-1.5"><span className="font-bold text-text-muted animate-pulse">CPF:</span> {selectedClient.cpf || "Não informado"}</p>
                            <p className="flex items-center gap-1.5"><span className="font-bold text-text-muted">WhatsApp:</span> {selectedClient.whatsapp || "Não informado"}</p>
                            <p className="flex items-center gap-1.5"><span className="font-bold text-text-muted">Telefone:</span> {selectedClient.phone}</p>
                            <p className="flex items-center gap-1.5 sm:col-span-2"><span className="font-bold text-text-muted">Endereço:</span> {selectedClient.address}</p>
                            {selectedClient.notes && (
                              <div className="sm:col-span-2 bg-primary/5 dark:bg-primary/10 p-4 rounded-xl border border-primary/20 text-xs mt-3 flex flex-col gap-1">
                                <p className="font-extrabold uppercase text-[10px] text-primary flex items-center gap-1.5 shrink-0 select-none">
                                  <ClipboardList size={14} /> Observações Importantes do Tutor
                                </p>
                                <p className="text-text-main leading-relaxed font-semibold">
                                  {selectedClient.notes}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* PET CORES PANEL */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-border pb-3">
                          <h4 className="font-bold text-xs uppercase tracking-widest text-primary flex items-center gap-2">
                            <PawPrint size={16} /> Animais Vinculados ({selectedClient.pets?.length || 0})
                          </h4>
                          {!showAddPetForm && (
                            <button 
                              onClick={() => setShowAddPetForm(true)}
                              className="text-xs font-bold text-white bg-primary hover:bg-primary-hover px-3 py-1.5 rounded-lg uppercase flex items-center gap-1 transition-colors"
                            >
                              <Plus size={12} /> CADASTRAR PET
                            </button>
                          )}
                        </div>

                        {/* Pet Creation Inline Sub-form */}
                        <AnimatePresence>
                          {showAddPetForm && (
                            <motion.form 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              onSubmit={handleAddPet}
                              className="p-5 bg-bg-elevated/50 border border-border rounded-xl space-y-4 overflow-hidden"
                            >
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Nome do Pet</label>
                                  <input 
                                    type="text" 
                                    required
                                    placeholder="Ex: Bob, Mel, Pipoca"
                                    className="w-full px-3 py-1.5 bg-bg-card border border-border rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary text-text-main"
                                    value={petFormData.name} 
                                    onChange={e => setPetFormData({...petFormData, name: e.target.value})} 
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Espécie</label>
                                  <select 
                                    className="w-full px-3 py-1.5 bg-bg-card border border-border rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary text-text-main"
                                    value={petFormData.species} 
                                    onChange={e => setPetFormData({...petFormData, species: e.target.value})}
                                  >
                                    <option value="Cachorro">Cachorro</option>
                                    <option value="Gato">Gato</option>
                                    <option value="Pássaro">Pássaro</option>
                                    <option value="Roedor">Roedor</option>
                                    <option value="Réptil">Réptil</option>
                                    <option value="Outro">Outro</option>
                                  </select>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Raça do Pet</label>
                                  <input 
                                    type="text" 
                                    required
                                    placeholder="Ex: Poodle, Persa, Sete raças..."
                                    className="w-full px-3 py-1.5 bg-bg-card border border-border rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary text-text-main"
                                    value={petFormData.breed} 
                                    onChange={e => setPetFormData({...petFormData, breed: e.target.value})} 
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Data de Nascimento (Aprox.)</label>
                                  <input 
                                    type="date" 
                                    required
                                    className="w-full px-3 py-1.5 bg-bg-card border border-border rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary text-text-main"
                                    value={petFormData.birthDate} 
                                    onChange={e => setPetFormData({...petFormData, birthDate: e.target.value})} 
                                  />
                                </div>
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Particularidades / Observações Clínicas</label>
                                <input 
                                  type="text" 
                                  placeholder="Ex: Tem alergia a medicamentos de látex, cardíaco, etc..."
                                  className="w-full px-3 py-1.5 bg-bg-card border border-border rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary text-text-main"
                                  value={petFormData.notes} 
                                  onChange={e => setPetFormData({...petFormData, notes: e.target.value})} 
                                />
                              </div>
                              <div className="flex justify-end gap-2 pt-2">
                                <button 
                                  type="button" 
                                  onClick={() => setShowAddPetForm(false)} 
                                  className="px-3 py-1.5 border border-border text-text-secondary hover:bg-bg-elevated rounded-lg text-xs font-bold uppercase transition"
                                >
                                  Cancelar
                                </button>
                                <button 
                                  type="submit" 
                                  className="px-4 py-1.5 bg-primary text-white hover:bg-primary-hover rounded-lg text-xs font-bold uppercase transition"
                                >
                                  GRAVAR NOVO PET
                                </button>
                              </div>
                            </motion.form>
                          )}
                        </AnimatePresence>

                        {/* Pets Rendered List */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {!selectedClient.pets || selectedClient.pets.length === 0 ? (
                            <div className="text-center py-6 text-text-muted bg-bg-base rounded-xl border border-dashed border-border sm:col-span-2">
                              🐾 Ninguém listado. Adicione o Bob ou a Luna clicando acima!
                            </div>
                          ) : (
                            selectedClient.pets.map((pet, i) => (
                              <div key={i} className="flex flex-col p-4 bg-bg-card border border-border rounded-xl shadow-sm hover:border-primary relative group/pet">
                                <button 
                                  onClick={() => handleRemovePet(i)}
                                  className="absolute top-3 right-3 p-1 hover:bg-red-50 text-text-muted hover:text-danger rounded transition-colors opacity-0 group-hover/pet:opacity-100"
                                  title="Remover pet do tutor"
                                >
                                  <Trash2 size={13} />
                                </button>
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                    <Heart size={14} fill="currentColor" />
                                  </div>
                                  <div>
                                    <h5 className="font-bold text-text-main text-sm">{pet.name}</h5>
                                    <span className="text-xs font-bold uppercase tracking-wide text-primary">{pet.species} • {pet.breed}</span>
                                  </div>
                                </div>
                                <p className="text-xs text-text-secondary mt-2 font-medium">Nasc: {new Date(pet.birthDate).toLocaleDateString('pt-BR')}</p>
                                {pet.notes && (
                                  <div className="mt-3 p-3 rounded-xl bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/20 text-xs text-text-main block text-left" title={pet.notes}>
                                    <p className="font-extrabold uppercase text-[10px] text-amber-600 dark:text-amber-400 mb-1 flex items-center gap-1 select-none">
                                      📌 Particularidades & Cuidados
                                    </p>
                                    <p className="whitespace-normal leading-relaxed text-text-main font-medium">
                                      {pet.notes}
                                    </p>
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Transaction details history */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-border pb-3">
                          <h4 className="font-bold text-xs uppercase tracking-widest text-text-secondary flex items-center gap-2">
                             <ShoppingBag size={14} className="text-primary" />
                             Últimas Vendas
                          </h4>
                          <span className="text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full uppercase">{clientSales.length} Pedidos</span>
                        </div>
                        <div className="space-y-3">
                          {clientSales.length === 0 ? (
                            <div className="text-center py-6 text-text-muted bg-bg-base rounded-xl border border-dashed border-border">
                              <ShoppingBag size={32} className="mx-auto mb-2 opacity-10" />
                              <p className="text-xs uppercase font-bold tracking-widest text-text-muted">Sem vendas associadas a este tutor</p>
                            </div>
                          ) : (
                            clientSales.map(sale => (
                              <div key={sale.id} className="flex justify-between items-center p-4 bg-bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-all">
                                 <div>
                                   <p className="font-bold text-sm text-text-main">
                                     {sale.createdAt ? new Date(sale.createdAt.seconds * 1000).toLocaleDateString('pt-BR') : "Sem Data"}
                                   </p>
                                   <p className="text-xs text-text-muted font-bold uppercase tracking-wider">{sale.items?.length || 0} itens comprados</p>
                                 </div>
                                 <div className="text-right">
                                   <p className="font-bold text-primary text-base">{formatCurrency(sale.total)}</p>
                                 </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
