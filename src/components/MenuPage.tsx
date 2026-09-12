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
  Sandwich,
  CupSoda,
  IceCream,
  Pizza,
  Coffee,
  Layers,
} from 'lucide-react';
import type {
  MenuCategoryModel,
  MenuItemModel,
  MenuBannerModel,
  MenuItemVariation,
} from '../types/database.ts';
import {
  fetchActiveMenuCategories,
  fetchActiveMenuItems,
  fetchActiveMenuBanner,
  DEFAULT_MENU_BANNER,
} from '../lib/supabase.ts';
import { getApiUrl } from '../lib/api.ts';
import Footer from './Footer.tsx';
import ItemDetailModal from './ItemDetailModal.tsx';
import ParkLogo from './ParkLogo.tsx';
import SkeletonCard from './SkeletonCard.tsx';

interface MenuPageProps {
  onNavigateToHome?: () => void;
  onNavigateToTickets?: () => void;
  onNavigateToParties?: () => void;
  onNavigateToDocs?: () => void;
}

interface CartItem {
  item: MenuItemModel;
  quantity: number;
  variationName?: string;
  unitPriceCents?: number;
}

export default function MenuPage({
  onNavigateToHome,
  onNavigateToTickets,
  onNavigateToParties,
}: MenuPageProps) {
  const [categories, setCategories] = useState<MenuCategoryModel[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemModel[]>([]);
  const [bannerData, setBannerData] = useState<MenuBannerModel>(DEFAULT_MENU_BANNER);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('all');

  // Item Detail Modal State
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<MenuItemModel | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Cart State (In-memory)
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [isCartOpen, setIsCartOpen] = useState(false);

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
        const [cats, items, banner] = await Promise.all([
          fetchActiveMenuCategories(),
          fetchActiveMenuItems(),
          fetchActiveMenuBanner(),
        ]);
        setCategories(cats);
        setMenuItems(items);
        if (banner) {
          setBannerData(banner);
        }
      } catch (err) {
        console.error('Error loading menu:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Lock background scroll when cart modal is open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isCartOpen]);

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCartOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const formatUsdPrice = (priceCents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(priceCents / 100);
  };

  // Helper to map category name to delivery-style icons
  const getCategoryIcon = (categoryName?: string) => {
    if (!categoryName) return Utensils;
    const lower = categoryName.toLowerCase();
    if (
      lower.includes('hambúrguer') ||
      lower.includes('lanche') ||
      lower.includes('burger') ||
      lower.includes('sandwich')
    ) {
      return Sandwich;
    }
    if (
      lower.includes('porç') ||
      lower.includes('snack') ||
      lower.includes('frita') ||
      lower.includes('batata') ||
      lower.includes('petisco')
    ) {
      return Flame;
    }
    if (
      lower.includes('bebid') ||
      lower.includes('refresc') ||
      lower.includes('drink') ||
      lower.includes('suco') ||
      lower.includes('refrigerante')
    ) {
      return CupSoda;
    }
    if (
      lower.includes('sobremes') ||
      lower.includes('doce') ||
      lower.includes('sorvete') ||
      lower.includes('acai') ||
      lower.includes('açaí') ||
      lower.includes('sobremesa')
    ) {
      return IceCream;
    }
    if (lower.includes('pizza')) {
      return Pizza;
    }
    if (lower.includes('café') || lower.includes('cafe')) {
      return Coffee;
    }
    return Utensils;
  };

  // Helper to get effective price of an item (promo if present, otherwise regular)
  const getEffectivePriceCents = (item: MenuItemModel) => {
    if (item.promoPriceCents !== null && item.promoPriceCents !== undefined && item.promoPriceCents > 0) {
      return item.promoPriceCents;
    }
    return item.priceCents;
  };

  // Detail Modal handler
  const openItemDetail = (item: MenuItemModel) => {
    setSelectedItemForDetail(item);
    setIsDetailModalOpen(true);
  };

  // Cart operations with variation support
  const handleAddToCartFromDetail = (
    item: MenuItemModel,
    quantity: number = 1,
    selectedVariation?: MenuItemVariation | null
  ) => {
    const key = selectedVariation ? `${item.id}-${selectedVariation.name}` : item.id;
    const unitPrice = selectedVariation
      ? selectedVariation.price_cents
      : getEffectivePriceCents(item);

    setCart((prev) => {
      const existing = prev[key];
      const nextQty = existing ? existing.quantity + quantity : quantity;
      return {
        ...prev,
        [key]: {
          item,
          quantity: nextQty,
          variationName: selectedVariation?.name,
          unitPriceCents: unitPrice,
        },
      };
    });
    setValidationErrors((prev) => ({ ...prev, cart: '' }));
  };

  const addToCart = (item: MenuItemModel) => {
    // If the item has multiple variations or ingredients, open the detail modal for full custom choice
    if (Array.isArray(item.variations) && item.variations.length > 0) {
      openItemDetail(item);
      return;
    }
    handleAddToCartFromDetail(item, 1, null);
  };

  const updateQuantity = (cartKey: string, delta: number) => {
    setCart((prev) => {
      const existing = prev[cartKey];
      if (!existing) return prev;

      const newQty = existing.quantity + delta;
      if (newQty <= 0) {
        const next = { ...prev };
        delete next[cartKey];
        return next;
      }

      return {
        ...prev,
        [cartKey]: {
          ...existing,
          quantity: newQty,
        },
      };
    });
  };

  const removeFromCart = (cartKey: string) => {
    setCart((prev) => {
      const next = { ...prev };
      delete next[cartKey];
      return next;
    });
  };

  const clearCart = () => {
    setCart({});
  };

  // Cart calculations
  const cartEntries: [string, CartItem][] = Object.entries(cart);
  const totalItemsCount = cartEntries.reduce((sum: number, [, entry]) => sum + entry.quantity, 0);
  const totalCartCents = cartEntries.reduce((sum: number, [, entry]) => {
    const unitPrice = entry.unitPriceCents ?? getEffectivePriceCents(entry.item);
    return sum + unitPrice * entry.quantity;
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
      const formattedItems = cartEntries.map(([, entry]) => ({
        menu_item_id: entry.item.id,
        quantity: entry.quantity,
      }));

      const response = await fetch(getApiUrl('create-menu-checkout-session'), {
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

  // Featured Item for the Hero Highlight Banner (Controlled by Admin via menu_banner)
  const featuredHeroItemId =
    bannerData.featuredItemId ||
    (bannerData as Record<string, any>).featured_item_id ||
    null;
  const featuredHeroItem = featuredHeroItemId
    ? menuItems.find((i) => i.id === featuredHeroItemId) || null
    : null;
  const featuredHeroBadgeText =
    bannerData.featuredBadgeText ||
    (bannerData as Record<string, any>).featured_badge_text ||
    'OFERTA ESPECIAL';

  // Render a Single Dish Card in Compact Horizontal Format (Delivery App Style)
  const renderDishCard = (item: MenuItemModel) => {
    const hasPromo =
      item.promoPriceCents !== null &&
      item.promoPriceCents !== undefined &&
      item.promoPriceCents > 0;
    const inCartQty = cartEntries
      .filter(([, entry]) => entry.item.id === item.id)
      .reduce((sum, [, entry]) => sum + entry.quantity, 0);
    const isImageBroken = imageErrors[item.id];
    const showImage = !!item.imageUrl && !isImageBroken;
    const itemCategory = categories.find((c) => c.id === item.categoryId);
    const PlaceholderIcon = getCategoryIcon(itemCategory?.name);

    return (
      <div
        key={item.id}
        id={`menu-item-${item.id}`}
        onClick={() => openItemDetail(item)}
        className={`rounded-2xl bg-[#FFFFFF] border transition-all duration-300 overflow-hidden flex flex-row items-center p-3 sm:p-3.5 gap-3 sm:gap-4 group cursor-pointer ${
          inCartQty > 0
            ? 'border-[#FD4912] ring-2 ring-[#FD4912]/20 shadow-[0_8px_25px_-4px_rgba(253,73,18,0.20)] bg-[#FFFFFF]'
            : 'border-[#F9F3F1] shadow-[0_4px_16px_-4px_rgba(9,9,9,0.06)] hover:shadow-[0_8px_25px_-4px_rgba(253,73,18,0.18)] hover:border-[#FD4912]/50'
        }`}
      >
        {/* Left: Square 1:1 Photo with rounded corners */}
        <div className="relative w-22 h-22 sm:w-26 sm:h-26 md:w-28 md:h-28 aspect-square flex-shrink-0 rounded-xl overflow-hidden bg-[#F9F3F1] select-none border border-[#F9F3F1]">
          {showImage ? (
            <img
              src={item.imageUrl!}
              alt={item.name}
              onError={() =>
                setImageErrors((prev) => ({ ...prev, [item.id]: true }))
              }
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
              referrerPolicy="no-referrer"
              loading="lazy"
            />
          ) : (
            /* Neutral Square Light Placeholder */
            <div className="w-full h-full bg-[#F9F3F1] flex flex-col items-center justify-center text-[#090909]/60 gap-1 p-2 text-center relative">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white border border-[#FD4912]/30 flex items-center justify-center text-[#FD4912] shadow-xs">
                <PlaceholderIcon className="w-4 h-4 sm:w-5 sm:h-5 stroke-[1.75]" />
              </div>
              <span className="text-[8px] sm:text-[9px] font-bold tracking-widest uppercase text-[#090909]/60 font-mono">
                {itemCategory?.name ? itemCategory.name.split('&')[0].trim().slice(0, 8) : 'SNACK'}
              </span>
            </div>
          )}

          {/* Floating Promotional Badge */}
          {hasPromo && (
            <div className="absolute top-1.5 left-1.5 pointer-events-none">
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-[#FD4912] text-white text-[9px] font-bold uppercase tracking-wider shadow-xs">
                <Tag className="w-2 h-2 stroke-[2.5]" />
                <span>Promo</span>
              </span>
            </div>
          )}

          {/* Floating In-Cart Badge */}
          {inCartQty > 0 && (
            <div className="absolute bottom-1.5 right-1.5 pointer-events-none">
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-white/95 backdrop-blur-md border border-[#FD4912] text-[#FD4912] text-[9px] font-bold font-mono shadow-xs">
                {inCartQty}x
              </span>
            </div>
          )}
        </div>

        {/* Right: Stacked Details (Title, Description, Price & Add Button) */}
        <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch py-0.5">
          {/* Dish Info */}
          <div>
            <h3 className="font-bold text-xs sm:text-sm md:text-base text-[#090909] group-hover:text-[#FD4912] transition-colors leading-snug line-clamp-1">
              {item.name}
            </h3>
            <p className="text-[11px] sm:text-xs text-[#090909]/70 mt-0.5 sm:mt-1 leading-snug line-clamp-2">
              {item.description || 'Preparado na hora com ingredientes selecionados.'}
            </p>
          </div>

          {/* Bottom: Price & Add to Cart Controls */}
          <div className="flex items-center justify-between gap-2 mt-2 pt-1 border-t border-[#F9F3F1]">
            {/* Price Display */}
            <div className="flex flex-col min-w-0">
              {hasPromo ? (
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xs sm:text-sm font-bold text-[#FD4912] tracking-tight font-mono leading-none">
                    {formatUsdPrice(item.promoPriceCents!)}
                  </span>
                  <span className="text-[10px] text-[#090909]/40 line-through font-mono leading-none">
                    {formatUsdPrice(item.priceCents)}
                  </span>
                </div>
              ) : (
                <span className="text-xs sm:text-sm font-bold text-[#090909] tracking-tight font-mono leading-none">
                  {formatUsdPrice(item.priceCents)}
                </span>
              )}
            </div>

            {/* Action: "+ Adicionar" or Stepper */}
            {inCartQty > 0 ? (
              <div
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 bg-white border border-[#F9F3F1] rounded-full p-0.5 shadow-xs flex-shrink-0"
              >
                <button
                  type="button"
                  onClick={() => {
                    const firstMatchingKey = cartEntries.find(([, entry]) => entry.item.id === item.id)?.[0];
                    if (firstMatchingKey) updateQuantity(firstMatchingKey, -1);
                  }}
                  className="w-6 h-6 rounded-full bg-[#F9F3F1] hover:bg-[#F9F3F1]/80 text-[#090909] flex items-center justify-center transition-colors cursor-pointer active:scale-90"
                  title="Diminuir quantidade"
                  aria-label={`Diminuir quantidade de ${item.name}`}
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-4 text-center text-xs font-bold text-[#090909] font-mono">
                  {inCartQty}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const firstMatchingKey = cartEntries.find(([, entry]) => entry.item.id === item.id)?.[0];
                    if (firstMatchingKey) updateQuantity(firstMatchingKey, 1);
                  }}
                  className="w-6 h-6 rounded-full bg-[#FD4912] text-white hover:bg-[#FD4912]/90 flex items-center justify-center transition-colors cursor-pointer active:scale-90"
                  title="Aumentar quantidade"
                  aria-label={`Aumentar quantidade de ${item.name}`}
                >
                  <Plus className="w-3 h-3 stroke-[2.5]" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  addToCart(item);
                }}
                className="min-h-[30px] sm:min-h-[32px] px-2.5 sm:px-3 rounded-full bg-[#FD4912] hover:bg-[#FD4912]/90 active:scale-95 text-white text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 shadow-xs shadow-[#FD4912]/20 cursor-pointer flex-shrink-0"
                aria-label={`Adicionar ${item.name} ao pedido`}
              >
                <Plus className="w-3 h-3 stroke-[3]" />
                <span>Adicionar</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Reusable Order & Checkout Form Panel
  const renderOrderPanel = (idPrefix: string, onClose?: () => void) => {
    return (
      <div className="flex flex-col">
        {/* Panel Header */}
        <div className="border-b border-[#F1E4D3] pb-4 mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#E8734A]/10 border border-[#E8734A]/20 flex items-center justify-center text-[#E8734A]">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <h2 id="cart-modal-title" className="text-sm sm:text-base font-black uppercase tracking-wider text-[#3A2E26] font-fredoka">
                Seu Pedido
              </h2>
              <p className="text-xs text-[#7A6C60] mt-0.5">
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
                className="text-[11px] text-[#7A6C60] hover:text-red-500 transition-colors uppercase font-bold flex items-center gap-1 cursor-pointer px-2 py-1 rounded-lg hover:bg-[#FAF0E1]"
              >
                <Trash2 className="w-3 h-3" />
                <span>Limpar</span>
              </button>
            )}

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-[#FAF0E1] hover:bg-[#F3E5D0] text-[#5A493D] hover:text-[#3A2E26] flex items-center justify-center transition-colors cursor-pointer"
                title="Fechar"
                aria-label="Fechar janela do pedido"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Global Validation / Error Banner */}
        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong className="block font-bold text-red-800">Falha ao criar pedido</strong>
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Cart Items List */}
        <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1 mb-5 scrollbar-thin">
          {cartEntries.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-[#F9F3F1] rounded-2xl bg-[#F9F3F1]">
              <Utensils className="w-7 h-7 text-[#090909]/40 mx-auto mb-2" />
              <p className="text-xs text-[#090909]/70 max-w-xs mx-auto">
                Sua sacola está vazia. Toque em <strong className="text-[#090909]">+ Adicionar</strong> nos itens do cardápio para montar seu pedido.
              </p>
            </div>
          ) : (
            cartEntries.map(([cartKey, { item, quantity, variationName, unitPriceCents }]) => {
              const unitPrice = unitPriceCents ?? getEffectivePriceCents(item);
              const itemTotal = unitPrice * quantity;

              return (
                <div
                  key={cartKey}
                  className="p-3 rounded-2xl bg-[#FFFFFF] border border-[#F9F3F1] shadow-xs flex items-center justify-between text-xs gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {item.imageUrl && !imageErrors[item.id] ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-10 h-10 rounded-xl object-cover flex-shrink-0 border border-[#F9F3F1]"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-[#F9F3F1] flex items-center justify-center flex-shrink-0 text-[#090909]/60 border border-[#F9F3F1]">
                        <Utensils className="w-4 h-4 text-[#090909]/60" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-[#090909] truncate text-xs sm:text-sm">
                        {item.name}
                      </h4>
                      {variationName && (
                        <span className="inline-block text-[10px] font-semibold text-[#FD4912] bg-[#FD4912]/10 px-1.5 py-0.5 rounded-md mt-0.5">
                          {variationName}
                        </span>
                      )}
                      <div className="text-[11px] text-[#090909]/60 font-mono mt-0.5">
                        {formatUsdPrice(unitPrice)} un.
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex items-center gap-1 bg-[#F9F3F1] border border-[#F9F3F1] rounded-full p-0.5">
                      <button
                        type="button"
                        onClick={() => updateQuantity(cartKey, -1)}
                        className="w-6 h-6 rounded-full text-[#090909] hover:bg-white flex items-center justify-center cursor-pointer active:scale-90"
                        title="Diminuir"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-5 text-center font-bold text-[#090909] text-[11px] font-mono">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(cartKey, 1)}
                        className="w-6 h-6 rounded-full bg-[#FD4912] text-white hover:bg-[#FD4912]/90 flex items-center justify-center cursor-pointer active:scale-90"
                        title="Aumentar"
                      >
                        <Plus className="w-3 h-3 stroke-[2.5]" />
                      </button>
                    </div>

                    <span className="font-bold text-[#FD4912] w-14 text-right font-mono text-xs sm:text-sm">
                      {formatUsdPrice(itemTotal)}
                    </span>

                    <button
                      type="button"
                      onClick={() => removeFromCart(cartKey)}
                      className="text-[#090909]/40 hover:text-red-500 p-1.5 transition-colors cursor-pointer"
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
        <form onSubmit={handleCheckout} className="space-y-4 border-t border-[#F1E4D3] pt-4">
          <div className="text-xs font-bold uppercase tracking-wider text-[#3A2E26] flex items-center gap-1.5 font-fredoka">
            <User className="w-3.5 h-3.5 text-[#E8734A]" />
            <span>Dados do Titular</span>
          </div>

          {/* Field: Full Name */}
          <div>
            <label
              htmlFor={`${idPrefix}holder_name`}
              className="block text-xs font-bold uppercase tracking-wider text-[#3A2E26] mb-1.5"
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
                className={`w-full px-4 py-3 pl-10 rounded-xl bg-white border text-xs sm:text-sm text-[#3A2E26] placeholder-[#A89A8D] focus:outline-none focus:ring-1 transition-all ${
                  validationErrors.name
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-[#EADCC9] focus:border-[#E8734A] focus:ring-[#E8734A]'
                }`}
              />
              <User className="w-4 h-4 text-[#A89A8D] absolute left-3.5 top-3.5 pointer-events-none" />
            </div>
            {validationErrors.name && (
              <p className="text-[11px] text-red-500 mt-1 font-medium">{validationErrors.name}</p>
            )}
          </div>

          {/* Field: Email */}
          <div>
            <label
              htmlFor={`${idPrefix}holder_email`}
              className="block text-xs font-bold uppercase tracking-wider text-[#3A2E26] mb-1.5"
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
                className={`w-full px-4 py-3 pl-10 rounded-xl bg-white border text-xs sm:text-sm text-[#3A2E26] placeholder-[#A89A8D] focus:outline-none focus:ring-1 transition-all ${
                  validationErrors.email
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-[#EADCC9] focus:border-[#E8734A] focus:ring-[#E8734A]'
                }`}
              />
              <Mail className="w-4 h-4 text-[#A89A8D] absolute left-3.5 top-3.5 pointer-events-none" />
            </div>
            {validationErrors.email && (
              <p className="text-[11px] text-red-500 mt-1 font-medium">{validationErrors.email}</p>
            )}
          </div>

          {/* Field: Phone */}
          <div>
            <label
              htmlFor={`${idPrefix}holder_phone`}
              className="block text-xs font-bold uppercase tracking-wider text-[#3A2E26] mb-1.5"
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
                className={`w-full px-4 py-3 pl-10 rounded-xl bg-white border text-xs sm:text-sm text-[#3A2E26] placeholder-[#A89A8D] focus:outline-none focus:ring-1 transition-all ${
                  validationErrors.phone
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-[#EADCC9] focus:border-[#E8734A] focus:ring-[#E8734A]'
                }`}
              />
              <Phone className="w-4 h-4 text-[#A89A8D] absolute left-3.5 top-3.5 pointer-events-none" />
            </div>
            {validationErrors.phone && (
              <p className="text-[11px] text-red-500 mt-1 font-medium">{validationErrors.phone}</p>
            )}
          </div>

          {/* Total Order Summary */}
          <div className="pt-4 border-t border-[#F1E4D3] flex items-center justify-between">
            <div>
              <span className="text-[11px] text-[#7A6C60] uppercase font-bold block tracking-wider">
                Total do Pedido
              </span>
              <span className="text-[11px] text-[#7A6C60]">
                Cobrança segura via Stripe (USD)
              </span>
            </div>
            <div className="text-2xl font-black text-[#3A2E26] tracking-tight font-mono">
              {formatUsdPrice(totalCartCents)}
            </div>
          </div>

          {validationErrors.cart && (
            <p className="text-xs text-red-600 flex items-center gap-1.5 font-semibold bg-red-50 p-3 rounded-xl border border-red-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {validationErrors.cart}
            </p>
          )}

          {/* Submit Button */}
          <button
            id={`${idPrefix}submit_btn`}
            type="submit"
            disabled={isSubmitting || cartEntries.length === 0}
            className="w-full min-h-[48px] py-3.5 px-6 rounded-full bg-[#E8734A] hover:bg-[#D26038] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-black tracking-tight transition-all shadow-md shadow-[#E8734A]/20 flex items-center justify-center gap-2 group cursor-pointer font-fredoka"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
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

        <div className="mt-4 pt-3.5 border-t border-[#F1E4D3] text-[11px] text-center text-[#7A6C60] flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#E8734A]" />
          <span>Retirada rápida no balcão central de alimentação</span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#FDF6ED] text-[#3A2E26] font-sans selection:bg-[#E8734A] selection:text-white pb-28 relative">
      {/* Dynamic Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-[#E8734A]/[0.04] blur-[150px] rounded-full" />
      </div>

      {/* Top Navigation Bar */}
      <header className="relative z-30 border-b border-[#EADCC9] bg-[#FDF6ED]/95 backdrop-blur-xl sticky top-0 transition-all shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div
            onClick={onNavigateToHome}
            className={`flex items-center gap-3 ${onNavigateToHome ? 'cursor-pointer group' : ''}`}
          >
            <ParkLogo size="md" />
            <span className="text-[10px] text-[#7A6C60] font-semibold tracking-wider uppercase hidden sm:inline-block px-2 py-0.5 rounded-md bg-[#FAF0E1] border border-[#EADCC9]">
              Snack Bar & Delivery
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {onNavigateToHome && (
              <button
                type="button"
                onClick={onNavigateToHome}
                className="hidden sm:flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-full bg-[#FAF0E1] hover:bg-[#F3E5D0] text-[#5A493D] hover:text-[#3A2E26] border border-[#EADCC9] font-semibold transition-all cursor-pointer"
              >
                <span>Início</span>
              </button>
            )}

            {onNavigateToTickets && (
              <button
                type="button"
                onClick={onNavigateToTickets}
                className="flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-full bg-[#FAF0E1] hover:bg-[#F3E5D0] text-[#5A493D] hover:text-[#3A2E26] border border-[#EADCC9] font-medium transition-all cursor-pointer"
              >
                <Ticket className="w-3.5 h-3.5 text-[#A89A8D]" />
                <span>Ingressos</span>
              </button>
            )}

            {onNavigateToParties && (
              <button
                type="button"
                onClick={onNavigateToParties}
                className="hidden xs:flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-full bg-[#FAF0E1] hover:bg-[#F3E5D0] text-[#5A493D] hover:text-[#3A2E26] border border-[#EADCC9] font-medium transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#A89A8D]" />
                <span>Festas</span>
              </button>
            )}

            <button
              type="button"
              className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-full bg-[#FD4912] text-white font-bold tracking-tight shadow-xs shadow-[#FD4912]/20"
            >
              <Utensils className="w-3.5 h-3.5 text-white stroke-[2.5]" />
              <span>Cardápio</span>
            </button>

            {/* Header Cart Trigger Button */}
            <button
              id="header-cart-btn"
              type="button"
              onClick={() => setIsCartOpen(true)}
              className={`flex items-center gap-2 text-xs px-3.5 py-2 rounded-full font-bold transition-all cursor-pointer ${
                totalItemsCount > 0
                  ? 'bg-[#F9F3F1] hover:bg-[#F9F3F1]/80 text-[#090909] border border-[#FD4912] shadow-xs'
                  : 'bg-[#F9F3F1] hover:bg-[#F9F3F1]/80 text-[#090909]/60 hover:text-[#090909] border border-[#F9F3F1]'
              }`}
              title="Ver sacola de pedidos"
              aria-label="Abrir sacola de pedidos"
            >
              <ShoppingCart className={`w-3.5 h-3.5 ${totalItemsCount > 0 ? 'text-[#FD4912]' : 'text-[#090909]/40'}`} />
              {totalItemsCount > 0 ? (
                <>
                  <span className="hidden sm:inline font-mono text-[#090909] font-bold">
                    {formatUsdPrice(totalCartCents)}
                  </span>
                  <span className="w-5 h-5 rounded-full bg-[#FD4912] text-white text-[11px] font-bold flex items-center justify-center font-mono">
                    {totalItemsCount}
                  </span>
                </>
              ) : (
                <span className="hidden sm:inline">Sacola</span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Hero & Highlight Banner (100% Dynamic & Editable) */}
      <section className="relative z-10 pt-4 sm:pt-6 pb-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="rounded-3xl bg-[#FFFFFF] border border-[#F9F3F1] p-5 sm:p-7 md:p-8 relative overflow-hidden shadow-[0_4px_25px_-4px_rgba(9,9,9,0.06)]">
          {/* Banner Background Image with Directional Gradient for Optimal Visibility & Contrast */}
          {bannerData.imageUrl && (
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
              <img
                src={bannerData.imageUrl}
                alt="Banner do Cardápio"
                className="w-full h-full object-cover object-center"
                referrerPolicy="no-referrer"
              />
              {/* Directional gradient: opaque on the left where text lives, transparent on the right to keep photo crisp & recognizable */}
              <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 to-white/20 sm:to-transparent" />
            </div>
          )}

          {/* Subtle decorative dot pattern */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-40">
            <div className="w-full h-full bg-[radial-gradient(#FD4912_1px,transparent_1px)] [background-size:24px_24px] opacity-10" />
          </div>

          <div
            className={`relative z-10 ${
              featuredHeroItem
                ? 'grid grid-cols-1 lg:grid-cols-12 gap-6 items-center'
                : 'max-w-2xl'
            }`}
          >
            {/* Left Column: Editable Banner Callout */}
            <div className={`${featuredHeroItem ? 'lg:col-span-7 xl:col-span-8' : ''} space-y-3`}>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[#FD4912] px-3.5 py-1.5 rounded-full bg-[#FD4912]/10 border border-[#FD4912]/20 shadow-xs">
                <Utensils className="w-3.5 h-3.5 text-[#FD4912]" />
                <span>{bannerData.badgeText || (bannerData as any).badge_text || 'SNACK BAR & GASTRONOMIA'}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-tight text-[#090909] leading-[1.1]">
                {bannerData.title || 'Cardápio do Parque'}
              </h1>

              <p className="text-xs sm:text-sm text-[#090909]/70 max-w-xl leading-relaxed">
                {bannerData.subtitle ||
                  'Peça online pelo celular e retire rapidamente no balcão central de alimentação sem pegar filas. Lanches preparados na hora, porções crocantes, bebidas e sobremesas!'}
              </p>
            </div>

            {/* Right Column: Featured Item Highlight Card */}
            {featuredHeroItem && (
              <div className="lg:col-span-5 xl:col-span-4">
                <div
                  onClick={() => openItemDetail(featuredHeroItem)}
                  className="rounded-2xl bg-[#FFFFFF] border border-[#F9F3F1] p-3.5 sm:p-4 shadow-[0_4px_20px_-4px_rgba(9,9,9,0.06)] relative overflow-hidden group hover:border-[#FD4912]/60 hover:shadow-[0_8px_30px_-4px_rgba(253,73,18,0.18)] transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#FD4912] text-white text-[10px] font-bold uppercase tracking-wider">
                      <Sparkles className="w-3 h-3 stroke-[2.5]" />
                      <span>{featuredHeroBadgeText}</span>
                    </span>
                    <span className="text-[10px] text-[#FDCF00] font-bold uppercase tracking-widest flex items-center gap-1">
                      ★ Mais Pedido
                    </span>
                  </div>

                  <div className="flex gap-3 items-center">
                    {/* Photo or Curated Placeholder */}
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-[#F9F3F1] flex-shrink-0 border border-[#F9F3F1]">
                      {featuredHeroItem.imageUrl && !imageErrors[featuredHeroItem.id] ? (
                        <img
                          src={featuredHeroItem.imageUrl}
                          alt={featuredHeroItem.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#F9F3F1] flex flex-col items-center justify-center text-[#FD4912] p-2 text-center">
                          <Utensils className="w-6 h-6 stroke-[1.5]" />
                          <span className="text-[8px] text-[#090909]/60 font-mono mt-1 uppercase">Destaque</span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs sm:text-sm font-bold text-[#090909] truncate group-hover:text-[#FD4912] transition-colors">
                        {featuredHeroItem.name}
                      </h3>
                      <p className="text-[10px] sm:text-[11px] text-[#090909]/70 line-clamp-2 mt-0.5 leading-snug">
                        {featuredHeroItem.description || 'Ingredientes frescos e selecionados, preparado na hora.'}
                      </p>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#F9F3F1]">
                        <div>
                          {featuredHeroItem.promoPriceCents ? (
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-xs sm:text-sm font-bold text-[#FD4912] font-mono">
                                {formatUsdPrice(featuredHeroItem.promoPriceCents)}
                              </span>
                              <span className="text-[9px] text-[#090909]/40 line-through font-mono">
                                {formatUsdPrice(featuredHeroItem.priceCents)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs sm:text-sm font-bold text-[#090909] font-mono">
                              {formatUsdPrice(featuredHeroItem.priceCents)}
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openItemDetail(featuredHeroItem);
                          }}
                          className="px-2.5 py-1 rounded-full bg-[#FD4912] hover:bg-[#FD4912]/90 active:scale-95 text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer shadow-xs shadow-[#FD4912]/20"
                        >
                          <Plus className="w-3 h-3 stroke-[3]" />
                          <span>Ver / Pedir</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Category Navigation - Delivery App Circle Style (Horizontally Scrollable & Sticky) */}
      <div className="sticky top-[57px] z-20 bg-[#FFFFFF]/95 backdrop-blur-md py-3.5 border-y border-[#F9F3F1] mb-6 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-start gap-4 sm:gap-6 overflow-x-auto pb-1 scrollbar-none touch-pan-x select-none">
            {/* "Todos" circular category */}
            <button
              type="button"
              id="cat-circle-all"
              onClick={() => setSelectedCategoryTab('all')}
              className="flex flex-col items-center gap-1.5 group cursor-pointer flex-shrink-0"
            >
              <div
                className={`w-13 h-13 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                  selectedCategoryTab === 'all'
                    ? 'bg-[#FD4912] text-white shadow-md shadow-[#FD4912]/25 scale-105 ring-2 ring-[#FD4912]/30'
                    : 'bg-[#F9F3F1] border border-[#F9F3F1] text-[#090909]/70 hover:border-[#FD4912]/30 hover:text-[#090909] group-hover:scale-102 shadow-xs'
                }`}
              >
                <Layers className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
              </div>
              <div className="flex flex-col items-center">
                <span
                  className={`text-[11px] sm:text-xs font-bold tracking-tight text-center whitespace-nowrap transition-colors ${
                    selectedCategoryTab === 'all' ? 'text-[#FD4912]' : 'text-[#090909]/70 group-hover:text-[#090909]'
                  }`}
                >
                  Todos
                </span>
                <span className="text-[10px] text-[#090909]/50 font-mono">
                  {menuItems.length} {menuItems.length === 1 ? 'item' : 'itens'}
                </span>
              </div>
            </button>

            {/* Specific category circles with optional Image Upload support */}
            {categories.map((cat) => {
              const catCount = menuItems.filter((i) => i.categoryId === cat.id).length;
              const isSelected = selectedCategoryTab === cat.id;
              const CatIcon = getCategoryIcon(cat.name);

              return (
                <button
                  key={cat.id}
                  id={`cat-circle-${cat.id}`}
                  type="button"
                  onClick={() => setSelectedCategoryTab(cat.id)}
                  className="flex flex-col items-center gap-1.5 group cursor-pointer flex-shrink-0"
                >
                  <div
                    className={`w-13 h-13 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center overflow-hidden transition-all duration-300 ${
                      isSelected
                        ? 'bg-[#FD4912] text-white shadow-md shadow-[#FD4912]/25 scale-105 ring-2 ring-[#FD4912]/30'
                        : 'bg-[#F9F3F1] border border-[#F9F3F1] text-[#090909]/70 hover:border-[#FD4912]/30 hover:text-[#090909] group-hover:scale-102 shadow-xs'
                    }`}
                  >
                    {cat.imageUrl ? (
                      <img
                        src={cat.imageUrl}
                        alt={cat.name}
                        className="w-full h-full object-cover rounded-2xl group-hover:scale-105 transition-transform"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <CatIcon className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
                    )}
                  </div>
                  <div className="flex flex-col items-center max-w-[85px] sm:max-w-[100px]">
                    <span
                      className={`text-[11px] sm:text-xs font-bold tracking-tight text-center truncate w-full transition-colors ${
                        isSelected ? 'text-[#FD4912]' : 'text-[#090909]/70 group-hover:text-[#090909]'
                      }`}
                      title={cat.name}
                    >
                      {cat.name}
                    </span>
                    <span className="text-[10px] text-[#090909]/50 font-mono">
                      {catCount} {catCount === 1 ? 'item' : 'itens'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Layout: Dish Cards Grid (Clean Full-Width Focused Container) */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-10">
          {isLoading ? (
            <div className="space-y-6">
              <div className="h-6 w-40 skeleton-box" />
              <SkeletonCard type="dish" count={6} />
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="p-16 rounded-2xl bg-white border border-[#EADCC9] text-center text-xs text-[#7A6C60] uppercase tracking-wider font-bold shadow-sm">
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
                  <div className="flex items-center justify-between border-b border-[#F9F3F1] pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#FD4912]" />
                      <h2 className="text-sm sm:text-base font-bold uppercase tracking-wider text-[#090909]">
                        {category.name}
                      </h2>
                    </div>
                    <span className="text-xs text-[#090909]/60 font-mono">
                      {categoryItems.length}{' '}
                      {categoryItems.length === 1 ? 'opção' : 'opções'}
                    </span>
                  </div>

                  {/* Responsive Compact Dish Grid (Delivery App Horizontal List Style) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
                    {categoryItems.map((item) => renderDishCard(item))}
                  </div>
                </section>
              );
            })
          )}
        </div>
      </main>

      {/* Floating Sticky Bottom Bar (Delivery-app style "Ver Pedido", works on mobile & desktop) */}
      {totalItemsCount > 0 && !isCartOpen && (
        <div className="fixed bottom-4 sm:bottom-6 inset-x-0 z-40 px-4 flex justify-center pointer-events-none">
          <button
            id="btn-open-cart-floating"
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="pointer-events-auto w-full max-w-md py-3.5 px-5 rounded-2xl bg-[#FD4912] hover:bg-[#FD4912]/90 text-white font-bold text-xs sm:text-sm shadow-xl shadow-[#FD4912]/25 border border-[#FD4912]/30 flex items-center justify-between active:scale-[0.98] transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-7 h-7 rounded-full bg-white text-[#FD4912] flex items-center justify-center text-xs font-bold font-mono shadow-xs">
                {totalItemsCount}
              </div>
              <div className="text-left">
                <span className="block font-bold uppercase tracking-tight text-xs sm:text-sm leading-none text-white">
                  Ver Pedido
                </span>
                <span className="text-[11px] text-[#F9F3F1] font-medium">
                  {totalItemsCount === 1 ? '1 item adicionado' : `${totalItemsCount} itens adicionados`}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 font-mono font-bold text-sm sm:text-base text-white">
              <span>{formatUsdPrice(totalCartCents)}</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </div>
          </button>
        </div>
      )}

      {/* Popup / Modal for "Seu Pedido" & Checkout (Desktop Centered Modal + Mobile Sheet) */}
      {isCartOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cart-modal-title"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          {/* Backdrop with dark blur */}
          <div
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-[#090909]/60 backdrop-blur-sm transition-opacity"
          />

          {/* Modal Container */}
          <div className="relative z-10 w-full sm:max-w-xl max-h-[92vh] sm:max-h-[88vh] bg-[#FFFFFF] border border-[#F9F3F1] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            {/* Visual Drag Handle on Mobile */}
            <div className="w-12 h-1.5 rounded-full bg-[#090909]/20 mx-auto mt-3 mb-1 sm:hidden flex-shrink-0" />

            {/* Scrollable Order Panel */}
            <div className="overflow-y-auto px-5 sm:px-6 py-4 sm:py-5 scrollbar-thin">
              {renderOrderPanel('modal_', () => setIsCartOpen(false))}
            </div>
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      <ItemDetailModal
        item={selectedItemForDetail}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onAddToCart={handleAddToCartFromDetail}
      />

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
