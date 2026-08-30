import React, { useState } from 'react';
import {
  Ticket,
  Package,
  PartyPopper,
  UtensilsCrossed,
  LogOut,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import AdminTicketsTab from './admin/AdminTicketsTab';
import AdminTicketPackagesTab from './admin/AdminTicketPackagesTab';
import AdminPartyPackagesTab from './admin/AdminPartyPackagesTab';
import AdminMenuTab from './admin/AdminMenuTab';

interface AdminDashboardProps {
  onLogout: () => void;
  onNavigateHome?: () => void;
}

type AdminTab = 'tickets' | 'ticket_packages' | 'party_packages' | 'menu';

export default function AdminDashboard({ onLogout, onNavigateHome }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('tickets');

  const handleLogoutClick = () => {
    localStorage.removeItem('admin_token');
    onLogout();
  };

  const handleSessionExpired = () => {
    localStorage.removeItem('admin_token');
    onLogout();
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-neutral-100 font-sans pb-16 selection:bg-red-600 selection:text-white">
      {/* Top Admin Navbar */}
      <header className="border-b border-neutral-800/80 bg-neutral-950/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Logo / Title */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-red-600 text-white flex items-center justify-center font-black text-base shadow-md border border-red-500">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm uppercase tracking-tight text-white">
                    Painel Administrativo
                  </span>
                  <span className="px-2 py-0.5 rounded bg-red-950/80 text-red-400 text-[10px] font-bold uppercase tracking-wider border border-red-800/60">
                    Gerenciamento
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400">Ingressos, Festas e Cardápio</p>
              </div>
            </div>

            {/* Mobile Actions */}
            <div className="flex md:hidden items-center gap-2">
              <button
                onClick={handleLogoutClick}
                className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/60 font-bold transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sair</span>
              </button>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="flex items-center gap-1.5 p-1 rounded-xl bg-neutral-900/90 border border-neutral-800 overflow-x-auto scrollbar-none">
            {/* Tab: Ingressos */}
            <button
              id="admin-tab-tickets"
              onClick={() => setActiveTab('tickets')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'tickets'
                  ? 'bg-red-600 text-white shadow-md shadow-red-950/50'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>Ingressos</span>
            </button>

            {/* Tab: Pacotes de Ingresso */}
            <button
              id="admin-tab-ticket-packages"
              onClick={() => setActiveTab('ticket_packages')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'ticket_packages'
                  ? 'bg-red-600 text-white shadow-md shadow-red-950/50'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Pacotes de Ingresso</span>
            </button>

            {/* Tab: Pacotes de Festa */}
            <button
              id="admin-tab-party-packages"
              onClick={() => setActiveTab('party_packages')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'party_packages'
                  ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-950/50'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <PartyPopper className="w-3.5 h-3.5" />
              <span>Pacotes de Festa</span>
            </button>

            {/* Tab: Cardápio */}
            <button
              id="admin-tab-menu"
              onClick={() => setActiveTab('menu')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'menu'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-950/50'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <UtensilsCrossed className="w-3.5 h-3.5" />
              <span>Cardápio</span>
            </button>
          </nav>

          {/* Desktop Header Actions */}
          <div className="hidden md:flex items-center gap-3">
            {onNavigateHome && (
              <button
                onClick={onNavigateHome}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
                <span>Ver Site Público</span>
              </button>
            )}

            <button
              id="admin-logout-btn-desktop"
              onClick={handleLogoutClick}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/60 font-bold transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        {activeTab === 'tickets' && (
          <AdminTicketsTab onSessionExpired={handleSessionExpired} />
        )}

        {activeTab === 'ticket_packages' && (
          <AdminTicketPackagesTab onSessionExpired={handleSessionExpired} />
        )}

        {activeTab === 'party_packages' && (
          <AdminPartyPackagesTab onSessionExpired={handleSessionExpired} />
        )}

        {activeTab === 'menu' && (
          <AdminMenuTab onSessionExpired={handleSessionExpired} />
        )}
      </main>
    </div>
  );
}
