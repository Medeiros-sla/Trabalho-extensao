import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";
import { motion } from "motion/react";
import { Mail, Lock, User, ShieldCheck } from "lucide-react";

export const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"admin" | "vendedor">("vendedor");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        // Profile creation is handled in AuthContext's onAuthStateChanged
      }
      navigate("/");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      navigate("/");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-from)_0%,_transparent_50%)] from-blue-100">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-white"
      >
        <div className="sidebar-gradient p-10 text-white text-center relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-black/10 rounded-full blur-3xl"></div>
          
          <motion.div
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl transform"
          >
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
               <div className="w-6 h-6 bg-white rounded-sm transform rotate-45"></div>
            </div>
          </motion.div>
          
          <h1 className="text-3xl font-black tracking-tighter uppercase mb-1">VendasPro</h1>
          <p className="text-white/70 text-xs font-bold tracking-widest uppercase">Sistema de Gestão Profissional</p>
        </div>

        <div className="p-10">
          <form onSubmit={handleAuth} className="space-y-5">
            {!isLogin && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Nome Completo"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm font-medium"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 p-1 bg-gray-50 rounded-xl border border-gray-200">
                   <button
                    type="button"
                    onClick={() => setRole("vendedor")}
                    className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${role === "vendedor" ? "bg-white text-primary shadow-sm" : "bg-transparent text-gray-400"}`}
                   >
                     Vendedor
                   </button>
                   <button
                    type="button"
                    onClick={() => setRole("admin")}
                    className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${role === "admin" ? "bg-white text-primary shadow-sm" : "bg-transparent text-gray-400"}`}
                   >
                     Admin
                   </button>
                </div>
              </motion.div>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="email"
                placeholder="E-mail profissional"
                required
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm font-medium"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="password"
                placeholder="Sua senha secreta"
                required
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm font-medium"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-danger p-3 bg-red-50 rounded-lg border border-red-100">
                <span className="text-[10px] font-bold uppercase">{error}</span>
              </motion.div>
            )}

            <button
              type="submit"
              className="w-full bg-primary text-white py-4 rounded-xl font-bold hover:bg-primary-dark transition-all shadow-lg active:scale-[0.98] uppercase text-xs tracking-widest mt-4"
            >
              {isLogin ? "ACESSAR SISTEMA" : "CRIAR CONTA"}
            </button>
          </form>

          <div className="mt-10 flex flex-col gap-6 items-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary text-[10px] font-bold uppercase tracking-widest hover:underline"
            >
              {isLogin ? "Ainda não tem conta? Cadastre-se" : "Já é membro? Faça login"}
            </button>
            
            <div className="w-full flex items-center gap-4">
              <div className="flex-1 h-px bg-gray-100"></div>
              <span className="text-gray-300 text-[10px] font-bold">OU</span>
              <div className="flex-1 h-px bg-gray-100"></div>
            </div>

            <button
              onClick={handleGoogleLogin}
              className="group w-full flex items-center justify-center gap-3 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm active:scale-95"
            >
              <img src="https://www.gstatic.com/firebase/builtins/pixie/images/google-g.svg" className="w-5 h-5 group-hover:scale-110 transition-transform" alt="Google" />
              <span className="text-gray-600 text-xs font-bold uppercase tracking-widest">Entrar com Google</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
