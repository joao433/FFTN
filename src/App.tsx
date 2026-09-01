import React, { useState, useEffect } from 'react';
import HomePage from './components/HomePage.tsx';
import TicketPurchase from './components/TicketPurchase.tsx';
import PartyBooking from './components/PartyBooking.tsx';
import MenuPage from './components/MenuPage.tsx';
import AdminLogin from './components/AdminLogin.tsx';
import AdminDashboard from './components/AdminDashboard.tsx';
import SuccessView from './components/SuccessView.tsx';
import CancelView from './components/CancelView.tsx';

type AppRoute = 'home' | 'tickets' | 'festas' | 'cardapio' | 'admin' | 'admin-dashboard' | 'sucesso' | 'cancelado';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>('home');

  useEffect(() => {
    // Detect route based on URL path or search query parameter
    const syncRouteFromUrl = () => {
      const pathname = window.location.pathname.toLowerCase();
      const search = window.location.search.toLowerCase();

      if (pathname.includes('/sucesso') || search.includes('page=sucesso') || search.includes('session_id=')) {
        setCurrentRoute('sucesso');
      } else if (pathname.includes('/cancelado') || search.includes('page=cancelado')) {
        setCurrentRoute('cancelado');
      } else if (pathname.includes('/admin/dashboard') || search.includes('page=admin-dashboard') || search.includes('page=admin/dashboard')) {
        setCurrentRoute('admin-dashboard');
      } else if (pathname.includes('/admin') || search.includes('page=admin')) {
        setCurrentRoute('admin');
      } else if (pathname.includes('/festas') || search.includes('page=festas')) {
        setCurrentRoute('festas');
      } else if (pathname.includes('/cardapio') || search.includes('page=cardapio')) {
        setCurrentRoute('cardapio');
      } else if (pathname.includes('/ingressos') || search.includes('page=ingressos') || search.includes('page=tickets')) {
        setCurrentRoute('tickets');
      } else {
        setCurrentRoute('home');
      }
    };

    syncRouteFromUrl();
    window.addEventListener('popstate', syncRouteFromUrl);
    return () => window.removeEventListener('popstate', syncRouteFromUrl);
  }, []);

  const navigateTo = (route: AppRoute) => {
    setCurrentRoute(route);
    let newPath = '/';
    if (route === 'tickets') newPath = '/ingressos';
    if (route === 'festas') newPath = '/festas';
    if (route === 'cardapio') newPath = '/cardapio';
    if (route === 'admin') newPath = '/admin';
    if (route === 'admin-dashboard') newPath = '/admin/dashboard';
    if (route === 'sucesso') newPath = '/sucesso';
    if (route === 'cancelado') newPath = '/cancelado';

    try {
      window.history.pushState({}, '', newPath);
    } catch {
      // Ignore if iframe prevents history API
    }
  };

  return (
    <div className="w-full min-h-screen bg-black">
      {/* Route Views */}
      {currentRoute === 'home' && (
        <HomePage
          onNavigateToTickets={() => navigateTo('tickets')}
          onNavigateToParties={() => navigateTo('festas')}
          onNavigateToMenu={() => navigateTo('cardapio')}
        />
      )}

      {currentRoute === 'tickets' && (
        <TicketPurchase
          onNavigateToHome={() => navigateTo('home')}
          onNavigateToParties={() => navigateTo('festas')}
          onNavigateToMenu={() => navigateTo('cardapio')}
        />
      )}

      {currentRoute === 'festas' && (
        <PartyBooking
          onNavigateToHome={() => navigateTo('home')}
          onNavigateToTickets={() => navigateTo('tickets')}
          onNavigateToMenu={() => navigateTo('cardapio')}
        />
      )}

      {currentRoute === 'cardapio' && (
        <MenuPage
          onNavigateToHome={() => navigateTo('home')}
          onNavigateToTickets={() => navigateTo('tickets')}
          onNavigateToParties={() => navigateTo('festas')}
        />
      )}

      {currentRoute === 'admin' && (
        <AdminLogin
          onLoginSuccess={() => navigateTo('admin-dashboard')}
          onNavigateHome={() => navigateTo('home')}
        />
      )}

      {currentRoute === 'admin-dashboard' && (
        <AdminDashboard
          onLogout={() => navigateTo('admin')}
          onNavigateHome={() => navigateTo('home')}
        />
      )}

      {currentRoute === 'sucesso' && (
        <SuccessView onNavigateHome={() => navigateTo('tickets')} />
      )}

      {currentRoute === 'cancelado' && (
        <CancelView onNavigateHome={() => navigateTo('tickets')} />
      )}
    </div>
  );
}
