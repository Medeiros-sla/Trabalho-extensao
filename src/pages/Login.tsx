import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { motion, AnimatePresence } from "motion/react";
import { Mail, Lock, PawPrint, User, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";

type ViewMode = "login" | "signup" | "forgot";

export const Login: React.FC = () => {
  const [view, setView] = useState<ViewMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Sign up specifics
  const [username, setUsername] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Forgot password specifics
  const [forgotEmail, setForgotEmail] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch (err: any) {
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setError("E-mail ou senha incorretos.");
      } else if (err.code === "auth/invalid-credential") {
        setError("Credenciais inválidas. Verifique seu e-mail e senha.");
      } else {
        setError("Ocorreu um erro ao fazer login. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!username.trim()) {
      setError("Por favor, preencha o Nome de Usuário.");
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      // 1. Create auth account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Create corresponding document in Firestore
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, {
        uid: user.uid,
        username: username,
        name: username,
        email: email,
        role: "vendedor",
        active: true,
        createdAt: new Date()
      });

      // 3. Sign out automatically since createUserWithEmailAndPassword auto-logs in the user.
      // This allows them to manual login and satisfies the "Após cadastro bem-sucedido, redirecionar para a tela de login" instruction.
      await signOut(auth);

      // 4. Update UI states
      setSuccess("Conta criada com sucesso! Faça login com as novas credenciais.");
      setView("login");
      setPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        setError("Este e-mail já está cadastrado.");
      } else if (err.code === "auth/invalid-email") {
        setError("E-mail com formato inválido.");
      } else if (err.code === "auth/weak-password") {
        setError("Senha fraca demais. Escolha uma senha com no mínimo 6 caracteres.");
      } else {
        setError("Erro ao cadastrar conta. Tente novamente.");
        console.error("Signup error:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!forgotEmail.trim()) {
      setError("Por favor, informe seu e-mail.");
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, forgotEmail);
      setSuccess("E-mail de redefinição enviado com sucesso! Verifique sua caixa de entrada.");
      setEmail(forgotEmail); // Put into login input for convenience
      setView("login");
    } catch (err: any) {
      if (err.code === "auth/user-not-found") {
        setError("E-mail não encontrado no sistema.");
      } else if (err.code === "auth/invalid-email") {
        setError("E-mail com formato inválido.");
      } else {
        setError("Erro ao enviar e-mail de redefinição. Tente novamente.");
        console.error("Forgot password error:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-from)_0%,_transparent_50%)] from-amber-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-white"
      >
        {/* Banner */}
        <div className="sidebar-gradient p-10 text-white text-center relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-black/10 rounded-full blur-3xl"></div>
          
          <motion.div
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl transform"
          >
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
              <PawPrint size={24} className="text-white" />
            </div>
          </motion.div>
          
          <h1 className="text-3xl font-black tracking-tighter uppercase mb-1">VendasPro</h1>
          <p className="text-white/70 text-xs font-bold tracking-widest uppercase">Pet Shop & Gestão de Estoque</p>
        </div>

        {/* Global Success / Error Messages */}
        <div className="px-10 pt-6">
          <AnimatePresence mode="wait">
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 text-emerald-600 p-3 bg-emerald-50 rounded-lg border border-emerald-150"
              >
                <CheckCircle size={16} className="shrink-0" />
                <span className="text-[11px] font-bold uppercase">{success}</span>
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 text-danger p-3 bg-red-50 rounded-lg border border-red-100"
              >
                <AlertCircle size={16} className="shrink-0" />
                <span className="text-[11px] font-bold uppercase">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Views */}
        <div className="p-10 pt-4">
          <AnimatePresence mode="wait">
            {view === "login" && (
              <motion.div
                key="login-view"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
              >
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="email"
                      placeholder="E-mail profissional"
                      required
                      disabled={loading}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm font-medium"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="password"
                      placeholder="Sua senha"
                      required
                      disabled={loading}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm font-medium"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary text-white py-4 rounded-xl font-bold hover:bg-primary-dark transition-all shadow-lg active:scale-[0.98] uppercase text-xs tracking-widest mt-4 flex justify-center items-center gap-2 cursor-pointer"
                  >
                    {loading ? "Processando..." : "ACESSAR SISTEMA"}
                  </button>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setError("");
                        setSuccess("");
                        setForgotEmail(email);
                        setView("forgot");
                      }}
                      className="text-[11px] font-black text-gray-400 hover:text-primary transition-all uppercase tracking-wider cursor-pointer"
                    >
                      Esqueci minha senha
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setError("");
                        setSuccess("");
                        setView("signup");
                      }}
                      className="text-[11px] font-black text-primary hover:text-primary-dark transition-all uppercase tracking-wider cursor-pointer"
                    >
                      Criar Conta
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {view === "signup" && (
              <motion.div
                key="signup-view"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="Nome de Usuário"
                      required
                      disabled={loading}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm font-medium"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>

                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="email"
                      placeholder="Seu E-mail"
                      required
                      disabled={loading}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm font-medium"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="password"
                      placeholder="Seu Password (mín. 6)"
                      required
                      disabled={loading}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm font-medium"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="password"
                      placeholder="Confirmar Senha"
                      required
                      disabled={loading}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm font-medium"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary text-white py-4 rounded-xl font-bold hover:bg-primary-dark transition-all shadow-lg active:scale-[0.98] uppercase text-xs tracking-widest mt-4 flex justify-center items-center gap-2 cursor-pointer"
                  >
                    {loading ? "Processando..." : "CADASTRAR CONTA"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      setSuccess("");
                      setView("login");
                    }}
                    className="w-full text-center text-[10px] font-black text-gray-400 hover:text-primary uppercase tracking-widest mt-4 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft size={14} /> VOLTAR PARA O LOGIN
                  </button>
                </form>
              </motion.div>
            )}

            {view === "forgot" && (
              <motion.div
                key="forgot-view"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <form onSubmit={handleForgotPassword} className="space-y-5">
                  <p className="text-xs text-gray-500 font-medium leading-relaxed mb-2 text-center">
                    Insira o e-mail cadastrado e enviaremos um link para você redefinir sua senha com segurança.
                  </p>

                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="email"
                      placeholder="Insera seu e-mail"
                      required
                      disabled={loading}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm font-medium"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary text-white py-4 rounded-xl font-bold hover:bg-primary-dark transition-all shadow-lg active:scale-[0.98] uppercase text-xs tracking-widest mt-4 flex justify-center items-center gap-2 cursor-pointer"
                  >
                    {loading ? "Processando..." : "ENVIAR LINK DE RECUPERAÇÃO"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      setSuccess("");
                      setView("login");
                    }}
                    className="w-full text-center text-[10px] font-black text-gray-400 hover:text-primary uppercase tracking-widest mt-4 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft size={14} /> VOLTAR PARA O LOGIN
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
