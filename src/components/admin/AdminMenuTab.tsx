import React, { useState, useEffect, useCallback } from 'react';
import {
  UtensilsCrossed,
  Utensils,
  FolderTree,
  Plus,
  Edit2,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  DollarSign,
  Layers,
  Image as ImageIcon,
  Tag,
  X,
  Sparkles,
  Star,
  Trash2,
  LayoutTemplate,
  Info,
  ListPlus,
  Eye,
} from 'lucide-react';
import ImageUploadField from './ImageUploadField.tsx';
import { getApiUrl } from '../../lib/api.ts';

interface MenuCategory {
  id: string;
  name: string;
  display_order: number;
  active: boolean;
  image_url?: string | null;
  created_at: string;
  updated_at: string;
}

interface MenuItemVariation {
  id?: string;
  name: string;
  price_cents: number;
}

interface MenuItem {
  id: string;
  category_id: string;
  category_name?: string;
  name: string;
  description?: string | null;
  price_cents: number;
  promo_price_cents?: number | null;
  image_url?: string | null;
  ingredients?: string | string[] | null;
  variations?: MenuItemVariation[] | null;
  display_order: number;
  available: boolean;
  featured_home?: boolean;
  created_at: string;
  updated_at: string;
}

interface MenuBannerData {
  id?: string;
  title: string;
  subtitle: string;
  badge_text: string;
  image_url?: string | null;
  featured_item_id?: string | null;
  featured_badge_text?: string | null;
  active: boolean;
}

interface AdminMenuTabProps {
  onSessionExpired: () => void;
}

interface VariationFormState {
  id?: string;
  name: string;
  priceDollars: string;
}

export default function AdminMenuTab({ onSessionExpired }: AdminMenuTabProps) {
  // Sub-tabs state: 'banner' | 'categories' | 'items'
  const [activeSubTab, setActiveSubTab] = useState<'banner' | 'categories' | 'items'>('banner');

  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTogglingFeaturedId, setIsTogglingFeaturedId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // ================= BANNER STATE =================
  const [bannerTitle, setBannerTitle] = useState('Cardápio do Parque');
  const [bannerSubtitle, setBannerSubtitle] = useState(
    'Peça online pelo celular e retire rapidamente no balcão central de alimentação sem pegar filas. Lanches preparados na hora, porções crocantes, bebidas e sobremesas!'
  );
  const [bannerBadgeText, setBannerBadgeText] = useState('SNACK BAR & GASTRONOMIA');
  const [bannerImageUrl, setBannerImageUrl] = useState<string | null>(null);
  const [bannerFeaturedItemId, setBannerFeaturedItemId] = useState<string>('');
  const [bannerFeaturedBadgeText, setBannerFeaturedBadgeText] = useState('OFERTA ESPECIAL');
  const [bannerActive, setBannerActive] = useState(true);
  const [isSavingBanner, setIsSavingBanner] = useState(false);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [bannerSuccess, setBannerSuccess] = useState<string | null>(null);

  // Filter state for Items list
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  // ================= CATEGORY MODAL STATE =================
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryImageUrl, setCategoryImageUrl] = useState<string | null>(null);
  const [categoryDisplayOrder, setCategoryDisplayOrder] = useState('0');
  const [categoryActive, setCategoryActive] = useState(true);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  // ================= ITEM MODAL STATE =================
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemCategoryId, setItemCategoryId] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemIngredients, setItemIngredients] = useState('');
  const [itemVariations, setItemVariations] = useState<VariationFormState[]>([]);
  const [itemPriceDollars, setItemPriceDollars] = useState('');
  const [itemPromoPriceDollars, setItemPromoPriceDollars] = useState('');
  const [itemImageUrl, setItemImageUrl] = useState<string | null>(null);
  const [itemDisplayOrder, setItemDisplayOrder] = useState('0');
  const [itemAvailable, setItemAvailable] = useState(true);
  const [itemFeaturedHome, setItemFeaturedHome] = useState(false);
  const [itemError, setItemError] = useState<string | null>(null);

  const fetchMenuData = useCallback(async () => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      onSessionExpired();
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch(getApiUrl('admin-manage-menu'), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('admin_token');
        onSessionExpired();
        return;
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Erro ao carregar cardápio.');
      }

      const data: {
        categories: MenuCategory[];
        items: MenuItem[];
        banner?: MenuBannerData | null;
      } = await response.json();

      setCategories(Array.isArray(data.categories) ? data.categories : []);
      setItems(Array.isArray(data.items) ? data.items : []);

      if (data.banner) {
        setBannerTitle(data.banner.title || 'Cardápio do Parque');
        setBannerSubtitle(
          data.banner.subtitle ||
            'Peça online pelo celular e retire rapidamente no balcão central de alimentação sem pegar filas.'
        );
        setBannerBadgeText(data.banner.badge_text || 'SNACK BAR & GASTRONOMIA');
        setBannerImageUrl(data.banner.image_url || null);
        setBannerFeaturedItemId(data.banner.featured_item_id || '');
        setBannerFeaturedBadgeText(data.banner.featured_badge_text || 'OFERTA ESPECIAL');
        setBannerActive(data.banner.active !== undefined ? Boolean(data.banner.active) : true);
      }
    } catch (err: unknown) {
      console.error('[Admin Menu Fetch Error]:', err);
      const msg = err instanceof Error ? err.message : 'Erro ao buscar cardápio do servidor.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, [onSessionExpired]);

  useEffect(() => {
    fetchMenuData();
  }, [fetchMenuData]);

  // ================= BANNER FORM HANDLER =================
  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    setBannerError(null);
    setBannerSuccess(null);

    const token = localStorage.getItem('admin_token');
    if (!token) {
      onSessionExpired();
      return;
    }

    if (!bannerTitle.trim()) {
      setBannerError('O título do banner é obrigatório.');
      return;
    }

    setIsSavingBanner(true);

    try {
      const payload = {
        entity: 'banner',
        title: bannerTitle.trim(),
        subtitle: bannerSubtitle.trim() || null,
        badge_text: bannerBadgeText.trim() || null,
        image_url: bannerImageUrl || null,
        featured_item_id: bannerFeaturedItemId ? bannerFeaturedItemId : null,
        featured_badge_text: bannerFeaturedBadgeText.trim() || null,
        active: bannerActive,
      };

      const response = await fetch(getApiUrl('admin-manage-menu'), {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('admin_token');
        onSessionExpired();
        return;
      }

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao salvar banner do cardápio.');
      }

      setBannerSuccess('Banner do cardápio salvo com sucesso!');
      setTimeout(() => setBannerSuccess(null), 4500);
      fetchMenuData();
    } catch (err: unknown) {
      console.error('[Admin Save Banner Error]:', err);
      const msg = err instanceof Error ? err.message : 'Erro ao salvar banner do cardápio.';
      setBannerError(msg);
    } finally {
      setIsSavingBanner(false);
    }
  };

  // ================= CATEGORY MODAL HANDLERS =================
  const openCreateCategoryModal = () => {
    setEditingCategory(null);
    setCategoryName('');
    setCategoryImageUrl(null);
    setCategoryDisplayOrder(String(categories.length * 10));
    setCategoryActive(true);
    setCategoryError(null);
    setIsCategoryModalOpen(true);
  };

  const openEditCategoryModal = (cat: MenuCategory) => {
    setEditingCategory(cat);
    setCategoryName(cat.name);
    setCategoryImageUrl(cat.image_url || null);
    setCategoryDisplayOrder(String(cat.display_order ?? 0));
    setCategoryActive(cat.active);
    setCategoryError(null);
    setIsCategoryModalOpen(true);
  };

  const closeCategoryModal = () => {
    setIsCategoryModalOpen(false);
    setEditingCategory(null);
    setCategoryError(null);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCategoryError(null);

    const token = localStorage.getItem('admin_token');
    if (!token) {
      onSessionExpired();
      return;
    }

    if (!categoryName.trim()) {
      setCategoryError('Informe o nome da categoria.');
      return;
    }

    const displayOrderNum = parseInt(categoryDisplayOrder, 10) || 0;
    setIsSaving(true);

    try {
      const isEdit = !!editingCategory;
      const method = isEdit ? 'PUT' : 'POST';

      const payload: Record<string, any> = {
        entity: 'category',
        name: categoryName.trim(),
        image_url: categoryImageUrl || null,
        display_order: displayOrderNum,
      };

      if (isEdit) {
        payload.id = editingCategory.id;
        payload.active = categoryActive;
      }

      const response = await fetch(getApiUrl('admin-manage-menu'), {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('admin_token');
        onSessionExpired();
        return;
      }

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao salvar categoria.');
      }

      setSuccessNotice(
        isEdit
          ? `Categoria "${result.name}" atualizada com sucesso!`
          : `Categoria "${result.name}" criada com sucesso!`
      );
      setTimeout(() => setSuccessNotice(null), 4000);

      closeCategoryModal();
      fetchMenuData();
    } catch (err: unknown) {
      console.error('[Admin Save Category Error]:', err);
      const msg = err instanceof Error ? err.message : 'Erro ao processar categoria.';
      setCategoryError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // ================= ITEM MODAL HANDLERS =================
  const openCreateItemModal = () => {
    setEditingItem(null);
    setItemCategoryId(categories[0]?.id || '');
    setItemName('');
    setItemDescription('');
    setItemIngredients('');
    setItemVariations([]);
    setItemPriceDollars('');
    setItemPromoPriceDollars('');
    setItemImageUrl(null);
    setItemDisplayOrder(String(items.length * 10));
    setItemAvailable(true);
    setItemFeaturedHome(false);
    setItemError(null);
    setIsItemModalOpen(true);
  };

  const openEditItemModal = (item: MenuItem) => {
    setEditingItem(item);
    setItemCategoryId(item.category_id);
    setItemName(item.name);
    setItemDescription(item.description || '');

    // Format ingredients
    if (Array.isArray(item.ingredients)) {
      setItemIngredients(item.ingredients.join(', '));
    } else {
      setItemIngredients(item.ingredients || '');
    }

    // Format variations
    if (Array.isArray(item.variations) && item.variations.length > 0) {
      setItemVariations(
        item.variations.map((v) => ({
          id: v.id,
          name: v.name,
          priceDollars: (v.price_cents / 100).toFixed(2),
        }))
      );
    } else {
      setItemVariations([]);
    }

    setItemPriceDollars((item.price_cents / 100).toFixed(2));
    setItemPromoPriceDollars(
      item.promo_price_cents ? (item.promo_price_cents / 100).toFixed(2) : ''
    );
    setItemImageUrl(item.image_url || null);
    setItemDisplayOrder(String(item.display_order ?? 0));
    setItemAvailable(item.available);
    setItemFeaturedHome(Boolean(item.featured_home));
    setItemError(null);
    setIsItemModalOpen(true);
  };

  const closeItemModal = () => {
    setIsItemModalOpen(false);
    setEditingItem(null);
    setItemError(null);
  };

  // Variation handlers in Modal
  const handleAddVariation = () => {
    setItemVariations((prev) => [
      ...prev,
      {
        name: '',
        priceDollars: itemPriceDollars || '0.00',
      },
    ]);
  };

  const handleUpdateVariation = (
    index: number,
    field: 'name' | 'priceDollars',
    value: string
  ) => {
    setItemVariations((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    );
  };

  const handleRemoveVariation = (index: number) => {
    setItemVariations((prev) => prev.filter((_, i) => i !== index));
  };

  const handleToggleFeaturedHome = async (item: MenuItem) => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      onSessionExpired();
      return;
    }

    const nextValue = !item.featured_home;

    if (nextValue) {
      const currentFeatured = items.filter((it) => it.featured_home).length;
      if (currentFeatured >= 3) {
        setErrorMessage(
          'Você já tem 3 itens destacados. Desmarque um antes de adicionar outro.'
        );
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => setErrorMessage(null), 5000);
        return;
      }
    }

    setIsTogglingFeaturedId(item.id);
    setErrorMessage(null);

    try {
      const response = await fetch(getApiUrl('admin-manage-menu'), {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entity: 'item',
          id: item.id,
          featured_home: nextValue,
        }),
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('admin_token');
        onSessionExpired();
        return;
      }

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao atualizar destaque na Home.');
      }

      setItems((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, featured_home: nextValue } : it))
      );

      setSuccessNotice(
        nextValue
          ? `Item "${item.name}" agora está destacado na Home!`
          : `Item "${item.name}" foi removido dos destaques da Home.`
      );
      setTimeout(() => setSuccessNotice(null), 4000);
    } catch (err: unknown) {
      console.error('[Admin Toggle Featured Error]:', err);
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar destaque na Home.';
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setIsTogglingFeaturedId(null);
    }
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setItemError(null);

    const token = localStorage.getItem('admin_token');
    if (!token) {
      onSessionExpired();
      return;
    }

    if (!itemCategoryId) {
      setItemError('Selecione uma categoria para o item.');
      return;
    }

    if (!itemName.trim()) {
      setItemError('Informe o nome do item.');
      return;
    }

    const priceNum = parseFloat(itemPriceDollars.replace(',', '.'));
    if (isNaN(priceNum) || priceNum <= 0) {
      setItemError('Informe um preço válido maior que zero (ex: 14.50).');
      return;
    }
    const priceCents = Math.round(priceNum * 100);

    let promoPriceCents: number | null = null;
    if (itemPromoPriceDollars.trim()) {
      const promoNum = parseFloat(itemPromoPriceDollars.replace(',', '.'));
      if (isNaN(promoNum) || promoNum <= 0) {
        setItemError('Preço promocional deve ser um número válido maior que zero.');
        return;
      }
      promoPriceCents = Math.round(promoNum * 100);

      if (promoPriceCents >= priceCents) {
        setItemError('O preço promocional deve ser menor que o preço original.');
        return;
      }
    }

    if (itemFeaturedHome) {
      const otherFeatured = items.filter(
        (it) => it.featured_home && it.id !== editingItem?.id
      ).length;
      if (otherFeatured >= 3) {
        setItemError(
          'Você já tem 3 itens destacados. Desmarque um antes de adicionar outro.'
        );
        return;
      }
    }

    // Validate variations
    const formattedVariations: MenuItemVariation[] = [];
    for (let i = 0; i < itemVariations.length; i++) {
      const v = itemVariations[i];
      if (!v.name.trim()) {
        setItemError(`Preencha o nome da variação #${i + 1} ou remova-a.`);
        return;
      }
      const vPrice = parseFloat(v.priceDollars.replace(',', '.'));
      if (isNaN(vPrice) || vPrice <= 0) {
        setItemError(`O preço da variação "${v.name}" deve ser maior que zero.`);
        return;
      }
      formattedVariations.push({
        id: v.id || `var_${Date.now()}_${i}`,
        name: v.name.trim(),
        price_cents: Math.round(vPrice * 100),
      });
    }

    const displayOrderNum = parseInt(itemDisplayOrder, 10) || 0;
    setIsSaving(true);

    try {
      const isEdit = !!editingItem;
      const method = isEdit ? 'PUT' : 'POST';

      const payload: Record<string, any> = {
        entity: 'item',
        category_id: itemCategoryId,
        name: itemName.trim(),
        description: itemDescription.trim() || null,
        ingredients: itemIngredients.trim() || null,
        variations: formattedVariations.length > 0 ? formattedVariations : null,
        price_cents: priceCents,
        promo_price_cents: promoPriceCents,
        image_url: itemImageUrl || null,
        display_order: displayOrderNum,
        featured_home: itemFeaturedHome,
      };

      if (isEdit) {
        payload.id = editingItem.id;
        payload.available = itemAvailable;
      }

      const response = await fetch(getApiUrl('admin-manage-menu'), {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('admin_token');
        onSessionExpired();
        return;
      }

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao salvar item do cardápio.');
      }

      setSuccessNotice(
        isEdit
          ? `Item "${result.name}" atualizado com sucesso!`
          : `Item "${result.name}" cadastrado com sucesso!`
      );
      setTimeout(() => setSuccessNotice(null), 4000);

      closeItemModal();
      fetchMenuData();
    } catch (err: unknown) {
      console.error('[Admin Save Menu Item Error]:', err);
      const msg = err instanceof Error ? err.message : 'Erro ao processar item.';
      setItemError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredItems = items.filter((item) => {
    if (selectedCategoryFilter === 'all') return true;
    return item.category_id === selectedCategoryFilter;
  });

  return (
    <div className="space-y-6">
      {/* Global Alerts */}
      {successNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="font-medium">{successNotice}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5 shadow-xs">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-NAVEGAÇÃO DO CARDÁPIO (As 3 Abas Solicitadas)        */}
      {/* ========================================================= */}
      <div className="bg-[#FFFFFF] border border-[#F9F3F1] rounded-2xl p-2 sm:p-2.5 shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          {/* Sub-Aba 1: Banner do Cardápio */}
          <button
            type="button"
            id="subtab-banner"
            onClick={() => setActiveSubTab('banner')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeSubTab === 'banner'
                ? 'bg-[#FD4912] text-white shadow-sm shadow-[#FD4912]/20'
                : 'text-[#090909]/70 hover:text-[#090909] hover:bg-[#F9F3F1]'
            }`}
          >
            <LayoutTemplate className="w-4 h-4" />
            <span>Banner do Cardápio</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-md uppercase font-bold tracking-wider ${
                activeSubTab === 'banner'
                  ? 'bg-white/20 text-white'
                  : 'bg-[#F9F3F1] text-[#090909]/60'
              }`}
            >
              Destaque
            </span>
          </button>

          {/* Sub-Aba 2: Categorias */}
          <button
            type="button"
            id="subtab-categories"
            onClick={() => setActiveSubTab('categories')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeSubTab === 'categories'
                ? 'bg-[#FD4912] text-white shadow-sm shadow-[#FD4912]/20'
                : 'text-[#090909]/70 hover:text-[#090909] hover:bg-[#F9F3F1]'
            }`}
          >
            <FolderTree className="w-4 h-4" />
            <span>Categorias</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono font-bold ${
                activeSubTab === 'categories'
                  ? 'bg-white/20 text-white'
                  : 'bg-[#F9F3F1] text-[#090909]/60'
              }`}
            >
              {categories.length}
            </span>
          </button>

          {/* Sub-Aba 3: Pratos & Lanches */}
          <button
            type="button"
            id="subtab-items"
            onClick={() => setActiveSubTab('items')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeSubTab === 'items'
                ? 'bg-[#FD4912] text-white shadow-sm shadow-[#FD4912]/20'
                : 'text-[#090909]/70 hover:text-[#090909] hover:bg-[#F9F3F1]'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span>Pratos & Lanches</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono font-bold ${
                activeSubTab === 'items'
                  ? 'bg-white/20 text-white'
                  : 'bg-[#F9F3F1] text-[#090909]/60'
              }`}
            >
              {items.length}
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ABA 1: BANNER DO CARDÁPIO                                                 */}
      {/* ========================================================================= */}
      {activeSubTab === 'banner' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-white border border-[#F9F3F1] rounded-2xl p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F9F3F1]">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#FD4912]/10 flex items-center justify-center text-[#FD4912]">
                    <LayoutTemplate className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#090909]">
                      Banner Principal do Cardápio
                    </h2>
                    <p className="text-xs text-[#090909]/60 mt-0.5">
                      Edite os textos de boas-vindas, o badge superior e a foto de destaque que aparecem no topo do cardápio público.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    bannerActive
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}
                >
                  {bannerActive ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Banner Visível
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5 text-slate-400" />
                      Banner Oculto
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Banner Messages */}
            {bannerSuccess && (
              <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="font-semibold">{bannerSuccess}</span>
              </div>
            )}

            {bannerError && (
              <div className="mt-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span className="font-semibold">{bannerError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSaveBanner} className="mt-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Badge Text */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#090909] mb-1.5">
                    Texto do Badge Superior
                  </label>
                  <input
                    type="text"
                    value={bannerBadgeText}
                    onChange={(e) => setBannerBadgeText(e.target.value)}
                    placeholder="Ex: SNACK BAR & GASTRONOMIA"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F9F3F1] border border-transparent focus:border-[#FD4912] focus:bg-white text-xs text-[#090909] outline-none transition-all font-semibold"
                  />
                  <span className="text-[11px] text-[#090909]/50 mt-1 block">
                    Pequena etiqueta em destaque que aparece acima do título.
                  </span>
                </div>

                {/* Main Title */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#090909] mb-1.5">
                    Título Principal *
                  </label>
                  <input
                    type="text"
                    required
                    value={bannerTitle}
                    onChange={(e) => setBannerTitle(e.target.value)}
                    placeholder="Ex: Cardápio do Parque"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F9F3F1] border border-transparent focus:border-[#FD4912] focus:bg-white text-xs text-[#090909] outline-none transition-all font-bold"
                  />
                  <span className="text-[11px] text-[#090909]/50 mt-1 block">
                    Título com grande impacto visual no topo da página.
                  </span>
                </div>
              </div>

              {/* Subtitle / Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#090909] mb-1.5">
                  Texto de Apoio / Subtítulo
                </label>
                <textarea
                  rows={3}
                  value={bannerSubtitle}
                  onChange={(e) => setBannerSubtitle(e.target.value)}
                  placeholder="Ex: Peça online pelo celular e retire rapidamente no balcão central de alimentação sem pegar filas..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F9F3F1] border border-transparent focus:border-[#FD4912] focus:bg-white text-xs text-[#090909] outline-none transition-all resize-none"
                />
              </div>

              {/* Image Upload for Banner */}
              <div className="pt-2">
                <ImageUploadField
                  id="menu-banner-image-upload"
                  label="Imagem de Fundo ou Destaque do Banner"
                  value={bannerImageUrl}
                  onChange={(url) => setBannerImageUrl(url)}
                  accentColor="orange"
                  helperText="Envie uma foto convidativa de alimentos, lanches ou do espaço gastronômico (máx. 10MB). A imagem será exibida com um gradiente direcional nítido."
                />
              </div>

              {/* Card de Destaque / Oferta Especial (Item Destaque do Banner) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#F9F3F1]/70 border border-[#F9F3F1] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#FD4912]" />
                    <h3 className="text-xs font-bold text-[#090909] uppercase tracking-wider">
                      Card de Destaque Lateral (Opcional)
                    </h3>
                  </div>
                  {bannerFeaturedItemId ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                      Card Ativo
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#090909]/50 bg-white px-2.5 py-0.5 rounded-full border border-[#090909]/10">
                      Oculto (Largura Total)
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-[#090909]/65 leading-relaxed">
                  Escolha um item do cardápio para aparecer em evidência ao lado do banner, com foto, preço e botão direto para pedir. Se selecionar <strong>"Nenhum"</strong>, o card não será exibido e o banner ocupará a largura inteira da página.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Seletor de Item */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="banner-featured-item-select"
                      className="block text-xs font-bold text-[#090909] uppercase tracking-wider"
                    >
                      Item em Destaque
                    </label>
                    <select
                      id="banner-featured-item-select"
                      value={bannerFeaturedItemId}
                      onChange={(e) => setBannerFeaturedItemId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#090909]/15 focus:border-[#FD4912] text-xs text-[#090909] font-medium outline-none transition-all cursor-pointer shadow-xs"
                    >
                      <option value="">Nenhum (Não exibir card de destaque)</option>
                      {items.map((item) => {
                        const price = (item.price_cents / 100).toFixed(2);
                        const promoPrice = item.promo_price_cents
                          ? (item.promo_price_cents / 100).toFixed(2)
                          : null;
                        return (
                          <option key={item.id} value={item.id}>
                            {item.name} — ${promoPrice ? `${promoPrice} (Promo)` : price}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Texto do Badge do Card de Destaque */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="banner-featured-badge-text"
                      className="block text-xs font-bold text-[#090909] uppercase tracking-wider"
                    >
                      Texto do Badge do Card
                    </label>
                    <input
                      type="text"
                      id="banner-featured-badge-text"
                      value={bannerFeaturedBadgeText}
                      onChange={(e) => setBannerFeaturedBadgeText(e.target.value)}
                      placeholder="Ex: OFERTA ESPECIAL, MAIS PEDIDO, NOVIDADE..."
                      disabled={!bannerFeaturedItemId}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#090909]/15 focus:border-[#FD4912] disabled:opacity-40 disabled:cursor-not-allowed text-xs text-[#090909] outline-none transition-all shadow-xs"
                    />
                    <span className="text-[10px] text-[#090909]/50 block">
                      Texto do selo de destaque (ex: OFERTA ESPECIAL, MAIS PEDIDO, NOVIDADE).
                    </span>
                  </div>
                </div>
              </div>

              {/* Toggle Active */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-[#F9F3F1] border border-[#F9F3F1]">
                <div>
                  <span className="block text-xs font-bold text-[#090909]">
                    Exibir Banner no Cardápio Público
                  </span>
                  <span className="text-[11px] text-[#090909]/60">
                    Quando desmarcado, a página do cardápio vai direto para a busca e as categorias.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bannerActive}
                    onChange={(e) => setBannerActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FD4912]"></div>
                </label>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-3">
                <button
                  type="submit"
                  disabled={isSavingBanner}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#FD4912] hover:bg-[#FD4912]/90 active:scale-[0.98] disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-[#FD4912]/20 cursor-pointer"
                >
                  {isSavingBanner ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Salvando Banner...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Salvar Alterações do Banner</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Live Preview Card */}
          {(() => {
            const previewFeaturedItem = bannerFeaturedItemId
              ? items.find((it) => it.id === bannerFeaturedItemId)
              : null;

            return (
              <div className="bg-white border border-[#F9F3F1] rounded-2xl p-5 sm:p-6 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#090909]/70 uppercase tracking-wider">
                  <Eye className="w-4 h-4 text-[#FD4912]" />
                  <span>Pré-visualização em Tempo Real (Como o cliente vê no site)</span>
                </div>

                <div className="relative overflow-hidden rounded-2xl bg-[#FFFFFF] border border-[#F9F3F1] p-6 sm:p-8 shadow-xs">
                  {/* Directional gradient on banner image: high contrast on text, crisp & visible photo */}
                  {bannerImageUrl && (
                    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                      <img
                        src={bannerImageUrl}
                        alt="Banner Preview"
                        className="w-full h-full object-cover object-center"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 to-white/20 sm:to-transparent" />
                    </div>
                  )}

                  <div
                    className={`relative z-10 ${
                      previewFeaturedItem
                        ? 'grid grid-cols-1 lg:grid-cols-12 gap-6 items-center'
                        : 'max-w-2xl'
                    }`}
                  >
                    {/* Left: Banner Info */}
                    <div className={`${previewFeaturedItem ? 'lg:col-span-7 xl:col-span-8' : ''} space-y-3`}>
                      <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[#FD4912] px-3.5 py-1.5 rounded-full bg-[#FD4912]/10 border border-[#FD4912]/20 shadow-xs">
                        <Utensils className="w-3.5 h-3.5 text-[#FD4912]" />
                        <span>{bannerBadgeText || 'SNACK BAR & GASTRONOMIA'}</span>
                      </div>

                      <h3 className="text-xl sm:text-2xl md:text-3xl font-bold uppercase tracking-tight text-[#090909] leading-[1.1]">
                        {bannerTitle || 'Cardápio do Parque'}
                      </h3>

                      <p className="text-xs sm:text-sm text-[#090909]/70 leading-relaxed max-w-xl">
                        {bannerSubtitle ||
                          'Peça online pelo celular e retire rapidamente no balcão central de alimentação sem pegar filas.'}
                      </p>
                    </div>

                    {/* Right: Featured Item Card (Only if selected) */}
                    {previewFeaturedItem && (
                      <div className="lg:col-span-5 xl:col-span-4">
                        <div className="rounded-2xl bg-[#FFFFFF] border border-[#F9F3F1] p-3.5 shadow-sm relative overflow-hidden">
                          <div className="flex items-center justify-between gap-2 mb-2.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#FD4912] text-white text-[10px] font-bold uppercase tracking-wider">
                              <Sparkles className="w-3 h-3 stroke-[2.5]" />
                              <span>{bannerFeaturedBadgeText || 'OFERTA ESPECIAL'}</span>
                            </span>
                            <span className="text-[10px] text-[#FDCF00] font-bold uppercase tracking-widest flex items-center gap-1">
                              ★ Mais Pedido
                            </span>
                          </div>

                          <div className="flex gap-3 items-center">
                            <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-[#F9F3F1] flex-shrink-0 border border-[#F9F3F1]">
                              {previewFeaturedItem.image_url ? (
                                <img
                                  src={previewFeaturedItem.image_url}
                                  alt={previewFeaturedItem.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-[#F9F3F1] flex flex-col items-center justify-center text-[#FD4912] p-2 text-center">
                                  <Utensils className="w-5 h-5 stroke-[1.5]" />
                                  <span className="text-[8px] text-[#090909]/60 font-mono mt-1 uppercase">Destaque</span>
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs sm:text-sm font-bold text-[#090909] truncate">
                                {previewFeaturedItem.name}
                              </h4>
                              <p className="text-[10px] sm:text-[11px] text-[#090909]/70 line-clamp-2 mt-0.5 leading-snug">
                                {previewFeaturedItem.description || 'Item selecionado em destaque especial.'}
                              </p>
                              <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#F9F3F1]">
                                <span className="text-xs font-bold text-[#FD4912] font-mono">
                                  $
                                  {previewFeaturedItem.promo_price_cents
                                    ? (previewFeaturedItem.promo_price_cents / 100).toFixed(2)
                                    : (previewFeaturedItem.price_cents / 100).toFixed(2)}
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-[#FD4912] text-white text-[9px] font-bold uppercase tracking-wider">
                                  Ver / Pedir
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 2: CATEGORIAS DO CARDÁPIO                                             */}
      {/* ========================================================================= */}
      {activeSubTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#F9F3F1] rounded-2xl p-4 sm:p-5 shadow-xs">
            <div>
              <h2 className="text-base font-bold text-[#090909] uppercase tracking-tight flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-[#FD4912]" />
                Categorias do Cardápio
              </h2>
              <p className="text-xs text-[#090909]/60 mt-0.5">
                Organize as seções do restaurante (ex: Lanches, Porções, Bebidas, Sobremesas) com fotos ilustrativas.
              </p>
            </div>

            <button
              id="btn-new-category"
              onClick={openCreateCategoryModal}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#FD4912] hover:bg-[#FD4912]/90 active:scale-[0.98] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-sm shadow-[#FD4912]/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Categoria</span>
            </button>
          </div>

          {/* Categories Table */}
          <div className="bg-white border border-[#F9F3F1] rounded-2xl overflow-hidden shadow-xs">
            {isLoading ? (
              <div className="py-12 text-center flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 text-[#FD4912] animate-spin" />
                <span className="text-xs text-[#090909]/60">Carregando categorias...</span>
              </div>
            ) : categories.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <p className="text-xs text-[#090909]/60">
                  Nenhuma categoria cadastrada. Crie uma para começar a adicionar itens.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#F9F3F1] bg-[#F9F3F1]/60 text-[#090909]/70 uppercase tracking-wider font-bold text-[11px]">
                      <th className="py-3 px-4">Foto</th>
                      <th className="py-3 px-4">Nome da Categoria</th>
                      <th className="py-3 px-4 text-center">Itens Vinculados</th>
                      <th className="py-3 px-4 text-center">Ordem</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F9F3F1]">
                    {categories.map((cat) => {
                      const count = items.filter((i) => i.category_id === cat.id).length;
                      return (
                        <tr
                          key={cat.id}
                          id={`category-row-${cat.id}`}
                          className="hover:bg-[#F9F3F1]/40 transition-colors"
                        >
                          {/* Miniatura da Categoria */}
                          <td className="py-3 px-4">
                            {cat.image_url ? (
                              <img
                                src={cat.image_url}
                                alt={cat.name}
                                className="w-10 h-10 rounded-xl object-cover border border-[#F9F3F1] shadow-xs"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-[#F9F3F1] border border-[#F9F3F1] flex items-center justify-center text-[#FD4912]">
                                <FolderTree className="w-4 h-4" />
                              </div>
                            )}
                          </td>

                          <td className="py-3 px-4 font-bold text-[#090909]">
                            <span>{cat.name}</span>
                          </td>

                          <td className="py-3 px-4 text-center text-[#090909]/70 font-mono">
                            <span className="inline-block px-2 py-0.5 rounded-md bg-[#F9F3F1] font-semibold text-[11px]">
                              {count} {count === 1 ? 'item' : 'itens'}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-center text-[#090909]/60 font-mono">
                            {cat.display_order}
                          </td>

                          <td className="py-3 px-4 text-center">
                            {cat.active ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold uppercase tracking-wider">
                                <CheckCircle2 className="w-3 h-3" /> Ativa
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 text-[11px] font-bold uppercase tracking-wider">
                                <XCircle className="w-3 h-3" /> Inativa
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <button
                              id={`btn-edit-cat-${cat.id}`}
                              onClick={() => openEditCategoryModal(cat)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F9F3F1] hover:bg-[#FD4912]/10 hover:text-[#FD4912] text-[#090909] text-xs font-bold transition-all cursor-pointer border border-[#F9F3F1]"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Editar</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 3: PRATOS & LANCHES                                                    */}
      {/* ========================================================================= */}
      {activeSubTab === 'items' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#F9F3F1] rounded-2xl p-4 sm:p-5 shadow-xs">
            <div>
              <h2 className="text-base font-bold text-[#090909] uppercase tracking-tight flex items-center gap-2">
                <UtensilsCrossed className="w-5 h-5 text-[#FD4912]" />
                Pratos & Lanches do Cardápio
              </h2>
              <p className="text-xs text-[#090909]/60 mt-0.5">
                Gerencie fotos, ingredientes, variações de porção com preços independentes e destaques.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
              {/* Featured Home Counter Badge */}
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F9F3F1] border border-[#F9F3F1] text-xs font-semibold text-[#090909]">
                <Star
                  className={`w-3.5 h-3.5 ${
                    items.filter((i) => i.featured_home).length > 0
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-400'
                  }`}
                />
                <span>Destaques Home:</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-bold ${
                    items.filter((i) => i.featured_home).length === 3
                      ? 'text-amber-800 bg-amber-100 border border-amber-300'
                      : 'text-[#090909] bg-white'
                  }`}
                >
                  {items.filter((i) => i.featured_home).length}/3
                </span>
              </div>

              {/* Filter by Category */}
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-[#F9F3F1] border border-transparent text-xs text-[#090909] outline-none focus:border-[#FD4912] font-semibold cursor-pointer"
              >
                <option value="all">Todas as categorias ({items.length})</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({items.filter((i) => i.category_id === cat.id).length})
                  </option>
                ))}
              </select>

              <button
                id="btn-new-menu-item"
                onClick={openCreateItemModal}
                disabled={categories.length === 0}
                title={categories.length === 0 ? 'Crie uma categoria primeiro' : ''}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#FD4912] hover:bg-[#FD4912]/90 active:scale-[0.98] disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-sm shadow-[#FD4912]/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Prato / Item</span>
              </button>
            </div>
          </div>

          {/* Items Table */}
          <div className="bg-white border border-[#F9F3F1] rounded-2xl overflow-hidden shadow-xs">
            {isLoading ? (
              <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-7 h-7 text-[#FD4912] animate-spin" />
                <span className="text-xs text-[#090909]/60 uppercase tracking-wider">
                  Carregando itens do cardápio...
                </span>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="py-16 px-4 text-center">
                <UtensilsCrossed className="w-10 h-10 text-[#090909]/20 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-[#090909] uppercase tracking-tight">
                  Nenhum item encontrado
                </h3>
                <p className="text-xs text-[#090909]/60 mt-1 max-w-sm mx-auto">
                  {categories.length === 0
                    ? 'Você precisa cadastrar pelo menos uma categoria na aba "Categorias" antes de cadastrar itens.'
                    : 'Clique em "Novo Prato / Item" acima para adicionar pratos ao cardápio.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#F9F3F1] bg-[#F9F3F1]/60 text-[#090909]/70 uppercase tracking-wider font-bold text-[11px]">
                      <th className="py-3.5 px-4">Prato / Bebida</th>
                      <th className="py-3.5 px-4">Categoria</th>
                      <th className="py-3.5 px-4">Preço Base</th>
                      <th className="py-3.5 px-4">Variações</th>
                      <th className="py-3.5 px-4 text-center">Ordem</th>
                      <th className="py-3.5 px-4 text-center">Destaque Home</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F9F3F1]">
                    {filteredItems.map((item) => {
                      const variationCount = Array.isArray(item.variations)
                        ? item.variations.length
                        : 0;
                      return (
                        <tr
                          key={item.id}
                          id={`menu-item-row-${item.id}`}
                          className="hover:bg-[#F9F3F1]/40 transition-colors"
                        >
                          {/* Item + Imagem */}
                          <td className="py-3.5 px-4 font-semibold text-[#090909]">
                            <div className="flex items-center gap-3">
                              {item.image_url ? (
                                <img
                                  src={item.image_url}
                                  alt={item.name}
                                  className="w-12 h-12 rounded-xl object-cover border border-[#F9F3F1] flex-shrink-0 shadow-xs"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-xl bg-[#F9F3F1] border border-[#F9F3F1] flex items-center justify-center text-[#090909]/40 flex-shrink-0">
                                  <ImageIcon className="w-5 h-5" />
                                </div>
                              )}
                              <div>
                                <span className="font-bold text-[#090909] block">
                                  {item.name}
                                </span>
                                {item.description && (
                                  <span className="text-[11px] font-normal text-[#090909]/60 line-clamp-1 max-w-[220px]">
                                    {item.description}
                                  </span>
                                )}
                                {item.ingredients && (
                                  <span className="text-[10px] text-[#FD4912] font-medium line-clamp-1 max-w-[220px]">
                                    Ingredientes:{' '}
                                    {Array.isArray(item.ingredients)
                                      ? item.ingredients.join(', ')
                                      : item.ingredients}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Categoria */}
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F9F3F1] text-[#090909] text-[11px] font-semibold">
                              <Tag className="w-3 h-3 text-[#FD4912]" />
                              {item.category_name}
                            </span>
                          </td>

                          {/* Preço Normal e Promo */}
                          <td className="py-3.5 px-4 font-mono font-bold text-[#090909]">
                            <div>${(item.price_cents / 100).toFixed(2)}</div>
                            {item.promo_price_cents && (
                              <div className="text-amber-600 font-bold text-[11px] flex items-center gap-0.5">
                                <Sparkles className="w-2.5 h-2.5" />
                                Promo: ${(item.promo_price_cents / 100).toFixed(2)}
                              </div>
                            )}
                          </td>

                          {/* Variações Cadastradas */}
                          <td className="py-3.5 px-4">
                            {variationCount > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FD4912]/10 text-[#FD4912] text-[11px] font-bold">
                                <ListPlus className="w-3 h-3" />
                                {variationCount} {variationCount === 1 ? 'variação' : 'variações'}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">Tamanho único</span>
                            )}
                          </td>

                          {/* Ordem */}
                          <td className="py-3.5 px-4 text-center text-[#090909]/60 font-mono">
                            {item.display_order}
                          </td>

                          {/* Destaque Home Toggle */}
                          <td className="py-3.5 px-4 text-center">
                            <button
                              type="button"
                              id={`btn-toggle-featured-${item.id}`}
                              onClick={() => handleToggleFeaturedHome(item)}
                              disabled={isTogglingFeaturedId === item.id}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                item.featured_home
                                  ? 'bg-amber-50 text-amber-700 border border-amber-300 hover:bg-amber-100'
                                  : 'bg-[#F9F3F1] text-[#090909]/60 border border-[#F9F3F1] hover:text-[#090909] hover:bg-[#F9F3F1]/80'
                              }`}
                              title={
                                item.featured_home
                                  ? 'Remover do destaque na Home'
                                  : 'Destacar na seção Gastronomia da Home (máx. 3)'
                              }
                            >
                              {isTogglingFeaturedId === item.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                              ) : (
                                <Star
                                  className={`w-3.5 h-3.5 ${
                                    item.featured_home
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'text-slate-400'
                                  }`}
                                />
                              )}
                              <span>{item.featured_home ? 'Destacado' : 'Destacar'}</span>
                            </button>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4 text-center">
                            {item.available ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold uppercase tracking-wider">
                                <CheckCircle2 className="w-3 h-3" /> Disponível
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 text-[11px] font-bold uppercase tracking-wider">
                                <XCircle className="w-3 h-3" /> Esgotado
                              </span>
                            )}
                          </td>

                          {/* Ação */}
                          <td className="py-3.5 px-4 text-right">
                            <button
                              id={`btn-edit-item-${item.id}`}
                              onClick={() => openEditItemModal(item)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F9F3F1] hover:bg-[#FD4912]/10 hover:text-[#FD4912] text-[#090909] text-xs font-bold transition-all cursor-pointer border border-[#F9F3F1]"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Editar</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL CRIAR / EDITAR CATEGORIA                            */}
      {/* ========================================================= */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-[#F9F3F1] rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#F9F3F1]">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#090909] flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-[#FD4912]" />
                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
              </h3>
              <button
                onClick={closeCategoryModal}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {categoryError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span>{categoryError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#090909] mb-1">
                  Nome da Categoria *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Hambúrgueres Artesanais"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F9F3F1] border border-transparent focus:border-[#FD4912] focus:bg-white text-xs text-[#090909] placeholder-slate-400 outline-none font-semibold"
                />
              </div>

              {/* Upload de Imagem da Categoria */}
              <div>
                <ImageUploadField
                  id="category-image-upload"
                  label="Foto da Categoria"
                  value={categoryImageUrl}
                  onChange={(url) => setCategoryImageUrl(url)}
                  accentColor="orange"
                  helperText="Miniatura ilustrativa da categoria exibida na barra de navegação do cardápio."
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#090909] mb-1">
                  Ordem de Exibição
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    value={categoryDisplayOrder}
                    onChange={(e) => setCategoryDisplayOrder(e.target.value)}
                    className="w-full px-3 py-2 pl-7 rounded-xl bg-[#F9F3F1] border border-transparent focus:border-[#FD4912] focus:bg-white text-xs text-[#090909] outline-none font-mono"
                  />
                  <Layers className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              {editingCategory && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#F9F3F1] border border-[#F9F3F1]">
                  <div>
                    <span className="block text-xs font-bold text-[#090909]">
                      Status da Categoria
                    </span>
                    <span className="text-[11px] text-[#090909]/60">
                      {categoryActive ? 'Ativa no cardápio público' : 'Oculta'}
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={categoryActive}
                      onChange={(e) => setCategoryActive(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F9F3F1]">
                <button
                  type="button"
                  onClick={closeCategoryModal}
                  disabled={isSaving}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-[#FD4912] hover:bg-[#FD4912]/90 active:scale-[0.98] disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-[#FD4912]/20"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <span>{editingCategory ? 'Salvar Alterações' : 'Criar Categoria'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL CRIAR / EDITAR ITEM DO CARDÁPIO                     */}
      {/* ========================================================= */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-white border border-[#F9F3F1] rounded-3xl p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#F9F3F1]">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#090909] flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-[#FD4912]" />
                {editingItem ? 'Editar Item do Cardápio' : 'Novo Item do Cardápio'}
              </h3>
              <button
                onClick={closeItemModal}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {itemError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span>{itemError}</span>
              </div>
            )}

            <form onSubmit={handleSaveItem} className="space-y-4">
              {/* Categoria */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#090909] mb-1">
                  Categoria *
                </label>
                <select
                  required
                  value={itemCategoryId}
                  onChange={(e) => setItemCategoryId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F9F3F1] border border-transparent focus:border-[#FD4912] focus:bg-white text-xs text-[#090909] outline-none cursor-pointer font-semibold"
                >
                  <option value="" disabled>
                    Selecione uma categoria
                  </option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} {!cat.active && '(Inativa)'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Nome */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#090909] mb-1">
                  Nome do Prato / Bebida *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Combo Burger Mega Bacon + Fritas"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F9F3F1] border border-transparent focus:border-[#FD4912] focus:bg-white text-xs text-[#090909] placeholder-slate-400 outline-none font-bold"
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#090909] mb-1">
                  Descrição Comercial
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Hambúrguer suculento com bacon artesanal grelhado e batatas douradas crocantes..."
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F9F3F1] border border-transparent focus:border-[#FD4912] focus:bg-white text-xs text-[#090909] placeholder-slate-400 outline-none resize-none"
                />
              </div>

              {/* NOVO CAMPO: Ingredientes */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#090909]">
                    Ingredientes / Composição
                  </label>
                  <span className="text-[10px] text-[#090909]/50">Separados por vírgula</span>
                </div>
                <textarea
                  rows={2}
                  placeholder="Ex: Pão brioche artesanal, Blend 160g de carne nobre, Queijo cheddar duplo, Bacon crocante, Maionese verde especial da casa"
                  value={itemIngredients}
                  onChange={(e) => setItemIngredients(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F9F3F1] border border-transparent focus:border-[#FD4912] focus:bg-white text-xs text-[#090909] placeholder-slate-400 outline-none resize-none"
                />
                <span className="text-[10px] text-[#090909]/50 mt-1 block">
                  Exibidos em tags visuais na tela de detalhe do prato para orientar os clientes.
                </span>
              </div>

              {/* Preço Normal e Preço Promocional */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#090909] mb-1">
                    Preço Base ($ USD) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      placeholder="14.90"
                      value={itemPriceDollars}
                      onChange={(e) => setItemPriceDollars(e.target.value)}
                      className="w-full px-3 py-2 pl-7 rounded-xl bg-[#F9F3F1] border border-transparent focus:border-[#FD4912] focus:bg-white text-xs text-[#090909] placeholder-slate-400 outline-none font-mono font-bold"
                    />
                    <DollarSign className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#090909] mb-1">
                    Preço Promo ($ USD)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="11.90 (Opcional)"
                      value={itemPromoPriceDollars}
                      onChange={(e) => setItemPromoPriceDollars(e.target.value)}
                      className="w-full px-3 py-2 pl-7 rounded-xl bg-[#F9F3F1] border border-transparent focus:border-[#FD4912] focus:bg-white text-xs text-[#090909] placeholder-slate-400 outline-none font-mono"
                    />
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 absolute left-2.5 top-2.5" />
                  </div>
                </div>
              </div>

              {/* NOVO: Gerenciador de Variações de Tamanho / Porção */}
              <div className="p-4 rounded-2xl bg-[#F9F3F1]/80 border border-[#F9F3F1] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <ListPlus className="w-4 h-4 text-[#FD4912]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-[#090909]">
                      Variações de Tamanho / Porção
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddVariation}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FD4912] text-white text-[11px] font-bold hover:bg-[#FD4912]/90 transition-all cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Adicionar Opção</span>
                  </button>
                </div>

                <p className="text-[11px] text-[#090909]/60 leading-tight">
                  Adicione opções com preços específicos (ex: Individual, Duplo, Combo Mega, 500ml, 1 Litro). Se nenhuma variação for cadastrada, o item será vendido com o preço base único.
                </p>

                {itemVariations.length === 0 ? (
                  <div className="p-3 text-center rounded-xl bg-white border border-dashed border-[#F9F3F1] text-[11px] text-[#090909]/50">
                    Nenhuma variação adicionada. Este item terá preço único.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {itemVariations.map((variation, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2.5 bg-white rounded-xl border border-[#F9F3F1] shadow-xs"
                      >
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder="Nome (ex: Individual 300g, Combo Duplo)"
                            value={variation.name}
                            onChange={(e) =>
                              handleUpdateVariation(index, 'name', e.target.value)
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg bg-[#F9F3F1] border border-transparent focus:border-[#FD4912] text-xs text-[#090909] font-medium outline-none"
                          />
                        </div>

                        <div className="w-28 relative">
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            placeholder="Preço"
                            value={variation.priceDollars}
                            onChange={(e) =>
                              handleUpdateVariation(index, 'priceDollars', e.target.value)
                            }
                            className="w-full px-2 py-1.5 pl-6 rounded-lg bg-[#F9F3F1] border border-transparent focus:border-[#FD4912] text-xs text-[#090909] font-mono font-bold outline-none"
                          />
                          <DollarSign className="w-3 h-3 text-slate-400 absolute left-1.5 top-2.5" />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveVariation(index)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Remover variação"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Foto do Prato */}
              <ImageUploadField
                id="menu-item-image"
                label="Foto do Prato / Bebida"
                value={itemImageUrl}
                onChange={(url) => setItemImageUrl(url)}
                accentColor="orange"
                helperText="Envie uma foto em alta resolução do item do cardápio."
              />

              {/* Ordem */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#090909] mb-1">
                  Ordem de Exibição
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    value={itemDisplayOrder}
                    onChange={(e) => setItemDisplayOrder(e.target.value)}
                    className="w-full px-3 py-2 pl-7 rounded-xl bg-[#F9F3F1] border border-transparent focus:border-[#FD4912] focus:bg-white text-xs text-[#090909] outline-none font-mono"
                  />
                  <Layers className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              {/* Disponível Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#F9F3F1] border border-[#F9F3F1]">
                <div>
                  <span className="block text-xs font-bold text-[#090909]">Disponibilidade</span>
                  <span className="text-[11px] text-[#090909]/60">
                    {itemAvailable ? 'Disponível para venda imediata' : 'Esgotado / Oculto'}
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={itemAvailable}
                    onChange={(e) => setItemAvailable(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Destacar na Home Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#F9F3F1] border border-[#F9F3F1]">
                <div className="pr-3">
                  <div className="flex items-center gap-1.5">
                    <Star
                      className={`w-3.5 h-3.5 ${
                        itemFeaturedHome ? 'fill-amber-400 text-amber-400' : 'text-slate-400'
                      }`}
                    />
                    <span className="block text-xs font-bold text-[#090909]">
                      Destacar na Home
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        items.filter((it) => it.featured_home && it.id !== editingItem?.id)
                          .length +
                          (itemFeaturedHome ? 1 : 0) ===
                        3
                          ? 'text-amber-800 bg-amber-100 border border-amber-300'
                          : 'text-[#090909] bg-white'
                      }`}
                    >
                      {items.filter((it) => it.featured_home && it.id !== editingItem?.id).length +
                        (itemFeaturedHome ? 1 : 0)}
                      /3
                    </span>
                  </div>
                  <span className="text-[11px] text-[#090909]/60 block mt-0.5">
                    Exibir este prato nos 3 cards principais da seção Gastronomia da Home
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={itemFeaturedHome}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      if (checked) {
                        const otherFeatured = items.filter(
                          (it) => it.featured_home && it.id !== editingItem?.id
                        ).length;
                        if (otherFeatured >= 3) {
                          setItemError(
                            'Você já tem 3 itens destacados. Desmarque um antes de adicionar outro.'
                          );
                          return;
                        }
                      }
                      setItemError(null);
                      setItemFeaturedHome(checked);
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F9F3F1]">
                <button
                  type="button"
                  onClick={closeItemModal}
                  disabled={isSaving}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-[#FD4912] hover:bg-[#FD4912]/90 active:scale-[0.98] disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-[#FD4912]/20"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <span>{editingItem ? 'Salvar Alterações' : 'Cadastrar Item'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
