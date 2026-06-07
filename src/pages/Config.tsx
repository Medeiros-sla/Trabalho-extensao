import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { User, Bell, Moon, Sun, Shield, Save, Key, Settings, Users } from "lucide-react";
import { doc, updateDoc, collection, query, onSnapshot } from "firebase/firestore";
import { sendPasswordResetEmail } from "firebase/auth";
import { db, auth } from "../lib/firebase";
import { cn } from "../lib/utils";
import { motion } from "motion/react";

export const Config: React.FC = () => {
  const { profile } = useAuth();
  const [name, setName] = useState(profile?.name || "");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState("");

  const [selectedTheme, setSelectedTheme] = useState(() => localStorage.getItem("theme") || "light");
  const [notifications, setNotifications] = useState(true);
  const [usersList, setUsersList] = useState<any[]>([]);

  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [resetError, setResetError] = useState("");

  useEffect(() => {
    if (profile) {
      setName(profile.name || profile.username || "");
    }
  }, [profile]);

  useEffect(() => {
    if (profile?.role !== "admin") return;
    const q = query(collection(db, "users"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsersList(docs);
    });
    return () => unsubscribe();
  }, [profile?.role]);

  const handleUpdateRole = async (userId: string, currentRole: string) => {
    try {
      const nextRole = currentRole === "admin" ? "vendedor" : "admin";
      if (userId === profile?.uid) {
        alert("Você não pode alterar seu próprio cargo a partir desta tela para evitar bloqueio acidental.");
        return;
      }
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { role: nextRole });
    } catch (error) {
      console.error("Erro ao alterar cargo:", error);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile?.uid) return;
    setSaving(true);
    setSaveSuccess("");
    try {
      const userRef = doc(db, "users", profile.uid);
      await updateDoc(userRef, {
        name: name,
        username: name // keep both in sync
      });
      setSaveSuccess("Perfil atualizado com sucesso!");
      setTimeout(() => setSaveSuccess(""), 3000);
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
      alert("Erro ao atualizar perfil.");
    } finally {
      setSaving(false);
    }
  };

  const handleThemeChange = (themeValue: string) => {
    setSelectedTheme(themeValue);
    localStorage.setItem("theme", themeValue);
    
    // Apply theme
    if (themeValue === "dark") {
      document.documentElement.classList.add("dark");
    } else if (themeValue === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      // system
      const matchesDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (matchesDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  };

  const handleResetPassword = async () => {
    if (!profile?.email) return;
    setResetEmailSent(false);
    setResetError("");
    try {
      await sendPasswordResetEmail(auth, profile.email);
      setResetEmailSent(true);
    } catch (error: any) {
      console.error("Erro ao enviar email de redefinição:", error);
      setResetError("Não foi possível enviar o e-mail de redefinição.");
    }
  };

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
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-8">
              <button 
                type="button"
                disabled={saving || !name.trim()}
                onClick={handleSaveProfile}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-all shadow-lg active:scale-95 text-xs tracking-widest uppercase disabled:opacity-50 cursor-pointer"
              >
                <Save size={16} /> {saving ? "Salvando..." : "SALVAR ALTERAÇÕES"}
              </button>
              {saveSuccess && (
                <span className="text-xs font-bold text-green-600 uppercase tracking-wider">{saveSuccess}</span>
              )}
            </div>
          </section>

          <section className="bg-white p-6 rounded-xl shadow-card border border-gray-100">
             <h3 className="font-bold mb-6 flex items-center gap-2 text-sm">
              <Key size={18} className="text-primary-dark" />
              SEGURANÇA
            </h3>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="font-bold text-gray-900 text-sm">Alterar Senha</p>
                <p className="text-xs text-gray-500">Solicite um link temporário por e-mail para atualizar sua senha de acesso com segurança</p>
                {resetEmailSent && (
                  <p className="text-xs font-bold text-emerald-600 mt-2 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-lg">
                    E-mail de redefinição enviado com sucesso para {profile?.email || ""}! Verifique sua caixa de entrada.
                  </p>
                )}
                {resetError && (
                  <p className="text-xs font-bold text-red-500 mt-2">
                    {resetError}
                  </p>
                )}
              </div>
              <button 
                type="button"
                onClick={handleResetPassword}
                className="px-4 py-2 border border-gray-200 rounded-xl text-[10px] font-bold text-gray-600 hover:bg-gray-50 uppercase tracking-widest transition-colors shadow-sm cursor-pointer whitespace-nowrap shrink-0"
              >
                REDEFINIR SENHA
              </button>
            </div>
          </section>
        </div>

        {/* Preferences & Account Info Section */}
        <div className="space-y-6">
          <section className="bg-white p-6 rounded-xl shadow-card border border-gray-100">
             <h3 className="font-bold mb-6 flex items-center gap-2 text-sm text-gray-400">
              <Settings size={18} />
              PREFERÊNCIAS
            </h3>
            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Modos de Tema</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "light", label: "Claro", icon: Sun },
                    { id: "dark", label: "Escuro", icon: Moon },
                    { id: "system", label: "Sistema", icon: Settings }
                  ].map((t) => {
                    const IconComp = t.icon;
                    const isSelected = selectedTheme === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleThemeChange(t.id)}
                        className={cn(
                          "flex flex-col items-center justify-center p-3 rounded-lg border text-xs gap-1.5 transition-all outline-none font-bold cursor-pointer",
                          isSelected
                            ? "bg-amber-50 border-amber-400 text-amber-700 shadow-sm"
                            : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                        )}
                      >
                        <IconComp size={16} />
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-50">
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

          <section className="bg-white p-6 rounded-xl shadow-card border border-gray-100">
            <h3 className="font-bold mb-4 flex items-center gap-2 text-xs text-gray-400 uppercase tracking-widest">
              <Shield size={16} className="text-primary" />
              Informações da Conta
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <span className="font-bold text-gray-400 uppercase tracking-wide">Nome de usuário:</span>
                <p className="font-semibold text-gray-800 mt-0.5">{profile?.name || profile?.username || "---"}</p>
              </div>
              <div>
                <span className="font-bold text-gray-400 uppercase tracking-wide">E-mail:</span>
                <p className="font-semibold text-gray-800 mt-0.5">{profile?.email || "---"}</p>
              </div>
              <div>
                <span className="font-bold text-gray-400 uppercase tracking-wide">Cargo atual:</span>
                <br />
                <span className={cn(
                  "inline-block px-2.5 py-0.5 mt-1.5 rounded text-[9px] font-black uppercase tracking-wider",
                  profile?.role === "admin" ? "bg-amber-100 text-amber-800 border border-amber-200" : "bg-blue-100 text-blue-800 border border-blue-200"
                )}>
                  {profile?.role === "admin" ? "Administrador" : "Vendedor"}
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Admin exclusive user list & configurations */}
      {profile?.role === "admin" && (
        <section className="bg-white p-6 rounded-xl shadow-card border border-gray-100 mt-6">
          <h3 className="font-bold mb-6 flex items-center gap-2 text-sm">
            <Users size={18} className="text-primary" />
            GERENCIAMENTO DE USUÁRIOS DO SISTEMA
          </h3>
          <p className="text-xs text-gray-500 mb-6 font-medium">
            Como administrador, você pode gerenciar e atualizar os cargos dos funcionários cadastrados no sistema.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-widest font-black text-[9px] bg-gray-50/50">
                  <th className="py-3 px-4">Nome</th>
                  <th className="py-3 px-4">E-mail</th>
                  <th className="py-3 px-4">Cargo Autorizado</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {usersList.map((usr) => (
                  <tr key={usr.id} className="hover:bg-gray-50/55 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-gray-900">{usr.name || usr.username || "Usuário"}</td>
                    <td className="py-3.5 px-4 text-gray-500 font-medium">{usr.email || "Sem e-mail"}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                        usr.role === "admin" 
                          ? "bg-amber-100 text-amber-800 border border-amber-200" 
                          : "bg-blue-100 text-blue-800 border border-blue-200"
                      }`}>
                        {usr.role === "admin" ? "Administrador" : "Vendedor"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleUpdateRole(usr.id, usr.role)}
                        disabled={usr.id === profile?.uid}
                        className={cn(
                          "text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border transition-all",
                          usr.id === profile?.uid
                            ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                            : "bg-white border-gray-200 text-primary hover:bg-gray-50 active:scale-95 cursor-pointer"
                        )}
                      >
                        {usr.role === "admin" ? "Rebaixar para Vendedor" : "Promover a Admin"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};
