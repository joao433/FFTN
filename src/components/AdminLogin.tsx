import React, { useState, useEffect } from 'react';
import { Lock, Mail, ArrowRight, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';

interface AdminLoginProps {
  onLoginSuccess: () => void;
  onNavigateHome?: () => void;
}

export default function AdminLogin({ onLoginSuccess, onNavigateHome }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Se já houver token salvo, redireciona diretamente
  useEffect(() => {
    const existingToken = localStorage.getItem('admin_token');
    if (existingToken) {
      onLoginSuccess();
    }
  }, [onLoginSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Informe seu e-mail e senha.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/.netlify/functions/admin-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.token) {
        setErrorMessage('E-mail ou senha inválidos.');
        setIsLoading(false);
        return;
      }

      // Salva o token JWT no localStorage
      localStorage.setItem('admin_token', data.token);

      // Redireciona para o dashboard
      onLoginSuccess();
    } catch (err) {
      console.error('[Admin Login Error]:', err);
      setErrorMessage('E-mail ou senha inválidos.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-neutral-100 flex flex-col justify-center items-center px-4 py-12 selection:bg-red-600 selection:text-white">
      {/* Background Subtle Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-red-600/10 blur-[130px] rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header / Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 text-red-500 shadow-xl mb-4">
            <Lock className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-white">
            Painel Administrativo
          </h1>
          <p className="text-xs text-neutral-400 mt-1 uppercase tracking-widest font-bold">
            Acesso Restrito da Equipe
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-neutral-900/90 border border-neutral-800/90 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          {errorMessage && (
            <div
              id="admin-login-error"
              className="mb-6 p-3.5 rounded-xl bg-red-950/70 border border-red-800/70 text-red-200 text-xs flex items-center gap-2.5"
            >
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Field: Email */}
            <div>
              <label
                htmlFor="admin_email"
                className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-1.5"
              >
                E-mail
              </label>
              <div className="relative">
                <input
                  id="admin_email"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@parqueaventura.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-3.5 py-2.5 pl-9 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-xs text-white placeholder-neutral-600 transition-all outline-none"
                />
                <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Field: Password */}
            <div>
              <label
                htmlFor="admin_password"
                className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-1.5"
              >
                Senha
              </label>
              <div className="relative">
                <input
                  id="admin_password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-3.5 py-2.5 pl-9 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-xs text-white placeholder-neutral-600 transition-all outline-none"
                />
                <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Submit Button */}
            <button
              id="admin-login-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 active:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-red-950/40 flex items-center justify-center gap-2 group cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Entrando...</span>
                </>
              ) : (
                <>
                  <span>Entrar</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Ambiente Seguro (JWT)
            </span>
            {onNavigateHome && (
              <button
                onClick={onNavigateHome}
                className="text-neutral-400 hover:text-white transition-colors underline cursor-pointer"
              >
                Voltar ao site
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
