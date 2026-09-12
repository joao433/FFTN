import React, { useState } from 'react';
import {
  Ticket,
  Package,
  PartyPopper,
  UtensilsCrossed,
  CalendarDays,
  Calendar,
  ShoppingBag,
  LogOut,
  ExternalLink,
  ShieldCheck,
  Sliders,
} from 'lucide-react';
import AdminTicketsTab from './admin/AdminTicketsTab';
import AdminTicketPackagesTab from './admin/AdminTicketPackagesTab';
import AdminPartyPackagesTab from './admin/AdminPartyPackagesTab';
import AdminPartyBookingsTab from './admin/AdminPartyBookingsTab';
import AdminPartyCalendarTab from './admin/AdminPartyCalendarTab.tsx';
import AdminMenuTab from './admin/AdminMenuTab';
import AdminMenuOrdersTab from './admin/AdminMenuOrdersTab';
import AdminSiteSettingsTab from './admin/AdminSiteSettingsTab.tsx';
import AdminLanguageSelector from './admin/AdminLanguageSelector.tsx';
import { AdminLanguageProvider, useAdminLanguage } from '../lib/adminI18n.tsx';
import ParkLogo from './ParkLogo.tsx';

interface AdminDashboardProps {
  onLogout: () => void;
  onNavigateHome?: () => void;
}

type AdminTab =
  | 'tickets'
  | 'party_bookings'
  | 'party_calendar'
  | 'menu_orders'
  | 'ticket_packages'
  | 'party_packages'
  | 'menu'
  | 'site_settings';

function AdminDashboardContent({ onLogout, onNavigateHome }: AdminDashboardProps) {
  const { t } = useAdminLanguage();
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
    <div className="admin-root min-h-screen bg-[#F9F3F1] text-[#090909] font-sans pb-16 selection:bg-[#FD4912] selection:text-white">
      {/* Top Admin Navbar */}
      <header className="admin-header border-b border-[#090909]/10 bg-white/95 backdrop-blur-md sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 space-y-3">
          {/* Top Row: Brand & Actions */}
          <div className="flex items-center justify-between gap-3">
            {/* Logo / Title */}
            <div className="flex items-center gap-3">
              <div
                onClick={onNavigateHome}
                className="admin-header-logo flex-shrink-0 cursor-pointer transition-transform hover:scale-[1.03]"
                title={t('admin.header.view_site', 'Ver Site Público')}
              >
                <ParkLogo size="sm" />
              </div>
              <div className="h-8 w-px bg-[#090909]/15 hidden sm:block" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="admin-header-title font-bold text-sm uppercase tracking-tight text-[#090909]">
                    {t('admin.header.title', 'Painel de Controle')}
                  </span>
                  <span className="admin-header-badge px-2 py-0.5 rounded-md bg-[#E4141B]/10 text-[#E4141B] text-[10px] font-bold uppercase tracking-wider border border-[#E4141B]/20">
                    {t('admin.header.subtitle', 'Gestão do Parque')}
                  </span>
                </div>
                <p className="admin-header-subtitle text-[11px] text-[#090909]/60">
                  {t('admin.tabs.tickets', 'Ingressos')}, {t('admin.tabs.party_bookings', 'Festas')}, {t('admin.tabs.menu_orders', 'Pedidos')} & {t('admin.tabs.menu', 'Cardápio')}
                </p>
              </div>
            </div>

            {/* Top Right Actions (Language + Site + Logout) */}
            <div className="flex items-center gap-2 sm:gap-3">
              <AdminLanguageSelector />

              {onNavigateHome && (
                <button
                  onClick={onNavigateHome}
                  className="btn-press admin-btn-site flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-[#F9F3F1] hover:bg-[#F9F3F1]/80 text-[#090909] border border-[#090909]/10 transition-colors cursor-pointer font-medium touch-target-min"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#090909]/70" />
                  <span className="hidden sm:inline">{t('admin.header.view_site', 'Ver Site Público')}</span>
                  <span className="sm:hidden">{t('admin.header.site_short', 'Site')}</span>
                </button>
              )}

              <button
                id="admin-logout-btn"
                onClick={handleLogoutClick}
                className="btn-press admin-btn-logout flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold transition-colors cursor-pointer touch-target-min"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t('admin.header.logout', 'Sair')}</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs (Full Width, all 7 tabs visible) */}
          <nav id="admin-tabs-nav" className="admin-tabs-bar flex items-center gap-2 p-1.5 rounded-xl bg-white border border-[#090909]/10 overflow-x-auto elevation-1">
            {/* Tab 1: Ingressos */}
            <button
              id="admin-tab-tickets"
              data-active={activeTab === 'tickets'}
              onClick={() => setActiveTab('tickets')}
              className={`btn-press admin-tab-btn flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer touch-target-min ${
                activeTab === 'tickets'
                  ? 'admin-tab-active bg-[#FD4912] text-white shadow-sm'
                  : 'admin-tab-inactive text-[#090909] hover:text-[#134FA0] hover:bg-slate-100'
              }`}
            >
              <Ticket className="w-4 h-4" />
              <span>{t('admin.tabs.tickets', 'Ingressos')}</span>
            </button>

            {/* Tab 2: Reservas de Festa */}
            <button
              id="admin-tab-party-bookings"
              data-active={activeTab === 'party_bookings'}
              onClick={() => setActiveTab('party_bookings')}
              className={`btn-press admin-tab-btn flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer touch-target-min ${
                activeTab === 'party_bookings'
                  ? 'admin-tab-active bg-[#FD4912] text-white shadow-sm'
                  : 'admin-tab-inactive text-[#090909] hover:text-[#134FA0] hover:bg-slate-100'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              <span>{t('admin.tabs.party_bookings', 'Reservas de Festa')}</span>
            </button>

            {/* Tab 3: Calendário de Festas */}
            <button
              id="admin-tab-party-calendar"
              data-active={activeTab === 'party_calendar'}
              onClick={() => setActiveTab('party_calendar')}
              className={`btn-press admin-tab-btn flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer touch-target-min ${
                activeTab === 'party_calendar'
                  ? 'admin-tab-active bg-[#FD4912] text-white shadow-sm'
                  : 'admin-tab-inactive text-[#090909] hover:text-[#134FA0] hover:bg-slate-100'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>{t('admin.tabs.party_calendar', 'Calendário de Festas')}</span>
            </button>

            {/* Tab 4: Pedidos do Cardápio */}
            <button
              id="admin-tab-menu-orders"
              data-active={activeTab === 'menu_orders'}
              onClick={() => setActiveTab('menu_orders')}
              className={`btn-press admin-tab-btn flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer touch-target-min ${
                activeTab === 'menu_orders'
                  ? 'admin-tab-active bg-[#FD4912] text-white shadow-sm'
                  : 'admin-tab-inactive text-[#090909] hover:text-[#134FA0] hover:bg-slate-100'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{t('admin.tabs.menu_orders', 'Pedidos do Cardápio')}</span>
            </button>

            {/* Tab 5: Pacotes de Ingresso */}
            <button
              id="admin-tab-ticket-packages"
              data-active={activeTab === 'ticket_packages'}
              onClick={() => setActiveTab('ticket_packages')}
              className={`btn-press admin-tab-btn flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer touch-target-min ${
                activeTab === 'ticket_packages'
                  ? 'admin-tab-active bg-[#FD4912] text-white shadow-sm'
                  : 'admin-tab-inactive text-[#090909] hover:text-[#134FA0] hover:bg-slate-100'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>{t('admin.tabs.ticket_packages', 'Pacotes de Ingresso')}</span>
            </button>

            {/* Tab 6: Pacotes de Festa */}
            <button
              id="admin-tab-party-packages"
              data-active={activeTab === 'party_packages'}
              onClick={() => setActiveTab('party_packages')}
              className={`btn-press admin-tab-btn flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer touch-target-min ${
                activeTab === 'party_packages'
                  ? 'admin-tab-active bg-[#FD4912] text-white shadow-sm'
                  : 'admin-tab-inactive text-[#090909] hover:text-[#134FA0] hover:bg-slate-100'
              }`}
            >
              <PartyPopper className="w-4 h-4" />
              <span>{t('admin.tabs.party_packages', 'Pacotes de Festa')}</span>
            </button>

            {/* Tab 7: Cardápio */}
            <button
              id="admin-tab-menu"
              data-active={activeTab === 'menu'}
              onClick={() => setActiveTab('menu')}
              className={`btn-press admin-tab-btn flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer touch-target-min ${
                activeTab === 'menu'
                  ? 'admin-tab-active bg-[#FD4912] text-white shadow-sm'
                  : 'admin-tab-inactive text-[#090909] hover:text-[#134FA0] hover:bg-slate-100'
              }`}
            >
              <UtensilsCrossed className="w-4 h-4" />
              <span>{t('admin.tabs.menu', 'Cardápio')}</span>
            </button>

            {/* Tab 8: Home & Configurações */}
            <button
              id="admin-tab-site-settings"
              data-active={activeTab === 'site_settings'}
              onClick={() => setActiveTab('site_settings')}
              className={`btn-press admin-tab-btn flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer touch-target-min ${
                activeTab === 'site_settings'
                  ? 'admin-tab-active bg-[#FD4912] text-white shadow-sm'
                  : 'admin-tab-inactive text-[#090909] hover:text-[#134FA0] hover:bg-slate-100'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>{t('admin.tabs.site_settings', 'Home & Configurações')}</span>
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

        {activeTab === 'party_calendar' && (
          <AdminPartyCalendarTab onSessionExpired={handleSessionExpired} />
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

        {activeTab === 'site_settings' && (
          <AdminSiteSettingsTab onSessionExpired={handleSessionExpired} />
        )}
      </main>
    </div>
  );
}

export default function AdminDashboard(props: AdminDashboardProps) {
  return (
    <AdminLanguageProvider>
      <AdminDashboardContent {...props} />
    </AdminLanguageProvider>
  );
}
