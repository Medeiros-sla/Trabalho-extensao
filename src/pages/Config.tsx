import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { User, Bell, Moon, Sun, Shield, Save, Key, Settings } from "lucide-react";
import { motion } from "motion/react";

export const Config: React.FC = () => {
  const { profile } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h2 className="text-2xl font-bold text-text-main">Configurações</h2>
        <p className="text-sm text-gray-500">Gerencie seu perfil e preferências do sistema</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Section */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white p-6 rounded-xl shadow-card border border-gray-100">
            <h3 className="font-bold mb-6 flex items-center gap-2 text-sm">
              <User size={18} className="text-primary" />
              DADOS DO PERFIL
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nome Completo</label>
                <input 
                  type="text" 
                  defaultValue={profile?.name || ""} 
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary text-sm font-medium"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">E-mail</label>
                <input 
                  type="email" 
                  readOnly
                  defaultValue={profile?.email || ""} 
                  className="w-full px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg outline-none cursor-not-allowed text-sm font-medium text-gray-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cargo / Função</label>
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 text-sm font-medium">
                  <Shield size={16} className="text-primary" />
                  <span className="capitalize">{profile?.role || "Usuário"}</span>
                </div>
              </div>
            </div>
            <button className="mt-8 flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-all shadow-lg active:scale-95 text-xs tracking-widest uppercase">
              <Save size={16} /> SALVAR ALTERAÇÕES
            </button>
          </section>

          <section className="bg-white p-6 rounded-xl shadow-card border border-gray-100">
             <h3 className="font-bold mb-6 flex items-center gap-2 text-sm">
              <Key size={18} className="text-primary-dark" />
              SEGURANÇA
            </h3>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="font-bold text-gray-900 text-sm">Alterar Senha</p>
                <p className="text-xs text-gray-500">Atualize sua senha de acesso periodicamente para manter a conta segura</p>
              </div>
              <button className="px-4 py-2 border border-gray-200 rounded-xl text-[10px] font-bold text-gray-600 hover:bg-gray-50 uppercase tracking-widest transition-colors shadow-sm">
                REDEFINIR SENHA
              </button>
            </div>
          </section>
        </div>

        {/* Preferences Section */}
        <div className="space-y-6">
          <section className="bg-white p-6 rounded-xl shadow-card border border-gray-100">
             <h3 className="font-bold mb-6 flex items-center gap-2 text-sm text-gray-400">
              <Settings size={18} />
              PREFERÊNCIAS
            </h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    {darkMode ? <Moon size={20} className="text-primary" /> : <Sun size={20} className="text-yellow-500" />}
                  </div>
                  <div>
                    <p className="font-bold text-xs">Tema Escuro</p>
                    <p className="text-[10px] text-gray-400">Ativa o modo noturno</p>
                  </div>
                </div>
                <button 
                  onClick={() => setDarkMode(!darkMode)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${darkMode ? "bg-primary" : "bg-gray-200"}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${darkMode ? "left-5.5" : "left-0.5"}`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-50 rounded-lg">
                    <Bell size={20} className="text-danger" />
                  </div>
                  <div>
                    <p className="font-bold text-xs">Notificações Push</p>
                    <p className="text-[10px] text-gray-400">Alertas de estoque baixo</p>
                  </div>
                </div>
                <button 
                  onClick={() => setNotifications(!notifications)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${notifications ? "bg-green-500" : "bg-gray-200"}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${notifications ? "left-5.5" : "left-0.5"}`} />
                </button>
              </div>
            </div>
          </section>

          <div className="p-6 rounded-xl sidebar-gradient text-white space-y-4 shadow-card">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Settings size={24} />
              </div>
              <h4 className="font-bold uppercase tracking-tight">VendasPro v1.0.0</h4>
            </div>
            <p className="text-xs text-white/80 leading-relaxed">Software de gestão profissional otimizado para o seu negócio.</p>
            <div className="pt-2">
              <button className="text-[10px] font-bold uppercase tracking-widest bg-white/10 px-4 py-2 rounded-lg hover:bg-white/20 transition-colors w-full border border-white/10">Manual do Usuário</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
