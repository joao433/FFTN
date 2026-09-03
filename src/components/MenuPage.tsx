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
  AlertCircle,
  Loader2,
  Ticket,
  ArrowRight,
  Sparkles,
  Tag,
  X,
  ChevronRight,
  Flame,
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
}: MenuPageProps) {
  const [categories, setCategories] = useState<MenuCategoryModel[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('all');

  // Cart State (In-memory)
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  // Customer Details Form State
  const [holderName, setHolderName] = useState('');
  const [holderEmail, setHolderEmail] = useState('');
  const [holderPhone, setHolderPhone] = useState('');

  // Submission & Error State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Image load error fallbacks
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

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

  // Lock background scroll when mobile cart drawer is open
  useEffect(() => {
    if (isMobileCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileCartOpen]);

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

  // Render a Single Dish Card in Delivery App Style
  const renderDishCard = (item: MenuItemModel) => {
    const hasPromo =
      item.promoPriceCents !== null &&
      item.promoPriceCents !== undefined &&
      item.promoPriceCents > 0;
    const inCartQty = cart[item.id]?.quantity || 0;
    const isImageBroken = imageErrors[item.id];
    const showImage = !!item.imageUrl && !isImageBroken;

    return (
      <div
        key={item.id}
        id={`menu-item-${item.id}`}
        className={`rounded-2xl bg-[#0f1015] border transition-all overflow-hidden flex flex-col justify-between group hover:border-white/20 ${
          inCartQty > 0
            ? 'border-[#89CFF0]/70 ring-1 ring-[#89CFF0]/30 shadow-lg shadow-black/60'
            : 'border-white/[0.08] hover:shadow-xl hover:shadow-black/50'
        }`}
      >
        <div>
          {/* Dish Image - Protagonist of the card */}
          <div className="relative aspect-[16/10] w-full bg-neutral-900 overflow-hidden select-none">
            {showImage ? (
              <img
                src={item.imageUrl!}
                alt={item.name}
                onError={() =>
                  setImageErrors((prev) => ({ ...prev, [item.id]: true }))
                }
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                referrerPolicy="no-referrer"
                loading="lazy"
              />
            ) : (
              /* Neutral Visual Placeholder */
              <div className="w-full h-full bg-gradient-to-br from-neutral-850 via-[#14151d] to-[#0f1015] flex flex-col items-center justify-center text-neutral-500 gap-2 p-4 text-center group-hover:scale-105 transition-transform duration-500">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-neutral-400 shadow-inner">
                  <Utensils className="w-6 h-6 stroke-[1.5]" />
                </div>
                <div className="flex items-center gap-1 text-[11px] font-medium tracking-wider uppercase text-neutral-400">
                  <Flame className="w-3 h-3 text-[#89CFF0]" />
                  <span>Family Fun Town</span>
                </div>
              </div>
            )}

            {/* Subtle Gradient Shadow on Image Bottom for Legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f1015] via-transparent to-black/30 pointer-events-none" />

            {/* Floating Top Badges */}
            <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none gap-2">
              {hasPromo ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#89CFF0] text-black text-[10px] font-black uppercase tracking-wider shadow-md">
                  <Tag className="w-2.5 h-2.5 stroke-[2.5]" />
                  <span>Promoção</span>
                </span>
              ) : (
                <span />
              )}

              {inCartQty > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/85 backdrop-blur-md border border-[#89CFF0]/60 text-[#89CFF0] text-[11px] font-bold shadow-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#89CFF0]" />
                  <span>{inCartQty} no pedido</span>
                </span>
              )}
            </div>
          </div>

          {/* Dish Details */}
          <div className="p-4 sm:p-5">
            <h3 className="font-bold text-base sm:text-lg text-white group-hover:text-[#89CFF0] transition-colors leading-snug line-clamp-1">
              {item.name}
            </h3>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1.5 leading-relaxed line-clamp-2 min-h-[2.5rem]">
              {item.description || 'Delicioso item preparado na hora com ingredientes frescos e selecionados.'}
            </p>
          </div>
        </div>

        {/* Bottom Price & Add to Cart Controls */}
        <div className="p-4 sm:p-5 pt-0 mt-auto">
          <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between gap-3">
            {/* Price Display */}
            <div className="flex flex-col">
              {hasPromo ? (
                <>
                  <span className="text-[11px] text-neutral-500 line-through font-mono leading-none">
                    {formatUsdPrice(item.priceCents)}
                  </span>
                  <span className="text-lg font-black text-[#89CFF0] tracking-tight font-mono leading-tight mt-0.5">
                    {formatUsdPrice(item.promoPriceCents!)}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-[10px] text-neutral-400 uppercase font-semibold tracking-wider leading-none">
                    Preço
                  </span>
                  <span className="text-lg font-black text-white tracking-tight font-mono leading-tight mt-0.5">
                    {formatUsdPrice(item.priceCents)}
                  </span>
                </>
              )}
            </div>

            {/* Action Button: Stepper or "+ Adicionar" with comfortable touch area */}
            {inCartQty > 0 ? (
              <div className="flex items-center gap-1 bg-black/70 border border-[#89CFF0]/50 rounded-full p-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => updateQuantity(item.id, -1)}
                  className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.15] text-white flex items-center justify-center transition-colors cursor-pointer active:scale-90"
                  title="Diminuir quantidade"
                  aria-label={`Diminuir quantidade de ${item.name}`}
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-6 text-center text-xs font-black text-white font-mono">
                  {inCartQty}
                </span>
                <button
                  type="button"
                  onClick={() => updateQuantity(item.id, 1)}
                  className="w-8 h-8 rounded-full bg-[#89CFF0] text-black hover:bg-[#70BAE0] flex items-center justify-center transition-colors cursor-pointer active:scale-90"
                  title="Aumentar quantidade"
                  aria-label={`Aumentar quantidade de ${item.name}`}
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => addToCart(item)}
                className="min-h-[44px] px-4 rounded-full bg-[#89CFF0] hover:bg-[#70BAE0] active:scale-95 text-black text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md shadow-[#89CFF0]/20 cursor-pointer"
                aria-label={`Adicionar ${item.name} ao pedido`}
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Adicionar</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Reusable Order & Checkout Form Panel
  const renderOrderPanel = (idPrefix: string, isDrawer = false) => {
    return (
      <div className="rounded-2xl bg-[#0f1015] border border-white/[0.08] p-5 sm:p-6 shadow-2xl relative overflow-hidden flex flex-col">
        {/* Panel Header */}
        <div className="border-b border-white/[0.08] pb-4 mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#89CFF0]/10 border border-[#89CFF0]/20 flex items-center justify-center text-[#89CFF0]">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-neutral-100">
                Seu Pedido
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                {totalItemsCount === 0
                  ? 'Nenhum item adicionado'
                  : `${totalItemsCount} ${totalItemsCount === 1 ? 'item na sacola' : 'itens na sacola'}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {totalItemsCount > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="text-[11px] text-neutral-400 hover:text-red-400 transition-colors uppercase font-bold flex items-center gap-1 cursor-pointer px-2 py-1 rounded-lg hover:bg-white/[0.05]"
              >
                <Trash2 className="w-3 h-3" />
                <span>Limpar</span>
              </button>
            )}

            {isDrawer && (
              <button
                type="button"
                onClick={() => setIsMobileCartOpen(false)}
                className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.15] text-neutral-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Global Validation / Error Banner */}
        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-950/80 border border-red-800/80 text-red-200 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong className="block font-bold text-red-300">Falha ao criar pedido</strong>
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Cart Items List */}
        <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1 mb-5 scrollbar-thin">
          {cartEntries.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-white/[0.08] rounded-xl bg-black/20">
              <Utensils className="w-7 h-7 text-neutral-600 mx-auto mb-2" />
              <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                Sua sacola está vazia. Toque em <strong className="text-neutral-200">+ Adicionar</strong> nos itens do cardápio para montar seu pedido.
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
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {item.imageUrl && !imageErrors[item.id] ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-white/[0.06]"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center flex-shrink-0 text-neutral-500 border border-white/[0.06]">
                        <Utensils className="w-4 h-4 text-neutral-400" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-white truncate text-xs sm:text-sm">
                        {item.name}
                      </h4>
                      <div className="text-[11px] text-neutral-400 font-mono">
                        {formatUsdPrice(unitPrice)} un.
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex items-center gap-1 bg-black/60 border border-white/[0.1] rounded-full p-0.5">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-6 h-6 rounded-full text-neutral-300 hover:text-white flex items-center justify-center cursor-pointer active:scale-90"
                        title="Diminuir"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-5 text-center font-bold text-white text-[11px] font-mono">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-6 h-6 rounded-full text-neutral-300 hover:text-white flex items-center justify-center cursor-pointer active:scale-90"
                        title="Aumentar"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <span className="font-black text-[#89CFF0] w-14 text-right font-mono text-xs sm:text-sm">
                      {formatUsdPrice(itemTotal)}
                    </span>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      className="text-neutral-500 hover:text-red-400 p-1.5 transition-colors cursor-pointer"
                      title="Remover item"
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
            <span>Dados do Titular</span>
          </div>

          {/* Field: Full Name */}
          <div>
            <label
              htmlFor={`${idPrefix}holder_name`}
              className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1.5"
            >
              Nome Completo *
            </label>
            <div className="relative">
              <input
                id={`${idPrefix}holder_name`}
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
              htmlFor={`${idPrefix}holder_email`}
              className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1.5"
            >
              E-mail *
            </label>
            <div className="relative">
              <input
                id={`${idPrefix}holder_email`}
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
              htmlFor={`${idPrefix}holder_phone`}
              className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1.5"
            >
              Telefone / WhatsApp *
            </label>
            <div className="relative">
              <input
                id={`${idPrefix}holder_phone`}
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
            <div className="text-2xl font-black text-white tracking-tight font-mono">
              {formatUsdPrice(totalCartCents)}
            </div>
          </div>

          {validationErrors.cart && (
            <p className="text-xs text-red-400 flex items-center gap-1.5 font-semibold bg-red-950/40 p-3 rounded-xl border border-red-900/50">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {validationErrors.cart}
            </p>
          )}

          {/* Submit Button */}
          <button
            id={`${idPrefix}submit_btn`}
            type="submit"
            disabled={isSubmitting || cartEntries.length === 0}
            className="w-full min-h-[48px] py-3.5 px-6 rounded-full bg-[#89CFF0] hover:bg-[#70BAE0] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-black text-xs sm:text-sm font-black tracking-tight transition-all shadow-md shadow-[#89CFF0]/20 flex items-center justify-center gap-2 group cursor-pointer"
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
    );
  };

  return (
    <div className="min-h-screen bg-[#07080b] text-neutral-100 font-sans selection:bg-[#89CFF0] selection:text-black pb-28 relative">
      {/* Dynamic Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-[#89CFF0]/[0.03] blur-[150px] rounded-full" />
        <div className="absolute top-1/2 -right-48 w-[600px] h-[600px] bg-neutral-800/10 blur-[180px] rounded-full" />
        <div className="absolute bottom-10 -left-48 w-[500px] h-[500px] bg-neutral-900/30 blur-[160px] rounded-full" />
      </div>

      {/* Top Navigation Bar */}
      <header className="relative z-30 border-b border-white/[0.06] bg-[#07080b]/90 backdrop-blur-xl sticky top-0 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div
            onClick={onNavigateToHome}
            className={`flex items-center gap-3 ${onNavigateToHome ? 'cursor-pointer group' : ''}`}
          >
            <div className="h-8 w-8 rounded-xl bg-[#89CFF0] flex items-center justify-center text-black font-black text-xs shadow-sm shadow-[#89CFF0]/20">
              <Utensils className="w-4 h-4 text-black stroke-[2.5]" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-white group-hover:text-[#89CFF0] transition-colors block leading-tight">
                Family Fun Town
              </span>
              <span className="text-[10px] text-neutral-400 font-medium tracking-wider uppercase hidden sm:block">
                Snack Bar & Delivery
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {onNavigateToHome && (
              <button
                type="button"
                onClick={onNavigateToHome}
                className="hidden sm:flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-neutral-300 hover:text-white border border-white/[0.08] font-semibold transition-all cursor-pointer"
              >
                <span>Início</span>
              </button>
            )}

            {onNavigateToTickets && (
              <button
                type="button"
                onClick={onNavigateToTickets}
                className="flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-neutral-300 hover:text-white border border-white/[0.08] font-medium transition-all cursor-pointer"
              >
                <Ticket className="w-3.5 h-3.5 text-neutral-400" />
                <span>Ingressos</span>
              </button>
            )}

            {onNavigateToParties && (
              <button
                type="button"
                onClick={onNavigateToParties}
                className="hidden xs:flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-neutral-300 hover:text-white border border-white/[0.08] font-medium transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-neutral-400" />
                <span>Festas</span>
              </button>
            )}

            <button
              type="button"
              className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-full bg-[#89CFF0] text-black font-extrabold tracking-tight shadow-sm shadow-[#89CFF0]/20"
            >
              <Utensils className="w-3.5 h-3.5 text-black stroke-[2.5]" />
              <span>Cardápio</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Intro */}
      <section className="relative z-10 pt-8 sm:pt-12 pb-6 px-4 sm:px-6 lg:px-8 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-neutral-400 tracking-wider uppercase mb-3 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08]">
          <span className="text-[#89CFF0]">#</span>
          <span>Gastronomia & Snack Bar Oficial</span>
        </div>

        <h1 className="text-2xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white leading-[1.1]">
          Cardápio do <span className="text-[#89CFF0]">Parque</span>
        </h1>

        <p className="mt-3 text-neutral-400 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
          Peça online para retirar rapidamente no balcão central de alimentação. Hambúrgueres artesanais, porções crocantes, bebidas e sobremesas.
        </p>
      </section>

      {/* Category Navigation - Delivery App Style Chips (Horizontally Scrollable & Sticky) */}
      <div className="sticky top-[57px] z-20 bg-[#07080b]/95 backdrop-blur-md py-3 border-y border-white/[0.06] mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none touch-pan-x select-none">
            {/* All items chip */}
            <button
              type="button"
              id="cat-chip-all"
              onClick={() => setSelectedCategoryTab('all')}
              className={`min-h-[40px] px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-2 border cursor-pointer ${
                selectedCategoryTab === 'all'
                  ? 'bg-[#89CFF0] text-black border-[#89CFF0] shadow-md shadow-[#89CFF0]/25 scale-[1.02]'
                  : 'bg-[#0f1015] hover:bg-[#15161f] text-neutral-300 hover:text-white border-white/[0.08]'
              }`}
            >
              <span>Todos os Itens</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                  selectedCategoryTab === 'all'
                    ? 'bg-black/20 text-black'
                    : 'bg-white/[0.08] text-neutral-400'
                }`}
              >
                {menuItems.length}
              </span>
            </button>

            {/* Specific category chips */}
            {categories.map((cat) => {
              const catCount = menuItems.filter((i) => i.categoryId === cat.id).length;
              const isSelected = selectedCategoryTab === cat.id;

              return (
                <button
                  key={cat.id}
                  id={`cat-chip-${cat.id}`}
                  type="button"
                  onClick={() => setSelectedCategoryTab(cat.id)}
                  className={`min-h-[40px] px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-2 border cursor-pointer ${
                    isSelected
                      ? 'bg-[#89CFF0] text-black border-[#89CFF0] shadow-md shadow-[#89CFF0]/25 scale-[1.02]'
                      : 'bg-[#0f1015] hover:bg-[#15161f] text-neutral-300 hover:text-white border-white/[0.08]'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                      isSelected
                        ? 'bg-black/20 text-black'
                        : 'bg-white/[0.08] text-neutral-400'
                    }`}
                  >
                    {catCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Layout: Dish Cards Grid (Left 7-8 cols) + Sticky Cart Panel (Right 4-5 cols) */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Left: Menu Items by Category */}
          <div className="lg:col-span-7 xl:col-span-7 space-y-10">
            {isLoading ? (
              <div className="p-16 rounded-2xl bg-[#0f1015] border border-white/[0.06] text-center flex flex-col items-center justify-center gap-3.5">
                <Loader2 className="w-8 h-8 text-[#89CFF0] animate-spin" />
                <span className="text-xs text-neutral-400 uppercase tracking-wider font-bold">
                  Carregando cardápio do parque...
                </span>
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="p-16 rounded-2xl bg-[#0f1015] border border-white/[0.06] text-center text-xs text-neutral-400 uppercase tracking-wider font-bold">
                Nenhum item encontrado nesta categoria.
              </div>
            ) : (
              filteredCategories.map((category) => {
                const categoryItems = menuItems.filter(
                  (item) => item.categoryId === category.id
                );
                if (categoryItems.length === 0) return null;

                return (
                  <section key={category.id} className="space-y-4">
                    {/* Category Title Header */}
                    <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#89CFF0]" />
                        <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-white">
                          {category.name}
                        </h2>
                      </div>
                      <span className="text-xs text-neutral-400 font-mono">
                        {categoryItems.length}{' '}
                        {categoryItems.length === 1 ? 'opção' : 'opções'}
                      </span>
                    </div>

                    {/* Responsive Dish Grid: 1 column stacked on mobile, 2 columns on tablet & desktop */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                      {categoryItems.map((item) => renderDishCard(item))}
                    </div>
                  </section>
                );
              })
            )}

            {/* On Mobile: Natural Bottom Order Panel if user scrolls all the way down */}
            <div id="order-checkout-section" className="block lg:hidden mt-8 scroll-mt-24">
              {renderOrderPanel('mobile_bottom_')}
            </div>
          </div>

          {/* Right: Desktop Sticky Order & Checkout Panel */}
          <div className="hidden lg:block lg:col-span-5 xl:col-span-5">
            <div className="sticky top-24">
              {renderOrderPanel('desktop_')}
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Floating Sticky Bottom Bar (Delivery-app style "Ver Sacola / Carrinho") */}
      {totalItemsCount > 0 && !isMobileCartOpen && (
        <div className="fixed bottom-0 inset-x-0 z-40 p-3 sm:p-4 bg-gradient-to-t from-black via-black/95 to-transparent pb-safe lg:hidden">
          <button
            id="btn-open-mobile-cart"
            type="button"
            onClick={() => setIsMobileCartOpen(true)}
            className="w-full py-3.5 px-5 rounded-2xl bg-[#89CFF0] text-black font-black text-sm shadow-2xl shadow-black flex items-center justify-between active:scale-[0.98] transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-black text-[#89CFF0] flex items-center justify-center text-xs font-black">
                {totalItemsCount}
              </div>
              <div className="text-left">
                <span className="block font-black uppercase tracking-tight text-xs sm:text-sm leading-none">
                  Ver Sacola
                </span>
                <span className="text-[11px] text-neutral-800 font-medium">
                  {totalItemsCount === 1 ? '1 item adicionado' : `${totalItemsCount} itens adicionados`}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 font-mono font-black text-base">
              <span>{formatUsdPrice(totalCartCents)}</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </div>
          </button>
        </div>
      )}

      {/* Mobile Bottom Sheet Drawer for Cart & Checkout */}
      {isMobileCartOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            onClick={() => setIsMobileCartOpen(false)}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
          />

          {/* Slide-up Container */}
          <div className="absolute inset-x-0 bottom-0 max-h-[92vh] flex flex-col bg-[#0f1015] border-t border-white/15 rounded-t-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
            {/* Visual Drag Handle */}
            <div className="w-12 h-1.5 rounded-full bg-neutral-700 mx-auto my-2.5 flex-shrink-0" />

            {/* Scrollable Order Panel */}
            <div className="overflow-y-auto px-4 pb-8 pt-1">
              {renderOrderPanel('mobile_modal_', true)}
            </div>
          </div>
        </div>
      )}

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
