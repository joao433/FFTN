import React, { useState } from 'react';
import {
  Ticket,
  Package,
  PartyPopper,
  UtensilsCrossed,
  CalendarDays,
  ShoppingBag,
  LogOut,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import AdminTicketsTab from './admin/AdminTicketsTab';
import AdminTicketPackagesTab from './admin/AdminTicketPackagesTab';
import AdminPartyPackagesTab from './admin/AdminPartyPackagesTab';
import AdminPartyBookingsTab from './admin/AdminPartyBookingsTab';
import AdminMenuTab from './admin/AdminMenuTab';
import AdminMenuOrdersTab from './admin/AdminMenuOrdersTab';

interface AdminDashboardProps {
  onLogout: () => void;
  onNavigateHome?: () => void;
}

type AdminTab =
  | 'tickets'
  | 'party_bookings'
  | 'menu_orders'
  | 'ticket_packages'
  | 'party_packages'
  | 'menu';

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
      <header className="border-b border-neutral-800/80 bg-neutral-950/95 backdrop-blur-md sticky top-0 z-30 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 space-y-3">
          {/* Top Row: Brand & Actions */}
          <div className="flex items-center justify-between gap-3">
            {/* Logo / Title */}
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-red-600 text-white flex items-center justify-center font-black text-base shadow-md border border-red-500 flex-shrink-0">
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
                <p className="text-[11px] text-neutral-400">Ingressos, Festas, Pedidos e Cardápio</p>
              </div>
            </div>

            {/* Top Right Actions (Site + Logout) */}
            <div className="flex items-center gap-2 sm:gap-3">
              {onNavigateHome && (
                <button
                  onClick={onNavigateHome}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="hidden sm:inline">Ver Site Público</span>
                  <span className="sm:hidden">Site</span>
                </button>
              )}

              <button
                id="admin-logout-btn"
                onClick={handleLogoutClick}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/60 font-bold transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sair</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs (Full Width, all 6 tabs visible) */}
          <nav className="flex items-center gap-2 p-1.5 rounded-xl bg-neutral-900/90 border border-neutral-800 overflow-x-auto">
            {/* Tab 1: Ingressos */}
            <button
              id="admin-tab-tickets"
              onClick={() => setActiveTab('tickets')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'tickets'
                  ? 'bg-red-600 text-white shadow-md shadow-red-950/50'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <Ticket className="w-4 h-4" />
              <span>Ingressos</span>
            </button>

            {/* Tab 2: Reservas de Festa */}
            <button
              id="admin-tab-party-bookings"
              onClick={() => setActiveTab('party_bookings')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'party_bookings'
                  ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-950/50'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              <span>Reservas de Festa</span>
            </button>

            {/* Tab 3: Pedidos do Cardápio */}
            <button
              id="admin-tab-menu-orders"
              onClick={() => setActiveTab('menu_orders')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'menu_orders'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-950/50'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Pedidos do Cardápio</span>
            </button>

            {/* Tab 4: Pacotes de Ingresso */}
            <button
              id="admin-tab-ticket-packages"
              onClick={() => setActiveTab('ticket_packages')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'ticket_packages'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-950/50'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Pacotes de Ingresso</span>
            </button>

            {/* Tab 5: Pacotes de Festa */}
            <button
              id="admin-tab-party-packages"
              onClick={() => setActiveTab('party_packages')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'party_packages'
                  ? 'bg-pink-600 text-white shadow-md shadow-pink-950/50'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <PartyPopper className="w-4 h-4" />
              <span>Pacotes de Festa</span>
            </button>

            {/* Tab 6: Cardápio */}
            <button
              id="admin-tab-menu"
              onClick={() => setActiveTab('menu')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'menu'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <UtensilsCrossed className="w-4 h-4" />
              <span>Cardápio</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        {activeTab === 'tickets' && (
          <AdminTicketsTab onSessionExpired={handleSessionExpired} />
        )}

        {activeTab === 'party_bookings' && (
          <AdminPartyBookingsTab onSessionExpired={handleSessionExpired} />
        )}

        {activeTab === 'menu_orders' && (
          <AdminMenuOrdersTab onSessionExpired={handleSessionExpired} />
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
