import React, { useState, useEffect } from 'react';
import {
  Utensils,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  User,
  Mail,
  Phone,
  ShieldCheck,
  Zap,
  Check,
  AlertCircle,
  Loader2,
  Clock,
  Flame,
  Ticket,
  PartyPopper,
  ArrowRight,
  Sparkles,
  Tag,
} from 'lucide-react';
import type { MenuCategoryModel, MenuItemModel } from '../types/database.ts';
import { fetchActiveMenuCategories, fetchActiveMenuItems } from '../lib/supabase.ts';
import Footer from './Footer.tsx';

interface MenuPageProps {
  onNavigateToHome?: () => void;
  onNavigateToTickets?: () => void;
  onNavigateToParties?: () => void;
  onNavigateToDocs?: () => void;
}

interface CartItem {
  item: MenuItemModel;
  quantity: number;
}

export default function MenuPage({
  onNavigateToHome,
  onNavigateToTickets,
  onNavigateToParties,
  onNavigateToDocs,
}: MenuPageProps) {
  const [categories, setCategories] = useState<MenuCategoryModel[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('all');

  // Cart State (In-memory)
  const [cart, setCart] = useState<Record<string, CartItem>>({});

  // Customer Details Form State
  const [holderName, setHolderName] = useState('');
  const [holderEmail, setHolderEmail] = useState('');
  const [holderPhone, setHolderPhone] = useState('');

  // Submission & Error State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [cats, items] = await Promise.all([
          fetchActiveMenuCategories(),
          fetchActiveMenuItems(),
        ]);
        setCategories(cats);
        setMenuItems(items);
      } catch (err) {
        console.error('Error loading menu:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const formatUsdPrice = (priceCents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(priceCents / 100);
  };

  // Helper to get effective price of an item (promo if present, otherwise regular)
  const getEffectivePriceCents = (item: MenuItemModel) => {
    if (item.promoPriceCents !== null && item.promoPriceCents !== undefined && item.promoPriceCents > 0) {
      return item.promoPriceCents;
    }
    return item.priceCents;
  };

  // Cart operations
  const addToCart = (item: MenuItemModel) => {
    setCart((prev) => {
      const existing = prev[item.id];
      const nextQty = existing ? existing.quantity + 1 : 1;
      return {
        ...prev,
        [item.id]: {
          item,
          quantity: nextQty,
        },
      };
    });
    setValidationErrors((prev) => ({ ...prev, cart: '' }));
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart((prev) => {
      const existing = prev[itemId];
      if (!existing) return prev;

      const newQty = existing.quantity + delta;
      if (newQty <= 0) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }

      return {
        ...prev,
        [itemId]: {
          ...existing,
          quantity: newQty,
        },
      };
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  };

  const clearCart = () => {
    setCart({});
  };

  // Cart calculations
  const cartEntries: CartItem[] = Object.values(cart);
  const totalItemsCount = cartEntries.reduce((sum: number, entry: CartItem) => sum + entry.quantity, 0);
  const totalCartCents = cartEntries.reduce((sum: number, entry: CartItem) => {
    return sum + getEffectivePriceCents(entry.item) * entry.quantity;
  }, 0);

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (cartEntries.length === 0) {
      errors.cart = 'Adicione pelo menos um item ao seu carrinho antes de finalizar.';
    }
    if (!holderName.trim()) {
      errors.name = 'Informe o nome do titular para o pedido.';
    }
    if (!holderEmail.trim() || !holderEmail.includes('@')) {
      errors.email = 'Informe um e-mail válido para receber a confirmação.';
    }
    if (!holderPhone.trim() || holderPhone.replace(/\D/g, '').length < 8) {
      errors.phone = 'Informe um telefone para contato.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const formattedItems = cartEntries.map((entry) => ({
        menu_item_id: entry.item.id,
        quantity: entry.quantity,
      }));

      const response = await fetch('/.netlify/functions/create-menu-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          holder_name: holderName.trim(),
          holder_email: holderEmail.trim().toLowerCase(),
          holder_phone: holderPhone.trim(),
          items: formattedItems,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error ||
            'Não foi possível criar o pedido no momento. Por favor, tente novamente.'
        );
      }

      if (data.url) {
        // Redireciona para o checkout oficial do Stripe
        window.location.href = data.url;
      } else {
        throw new Error('URL de checkout não retornada pelo servidor.');
      }
    } catch (err: unknown) {
      console.error('[Menu Checkout Error]:', err);
      const message =
        err instanceof Error
          ? err.message
          : 'Ocorreu um erro ao conectar com o serviço de pagamento. Tente novamente.';
      setErrorMessage(message);
      setIsSubmitting(false);
    }
  };

  // Filter items according to active tab
  const filteredCategories =
    selectedCategoryTab === 'all'
      ? categories
      : categories.filter((c) => c.id === selectedCategoryTab);

  return (
    <div className="min-h-screen bg-[#07080b] text-neutral-100 font-sans selection:bg-[#89CFF0] selection:text-black pb-24 relative">
      {/* Dynamic Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-[#89CFF0]/[0.03] blur-[150px] rounded-full" />
        <div className="absolute top-1/2 -right-48 w-[600px] h-[600px] bg-neutral-800/10 blur-[180px] rounded-full" />
        <div className="absolute bottom-10 -left-48 w-[500px] h-[500px] bg-neutral-900/30 blur-[160px] rounded-full" />
      </div>

      {/* Top Navigation Bar */}
      <header className="relative z-20 border-b border-white/[0.06] bg-[#07080b]/90 backdrop-blur-xl sticky top-0 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div 
            onClick={onNavigateToHome}
            className={`flex items-center gap-3 ${onNavigateToHome ? 'cursor-pointer group' : ''}`}
          >
            <div className="h-7 w-7 rounded-lg bg-[#89CFF0] flex items-center justify-center text-black font-black text-xs shadow-sm shadow-[#89CFF0]/20">
              <Utensils className="w-4 h-4 text-black stroke-[2.5]" />
            </div>
            <span className="font-extrabold text-base tracking-tight text-white group-hover:text-[#89CFF0] transition-colors">
              Family Fun Town
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {onNavigateToHome && (
              <button
                onClick={onNavigateToHome}
                className="hidden sm:flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-neutral-300 hover:text-white border border-white/[0.08] font-semibold transition-all cursor-pointer"
              >
                <span>Início</span>
              </button>
            )}

            {onNavigateToTickets && (
              <button
                onClick={onNavigateToTickets}
                className="flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-neutral-300 hover:text-white border border-white/[0.08] font-medium transition-all cursor-pointer"
              >
                <Ticket className="w-3.5 h-3.5 text-neutral-400" />
                <span>Ingressos</span>
              </button>
            )}

            {onNavigateToParties && (
              <button
                onClick={onNavigateToParties}
                className="flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-neutral-300 hover:text-white border border-white/[0.08] font-medium transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-neutral-400" />
                <span>Festas</span>
              </button>
            )}

            <button
              className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-full bg-[#89CFF0] text-black font-bold tracking-tight shadow-sm shadow-[#89CFF0]/20"
            >
              <Utensils className="w-3.5 h-3.5 text-black stroke-[2.5]" />
              <span>Cardápio</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="relative z-10 pt-12 sm:pt-16 pb-10 sm:pb-12 px-4 sm:px-6 lg:px-8 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-neutral-400 tracking-wider uppercase mb-4">
          <span className="text-[#89CFF0]">#</span> GASTRONOMIA & SNACK BAR
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight text-white leading-[1.05]">
          Cardápio Oficial do <span className="text-[#89CFF0]">Parque</span>
        </h1>

        <p className="mt-4 sm:mt-5 text-neutral-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          Hambúrgueres artesanais, porções crocantes, sobremesas exclusivas e bebidas geladas para recarregar a energia entre as atrações.
        </p>

        {/* Category Tabs Filter */}
        <div className="mt-8 flex items-center justify-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategoryTab('all')}
            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap border ${
              selectedCategoryTab === 'all'
                ? 'bg-[#89CFF0] text-black border-[#89CFF0] shadow-sm shadow-[#89CFF0]/20'
                : 'bg-white/[0.04] hover:bg-white/[0.08] text-neutral-400 hover:text-white border-white/[0.08]'
            }`}
          >
            Todos os Itens
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryTab(cat.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap border ${
                selectedCategoryTab === cat.id
                  ? 'bg-[#89CFF0] text-black border-[#89CFF0] shadow-sm shadow-[#89CFF0]/20'
                  : 'bg-white/[0.04] hover:bg-white/[0.08] text-neutral-400 hover:text-white border-white/[0.08]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </section>

      {/* Main Content Grid: Menu Items (Left) + Cart & Checkout Form (Right) */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-2 sm:mt-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Left Column: Menu Items by Category (7 cols) */}
          <div className="lg:col-span-7 space-y-8">
            {isLoading ? (
              <div className="p-16 rounded-2xl bg-[#0f1015] border border-white/[0.06] text-center flex flex-col items-center justify-center gap-3.5">
                <Loader2 className="w-7 h-7 text-[#89CFF0] animate-spin" />
                <span className="text-xs text-neutral-400 uppercase tracking-wider font-bold">
                  Carregando cardápio do parque...
                </span>
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="p-16 rounded-2xl bg-[#0f1015] border border-white/[0.06] text-center text-xs text-neutral-400 uppercase tracking-wider font-bold">
                Nenhum item disponível no momento.
              </div>
            ) : (
              filteredCategories.map((category) => {
                const categoryItems = menuItems.filter(
                  (item) => item.categoryId === category.id
                );
                if (categoryItems.length === 0) return null;

                return (
                  <section key={category.id} className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-white/[0.08] pb-2">
                      <div className="w-2 h-2 rounded-full bg-[#89CFF0]" />
                      <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-200">
                        {category.name}
                      </h2>
                      <span className="text-[11px] text-neutral-500 font-mono ml-auto">
                        {categoryItems.length} {categoryItems.length === 1 ? 'item' : 'itens'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {categoryItems.map((item) => {
                        const hasPromo =
                          item.promoPriceCents !== null &&
                          item.promoPriceCents !== undefined &&
                          item.promoPriceCents > 0;
                        const inCartQty = cart[item.id]?.quantity || 0;

                        return (
                          <div
                            key={item.id}
                            id={`menu-item-${item.id}`}
                            className={`rounded-2xl p-4 sm:p-5 transition-all border relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                              inCartQty > 0
                                ? 'bg-[#0f1015] border-[#89CFF0] ring-1 ring-[#89CFF0]/30 shadow-lg shadow-black/50'
                                : 'bg-[#0f1015] hover:bg-[#14151c] border-white/[0.06] hover:border-white/15'
                            }`}
                          >
                            <div className="flex items-start sm:items-center gap-3.5 flex-1 pr-2">
                              {item.imageUrl && (
                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-white/[0.08] bg-black/40 flex-shrink-0">
                                  <img
                                    src={item.imageUrl}
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                              )}
                              <div className="space-y-1.5 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-bold text-sm sm:text-base text-white tracking-tight">
                                    {item.name}
                                  </h3>
                                  {hasPromo && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#89CFF0]/15 border border-[#89CFF0]/30 text-[#89CFF0] text-[10px] font-bold uppercase tracking-wider">
                                      <Tag className="w-2.5 h-2.5" /> Promoção
                                    </span>
                                  )}
                                </div>
                                {item.description && (
                                  <p className="text-xs text-neutral-400 leading-relaxed max-w-lg">
                                    {item.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-white/[0.06] pt-3 sm:pt-0 flex-shrink-0">
                              {/* Price display with promo if available */}
                              <div className="sm:text-right">
                                {hasPromo ? (
                                  <div>
                                    <div className="text-lg font-black text-[#89CFF0] tracking-tight">
                                      {formatUsdPrice(item.promoPriceCents!)}
                                    </div>
                                    <div className="text-[11px] text-neutral-500 line-through">
                                      {formatUsdPrice(item.priceCents)}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-lg font-black text-white tracking-tight">
                                    {formatUsdPrice(item.priceCents)}
                                  </div>
                                )}
                              </div>

                              {/* Add / Quantity Control */}
                              {inCartQty > 0 ? (
                                <div className="flex items-center gap-1.5 bg-black/60 border border-[#89CFF0]/50 rounded-full p-1">
                                  <button
                                    onClick={() => updateQuantity(item.id, -1)}
                                    className="w-7 h-7 rounded-full bg-white/[0.05] hover:bg-white/[0.15] text-white flex items-center justify-center transition-colors cursor-pointer"
                                    title="Diminuir"
                                  >
                                    <Minus className="w-3.5 h-3.5" />
                                  </button>
                                  <span className="w-6 text-center text-xs font-black text-white">
                                    {inCartQty}
                                  </span>
                                  <button
                                    onClick={() => updateQuantity(item.id, 1)}
                                    className="w-7 h-7 rounded-full bg-[#89CFF0] text-black flex items-center justify-center transition-colors cursor-pointer"
                                    title="Aumentar"
                                  >
                                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => addToCart(item)}
                                  className="py-2 px-4 rounded-full bg-[#89CFF0] hover:bg-[#70BAE0] text-black text-xs font-bold tracking-tight transition-all flex items-center gap-1.5 shadow-sm shadow-[#89CFF0]/20 cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                                  <span>Adicionar</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })
            )}

            {validationErrors.cart && (
              <p className="text-xs text-red-400 flex items-center gap-1.5 font-semibold bg-red-950/40 p-3 rounded-xl border border-red-900/50">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {validationErrors.cart}
              </p>
            )}
          </div>

          {/* Right Column: Cart Panel & Customer Form (5 cols) */}
          <div className="lg:col-span-5">
            <div className="sticky top-20">
              <div className="rounded-2xl bg-[#0f1015] border border-white/[0.08] p-6 sm:p-7 shadow-2xl relative overflow-hidden">
                {/* Cart Panel Header */}
                <div className="border-b border-white/[0.08] pb-4 mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-200 flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4 text-[#89CFF0]" />
                      Seu Pedido
                    </h2>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {totalItemsCount === 0
                        ? 'O carrinho está vazio'
                        : `${totalItemsCount} ${totalItemsCount === 1 ? 'item selecionado' : 'itens selecionados'}`}
                    </p>
                  </div>

                  {totalItemsCount > 0 && (
                    <button
                      onClick={clearCart}
                      className="text-[11px] text-neutral-400 hover:text-red-400 transition-colors uppercase font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Limpar</span>
                    </button>
                  )}
                </div>

                {/* Error Banner */}
                {errorMessage && (
                  <div className="mb-5 p-4 rounded-xl bg-red-950/80 border border-red-800/80 text-red-200 text-xs flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <strong className="block font-bold text-red-300">Falha ao criar pedido</strong>
                      <span className="leading-relaxed">{errorMessage}</span>
                    </div>
                  </div>
                )}

                {/* Cart Items List */}
                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1 mb-5">
                  {cartEntries.length === 0 ? (
                    <div className="py-6 text-center border border-dashed border-white/[0.08] rounded-xl">
                      <Utensils className="w-6 h-6 text-neutral-600 mx-auto mb-2" />
                      <p className="text-xs text-neutral-400">
                        Clique em <strong className="text-neutral-300">+ Adicionar</strong> nos itens do cardápio para montar seu pedido.
                      </p>
                    </div>
                  ) : (
                    cartEntries.map(({ item, quantity }) => {
                      const unitPrice = getEffectivePriceCents(item);
                      const itemTotal = unitPrice * quantity;

                      return (
                        <div
                          key={item.id}
                          className="p-3 rounded-xl bg-black/40 border border-white/[0.08] flex items-center justify-between text-xs gap-3"
                        >
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-white truncate">
                              {item.name}
                            </h4>
                            <div className="text-[11px] text-neutral-400">
                              {formatUsdPrice(unitPrice)} un.
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="flex items-center gap-1 bg-black/60 border border-white/[0.1] rounded-full p-0.5">
                              <button
                                onClick={() => updateQuantity(item.id, -1)}
                                className="w-5 h-5 rounded-full text-neutral-300 hover:text-white flex items-center justify-center cursor-pointer"
                              >
                                <Minus className="w-2.5 h-2.5" />
                              </button>
                              <span className="w-4 text-center font-bold text-white text-[11px]">
                                {quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, 1)}
                                className="w-5 h-5 rounded-full text-neutral-300 hover:text-white flex items-center justify-center cursor-pointer"
                              >
                                <Plus className="w-2.5 h-2.5" />
                              </button>
                            </div>

                            <span className="font-black text-[#89CFF0] w-14 text-right">
                              {formatUsdPrice(itemTotal)}
                            </span>

                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="text-neutral-500 hover:text-red-400 p-1 transition-colors cursor-pointer"
                              title="Remover"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Customer Details Form */}
                <form onSubmit={handleCheckout} className="space-y-4 border-t border-white/[0.08] pt-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#89CFF0]" />
                    Dados do Titular
                  </div>

                  {/* Field: Full Name */}
                  <div>
                    <label
                      htmlFor="menu_holder_name"
                      className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1.5"
                    >
                      Nome Completo *
                    </label>
                    <div className="relative">
                      <input
                        id="menu_holder_name"
                        type="text"
                        placeholder="Ex: Carlos Eduardo"
                        value={holderName}
                        onChange={(e) => {
                          setHolderName(e.target.value);
                          setValidationErrors((prev) => ({ ...prev, name: '' }));
                        }}
                        className={`w-full px-4 py-3 pl-10 rounded-xl bg-black/50 border text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-1 transition-all ${
                          validationErrors.name
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-white/[0.1] focus:border-[#89CFF0] focus:ring-[#89CFF0]'
                        }`}
                      />
                      <User className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3.5 pointer-events-none" />
                    </div>
                    {validationErrors.name && (
                      <p className="text-[11px] text-red-400 mt-1 font-medium">{validationErrors.name}</p>
                    )}
                  </div>

                  {/* Field: Email */}
                  <div>
                    <label
                      htmlFor="menu_holder_email"
                      className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1.5"
                    >
                      E-mail *
                    </label>
                    <div className="relative">
                      <input
                        id="menu_holder_email"
                        type="email"
                        placeholder="carlos@exemplo.com"
                        value={holderEmail}
                        onChange={(e) => {
                          setHolderEmail(e.target.value);
                          setValidationErrors((prev) => ({ ...prev, email: '' }));
                        }}
                        className={`w-full px-4 py-3 pl-10 rounded-xl bg-black/50 border text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-1 transition-all ${
                          validationErrors.email
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-white/[0.1] focus:border-[#89CFF0] focus:ring-[#89CFF0]'
                        }`}
                      />
                      <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3.5 pointer-events-none" />
                    </div>
                    {validationErrors.email && (
                      <p className="text-[11px] text-red-400 mt-1 font-medium">{validationErrors.email}</p>
                    )}
                  </div>

                  {/* Field: Phone */}
                  <div>
                    <label
                      htmlFor="menu_holder_phone"
                      className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1.5"
                    >
                      Telefone / WhatsApp *
                    </label>
                    <div className="relative">
                      <input
                        id="menu_holder_phone"
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        value={holderPhone}
                        onChange={(e) => {
                          setHolderPhone(e.target.value);
                          setValidationErrors((prev) => ({ ...prev, phone: '' }));
                        }}
                        className={`w-full px-4 py-3 pl-10 rounded-xl bg-black/50 border text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-1 transition-all ${
                          validationErrors.phone
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-white/[0.1] focus:border-[#89CFF0] focus:ring-[#89CFF0]'
                        }`}
                      />
                      <Phone className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3.5 pointer-events-none" />
                    </div>
                    {validationErrors.phone && (
                      <p className="text-[11px] text-red-400 mt-1 font-medium">{validationErrors.phone}</p>
                    )}
                  </div>

                  {/* Total Order Summary */}
                  <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-neutral-400 uppercase font-bold block tracking-wider">
                        Total do Pedido
                      </span>
                      <span className="text-[11px] text-neutral-400">
                        Cobrança segura via Stripe (USD)
                      </span>
                    </div>
                    <div className="text-2xl font-black text-white tracking-tight">
                      {formatUsdPrice(totalCartCents)}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    id="submit-menu-order-btn"
                    type="submit"
                    disabled={isSubmitting || cartEntries.length === 0}
                    className="w-full py-3.5 px-6 rounded-full bg-[#89CFF0] hover:bg-[#70BAE0] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-black text-xs sm:text-sm font-bold tracking-tight transition-all shadow-md shadow-[#89CFF0]/20 flex items-center justify-center gap-2 group cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-black" />
                        <span>Processando Pedido...</span>
                      </>
                    ) : (
                      <>
                        <span>Finalizar Pedido Agora</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-4 pt-3.5 border-t border-white/[0.06] text-[11px] text-center text-neutral-400 flex items-center justify-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#89CFF0]" />
                  <span>Retirada rápida no balcão central de alimentação</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Global Footer */}
      <Footer
        onNavigateToHome={onNavigateToHome}
        onNavigateToTickets={onNavigateToTickets}
        onNavigateToParties={onNavigateToParties}
        onNavigateToMenu={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      />
    </div>
  );
}
