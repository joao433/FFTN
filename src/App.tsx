import React, { useState, useEffect } from 'react';
import TicketPurchase from './components/TicketPurchase.tsx';
import PartyBooking from './components/PartyBooking.tsx';
import MenuPage from './components/MenuPage.tsx';
import SuccessView from './components/SuccessView.tsx';
import CancelView from './components/CancelView.tsx';

type AppRoute = 'tickets' | 'festas' | 'cardapio' | 'sucesso' | 'cancelado';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>('tickets');

  useEffect(() => {
    // Detect route based on URL path or search query parameter
    const syncRouteFromUrl = () => {
      const pathname = window.location.pathname.toLowerCase();
      const search = window.location.search.toLowerCase();

      if (pathname.includes('/sucesso') || search.includes('page=sucesso') || search.includes('session_id=')) {
        setCurrentRoute('sucesso');
      } else if (pathname.includes('/cancelado') || search.includes('page=cancelado')) {
        setCurrentRoute('cancelado');
      } else if (pathname.includes('/festas') || search.includes('page=festas')) {
        setCurrentRoute('festas');
      } else if (pathname.includes('/cardapio') || search.includes('page=cardapio')) {
        setCurrentRoute('cardapio');
      } else {
        setCurrentRoute('tickets');
      }
    };

    syncRouteFromUrl();
    window.addEventListener('popstate', syncRouteFromUrl);
    return () => window.removeEventListener('popstate', syncRouteFromUrl);
  }, []);

  const navigateTo = (route: AppRoute) => {
    setCurrentRoute(route);
    let newPath = '/';
    if (route === 'festas') newPath = '/festas';
    if (route === 'cardapio') newPath = '/cardapio';
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
      {currentRoute === 'tickets' && (
        <TicketPurchase
          onNavigateToParties={() => navigateTo('festas')}
          onNavigateToMenu={() => navigateTo('cardapio')}
        />
      )}

      {currentRoute === 'festas' && (
        <PartyBooking
          onNavigateToTickets={() => navigateTo('tickets')}
          onNavigateToMenu={() => navigateTo('cardapio')}
        />
      )}

      {currentRoute === 'cardapio' && (
        <MenuPage
          onNavigateToTickets={() => navigateTo('tickets')}
          onNavigateToParties={() => navigateTo('festas')}
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
