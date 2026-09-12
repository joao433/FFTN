import React, { useState, useEffect } from 'react';
import { Lock, Mail, ArrowRight, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { getApiUrl } from '../lib/api.ts';
import ParkLogo from './ParkLogo.tsx';

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
      const response = await fetch(getApiUrl('admin-login'), {
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
    <div className="min-h-screen bg-[#FDF6ED] text-[#3A2E26] flex flex-col justify-center items-center px-4 py-12 selection:bg-[#E8734A] selection:text-white">
      {/* Background Subtle Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-[#E8734A]/10 blur-[130px] rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header / Branding */}
        <div className="text-center mb-8">
          <div
            onClick={onNavigateHome}
            className="inline-block cursor-pointer transition-transform hover:scale-105 mb-4"
            title="Ir para o site público"
          >
            <ParkLogo size="lg" />
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-[#3A2E26] font-fredoka">
            Painel Administrativo
          </h1>
          <p className="text-xs text-[#7A6C60] mt-1 uppercase tracking-widest font-bold">
            Acesso Restrito da Equipe
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-[#EADCC9] rounded-2xl p-6 sm:p-8 shadow-xl backdrop-blur-md">
          {errorMessage && (
            <div
              id="admin-login-error"
              className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5"
            >
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Field: Email */}
            <div>
              <label
                htmlFor="admin_email"
                className="block text-[11px] font-bold uppercase tracking-wider text-[#3A2E26] mb-1.5"
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
                  className="w-full px-3.5 py-2.5 pl-9 rounded-xl bg-[#FAF0E1] border border-[#EADCC9] focus:border-[#E8734A] focus:ring-1 focus:ring-[#E8734A] text-xs text-[#3A2E26] placeholder-[#A89A8D] transition-all outline-none"
                />
                <Mail className="w-4 h-4 text-[#A89A8D] absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Field: Password */}
            <div>
              <label
                htmlFor="admin_password"
                className="block text-[11px] font-bold uppercase tracking-wider text-[#3A2E26] mb-1.5"
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
                  className="w-full px-3.5 py-2.5 pl-9 rounded-xl bg-[#FAF0E1] border border-[#EADCC9] focus:border-[#E8734A] focus:ring-1 focus:ring-[#E8734A] text-xs text-[#3A2E26] placeholder-[#A89A8D] transition-all outline-none"
                />
                <Lock className="w-4 h-4 text-[#A89A8D] absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Submit Button */}
            <button
              id="admin-login-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-[#E8734A] hover:bg-[#D26038] active:bg-[#BF5028] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-[#E8734A]/20 flex items-center justify-center gap-2 group cursor-pointer font-fredoka"
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

          <div className="mt-6 pt-4 border-t border-[#F1E4D3] flex items-center justify-between text-[11px] text-[#7A6C60]">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Ambiente Seguro (JWT)
            </span>
            {onNavigateHome && (
              <button
                onClick={onNavigateHome}
                className="text-[#7A6C60] hover:text-[#3A2E26] transition-colors underline cursor-pointer"
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
