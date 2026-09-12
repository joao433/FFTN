import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Minus,
  ShoppingCart,
  Tag,
  Sparkles,
  Utensils,
  Check,
  Flame,
} from 'lucide-react';
import type { MenuItemModel, MenuItemVariation } from '../types/database.ts';

interface ItemDetailModalProps {
  item: MenuItemModel | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (
    item: MenuItemModel,
    quantity: number,
    selectedVariation?: MenuItemVariation | null
  ) => void;
}

export default function ItemDetailModal({
  item,
  isOpen,
  onClose,
  onAddToCart,
}: ItemDetailModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedVariation, setSelectedVariation] = useState<MenuItemVariation | null>(null);
  const [imageError, setImageError] = useState(false);

  // Reset state whenever item changes
  useEffect(() => {
    if (item) {
      setQuantity(1);
      setImageError(false);
      if (Array.isArray(item.variations) && item.variations.length > 0) {
        setSelectedVariation(item.variations[0]);
      } else {
        setSelectedVariation(null);
      }
    }
  }, [item]);

  // Lock scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  // Determine current unit price based on variation or promo/base price
  const currentUnitPriceCents = selectedVariation
    ? selectedVariation.price_cents
    : item.promoPriceCents && item.promoPriceCents > 0
    ? item.promoPriceCents
    : item.priceCents;

  const totalPriceCents = currentUnitPriceCents * quantity;

  // Split ingredients by comma or newline if present (handling string or array)
  const ingredientList: string[] = item.ingredients
    ? (Array.isArray(item.ingredients)
        ? item.ingredients
        : item.ingredients.split(/[\n,]+/))
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
    : [];

  const handleAdd = () => {
    onAddToCart(item, quantity, selectedVariation);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="item-detail-title"
    >
      <div
        className="relative w-full max-w-lg bg-[#FFFFFF] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-[#F9F3F1] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Image Section */}
        <div className="relative w-full h-56 sm:h-64 bg-[#F9F3F1] flex-shrink-0 overflow-hidden">
          {item.imageUrl && !imageError ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              onError={() => setImageError(true)}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-[#090909]/40 bg-[#F9F3F1]">
              <Utensils className="w-12 h-12 text-[#FD4912]/60 stroke-[1.5]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#090909]/50 mt-2">
                Foto Ilustrativa
              </span>
            </div>
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-[#090909] flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer z-10"
            title="Fechar detalhes"
            aria-label="Fechar janela"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Floating Badges */}
          <div className="absolute bottom-3 left-4 right-4 flex items-center gap-2 flex-wrap">
            {item.featuredHome && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FDCF00] text-[#090909] text-[11px] font-bold shadow-md">
                <Sparkles className="w-3 h-3 stroke-[2.5]" />
                <span>Mais Pedido do Parque</span>
              </span>
            )}
            {item.promoPriceCents && item.promoPriceCents > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FD4912] text-white text-[11px] font-bold shadow-md">
                <Tag className="w-3 h-3 stroke-[2.5]" />
                <span>Preço Especial</span>
              </span>
            )}
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 scrollbar-thin">
          {/* Title & Price Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2
                id="item-detail-title"
                className="text-xl sm:text-2xl font-bold text-[#090909] leading-tight"
              >
                {item.name}
              </h2>
              {item.description && (
                <p className="text-xs sm:text-sm text-[#090909]/70 mt-1.5 leading-relaxed">
                  {item.description}
                </p>
              )}
            </div>

            <div className="text-right flex-shrink-0">
              <span className="text-xl sm:text-2xl font-bold text-[#FD4912] block">
                {formatPrice(currentUnitPriceCents)}
              </span>
              {!selectedVariation && item.promoPriceCents && item.promoPriceCents > 0 && (
                <span className="text-xs text-[#090909]/40 line-through">
                  {formatPrice(item.priceCents)}
                </span>
              )}
            </div>
          </div>

          {/* Variations Section (Size / Portion) */}
          {Array.isArray(item.variations) && item.variations.length > 0 && (
            <div className="space-y-2.5 pt-2 border-t border-[#F9F3F1]">
              <label className="text-xs font-bold uppercase tracking-wider text-[#090909] block">
                Escolha o Tamanho / Variação
              </label>
              <div className="grid grid-cols-1 gap-2">
                {item.variations.map((v, idx) => {
                  const isChecked = selectedVariation?.name === v.name;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedVariation(v)}
                      className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        isChecked
                          ? 'border-[#FD4912] bg-[#FD4912]/5 ring-1 ring-[#FD4912] shadow-xs'
                          : 'border-[#F9F3F1] bg-white hover:border-[#FD4912]/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                            isChecked
                              ? 'border-[#FD4912] bg-[#FD4912] text-white'
                              : 'border-[#090909]/30 bg-white'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className="text-xs sm:text-sm font-semibold text-[#090909]">
                          {v.name}
                        </span>
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-[#090909]">
                        {formatPrice(v.price_cents)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Ingredients Section */}
          {ingredientList.length > 0 && (
            <div className="space-y-2.5 pt-2 border-t border-[#F9F3F1]">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#090909]">
                <Flame className="w-3.5 h-3.5 text-[#FD4912]" />
                <span>Ingredientes & Preparo</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ingredientList.map((ingredient, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#F9F3F1] border border-[#F9F3F1] text-xs font-medium text-[#090909]"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FD4912]" />
                    <span>{ingredient}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions: Quantity Selector & Add Button */}
        <div className="p-4 sm:p-5 bg-white border-t border-[#F9F3F1] flex items-center gap-3 sm:gap-4">
          {/* Quantity Controls */}
          <div className="flex items-center gap-2 bg-[#F9F3F1] border border-[#F9F3F1] rounded-2xl p-1">
            <button
              type="button"
              disabled={quantity <= 1}
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-8 h-8 rounded-xl bg-white hover:bg-white/80 disabled:opacity-40 disabled:cursor-not-allowed text-[#090909] flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-xs"
              title="Diminuir quantidade"
              aria-label="Diminuir quantidade"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-6 text-center text-sm font-bold text-[#090909]">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="w-8 h-8 rounded-xl bg-white hover:bg-white/80 text-[#090909] flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-xs"
              title="Aumentar quantidade"
              aria-label="Aumentar quantidade"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Add to Cart Button */}
          <button
            type="button"
            onClick={handleAdd}
            className="flex-1 py-3 px-5 rounded-2xl bg-[#FD4912] hover:bg-[#FD4912]/90 active:scale-[0.98] text-white text-xs sm:text-sm font-bold tracking-tight transition-all shadow-md shadow-[#FD4912]/20 flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              <span>Adicionar ao carrinho</span>
            </div>
            <span className="font-extrabold">{formatPrice(totalPriceCents)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
