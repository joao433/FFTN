import React, { useState, useEffect, useCallback } from 'react';
import {
  UtensilsCrossed,
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
} from 'lucide-react';

interface MenuCategory {
  id: string;
  name: string;
  display_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
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
  display_order: number;
  available: boolean;
  created_at: string;
  updated_at: string;
}

interface AdminMenuTabProps {
  onSessionExpired: () => void;
}

export default function AdminMenuTab({ onSessionExpired }: AdminMenuTabProps) {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Filter state for Items list
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryDisplayOrder, setCategoryDisplayOrder] = useState('0');
  const [categoryActive, setCategoryActive] = useState(true);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  // Item Modal State
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemCategoryId, setItemCategoryId] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemPriceDollars, setItemPriceDollars] = useState('');
  const [itemPromoPriceDollars, setItemPromoPriceDollars] = useState('');
  const [itemImageUrl, setItemImageUrl] = useState('');
  const [itemDisplayOrder, setItemDisplayOrder] = useState('0');
  const [itemAvailable, setItemAvailable] = useState(true);
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
      const response = await fetch('/.netlify/functions/admin-manage-menu', {
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

      const data: { categories: MenuCategory[]; items: MenuItem[] } = await response.json();
      setCategories(Array.isArray(data.categories) ? data.categories : []);
      setItems(Array.isArray(data.items) ? data.items : []);
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

  // ================= CATEGORY MODAL HANDLERS =================
  const openCreateCategoryModal = () => {
    setEditingCategory(null);
    setCategoryName('');
    setCategoryDisplayOrder(String(categories.length * 10));
    setCategoryActive(true);
    setCategoryError(null);
    setIsCategoryModalOpen(true);
  };

  const openEditCategoryModal = (cat: MenuCategory) => {
    setEditingCategory(cat);
    setCategoryName(cat.name);
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
        display_order: displayOrderNum,
      };

      if (isEdit) {
        payload.id = editingCategory.id;
        payload.active = categoryActive;
      }

      const response = await fetch('/.netlify/functions/admin-manage-menu', {
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
    setItemPriceDollars('');
    setItemPromoPriceDollars('');
    setItemImageUrl('');
    setItemDisplayOrder(String(items.length * 10));
    setItemAvailable(true);
    setItemError(null);
    setIsItemModalOpen(true);
  };

  const openEditItemModal = (item: MenuItem) => {
    setEditingItem(item);
    setItemCategoryId(item.category_id);
    setItemName(item.name);
    setItemDescription(item.description || '');
    setItemPriceDollars((item.price_cents / 100).toFixed(2));
    setItemPromoPriceDollars(
      item.promo_price_cents ? (item.promo_price_cents / 100).toFixed(2) : ''
    );
    setItemImageUrl(item.image_url || '');
    setItemDisplayOrder(String(item.display_order ?? 0));
    setItemAvailable(item.available);
    setItemError(null);
    setIsItemModalOpen(true);
  };

  const closeItemModal = () => {
    setIsItemModalOpen(false);
    setEditingItem(null);
    setItemError(null);
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
        price_cents: priceCents,
        promo_price_cents: promoPriceCents,
        image_url: itemImageUrl.trim() || null,
        display_order: displayOrderNum,
      };

      if (isEdit) {
        payload.id = editingItem.id;
        payload.available = itemAvailable;
      }

      const response = await fetch('/.netlify/functions/admin-manage-menu', {
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
    <div className="space-y-8">
      {/* Alerts */}
      {successNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-800/80 text-emerald-200 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-red-950/70 border border-red-800/80 text-red-200 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* SEÇÃO 1: CATEGORIAS DO CARDÁPIO                          */}
      {/* ========================================================= */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-900/70 border border-neutral-800 rounded-2xl p-4 sm:p-5 shadow-lg">
          <div>
            <h2 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
              <FolderTree className="w-5 h-5 text-blue-500" />
              1. Categorias do Cardápio
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Organize as seções do restaurante (ex: Lanches, Bebidas, Sobremesas).
            </p>
          </div>

          <button
            id="btn-new-category"
            onClick={openCreateCategoryModal}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-blue-950/40 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Categoria</span>
          </button>
        </div>

        {/* Categories Table */}
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
          {isLoading ? (
            <div className="py-12 text-center flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
              <span className="text-xs text-neutral-400">Carregando categorias...</span>
            </div>
          ) : categories.length === 0 ? (
            <div className="py-10 px-4 text-center">
              <p className="text-xs text-neutral-400">
                Nenhuma categoria cadastrada. Crie uma para começar a adicionar itens.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-neutral-800 bg-neutral-950/60 text-neutral-400 uppercase tracking-wider font-bold text-[11px]">
                    <th className="py-3 px-4">Nome da Categoria</th>
                    <th className="py-3 px-4 text-center">Ordem</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {categories.map((cat) => (
                    <tr
                      key={cat.id}
                      id={`category-row-${cat.id}`}
                      className="hover:bg-neutral-800/30 transition-colors"
                    >
                      <td className="py-3 px-4 font-semibold text-white">
                        <div className="flex items-center gap-2">
                          <FolderTree className="w-3.5 h-3.5 text-blue-400" />
                          <span>{cat.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center text-neutral-400 font-mono">
                        {cat.display_order}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {cat.active ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold uppercase tracking-wider">
                            <CheckCircle2 className="w-3 h-3" /> Ativa
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-neutral-800 text-neutral-400 border border-neutral-700 text-[11px] font-bold uppercase tracking-wider">
                            <XCircle className="w-3 h-3" /> Inativa
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          id={`btn-edit-cat-${cat.id}`}
                          onClick={() => openEditCategoryModal(cat)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 text-neutral-200 text-xs font-bold transition-all cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3 text-neutral-400" />
                          <span>Editar</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* SEÇÃO 2: ITENS DO CARDÁPIO                                */}
      {/* ========================================================= */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-900/70 border border-neutral-800 rounded-2xl p-4 sm:p-5 shadow-lg">
          <div>
            <h2 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
              <UtensilsCrossed className="w-5 h-5 text-orange-500" />
              2. Itens do Cardápio
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Gerencie pratos, lanches, bebidas, preços promocionais e estoque.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {/* Filter by Category */}
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-300 outline-none focus:border-orange-500 font-semibold cursor-pointer"
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
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 active:bg-orange-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-orange-950/40 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Item</span>
            </button>
          </div>
        </div>

        {/* Items Table */}
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
          {isLoading ? (
            <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-7 h-7 text-orange-500 animate-spin" />
              <span className="text-xs text-neutral-400 uppercase tracking-wider">
                Carregando itens do cardápio...
              </span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-16 px-4 text-center">
              <UtensilsCrossed className="w-10 h-10 text-neutral-700 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-white uppercase tracking-tight">
                Nenhum item encontrado
              </h3>
              <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                {categories.length === 0
                  ? 'Você precisa cadastrar pelo menos uma categoria acima antes de cadastrar itens.'
                  : 'Clique em "Novo Item" acima para adicionar pratos ao cardápio.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-neutral-800 bg-neutral-950/60 text-neutral-400 uppercase tracking-wider font-bold text-[11px]">
                    <th className="py-3.5 px-4">Item</th>
                    <th className="py-3.5 px-4">Categoria</th>
                    <th className="py-3.5 px-4">Preço Original</th>
                    <th className="py-3.5 px-4">Preço Promo</th>
                    <th className="py-3.5 px-4 text-center">Ordem</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {filteredItems.map((item) => (
                    <tr
                      key={item.id}
                      id={`menu-item-row-${item.id}`}
                      className="hover:bg-neutral-800/30 transition-colors"
                    >
                      {/* Item + Imagem */}
                      <td className="py-3.5 px-4 font-semibold text-white">
                        <div className="flex items-center gap-3">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-10 h-10 rounded-lg object-cover border border-neutral-750 flex-shrink-0"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-center text-neutral-600 flex-shrink-0">
                              <ImageIcon className="w-4 h-4" />
                            </div>
                          )}
                          <div>
                            <span className="truncate max-w-[180px] block">{item.name}</span>
                            {item.description && (
                              <span className="text-[11px] font-normal text-neutral-400 line-clamp-1 max-w-[220px]">
                                {item.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Categoria */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-300 text-[11px] font-semibold">
                          <Tag className="w-3 h-3 text-neutral-400" />
                          {item.category_name}
                        </span>
                      </td>

                      {/* Preço Normal */}
                      <td className="py-3.5 px-4 font-mono font-bold text-neutral-200">
                        ${(item.price_cents / 100).toFixed(2)}
                      </td>

                      {/* Preço Promo */}
                      <td className="py-3.5 px-4 font-mono">
                        {item.promo_price_cents ? (
                          <span className="text-amber-400 font-bold flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            ${(item.promo_price_cents / 100).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-neutral-600 text-[11px]">-</span>
                        )}
                      </td>

                      {/* Ordem */}
                      <td className="py-3.5 px-4 text-center text-neutral-400 font-mono">
                        {item.display_order}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        {item.available ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold uppercase tracking-wider">
                            <CheckCircle2 className="w-3 h-3" /> Disponível
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-neutral-800 text-neutral-400 border border-neutral-700 text-[11px] font-bold uppercase tracking-wider">
                            <XCircle className="w-3 h-3" /> Esgotado
                          </span>
                        )}
                      </td>

                      {/* Ação */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          id={`btn-edit-item-${item.id}`}
                          onClick={() => openEditItemModal(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 text-neutral-200 text-xs font-bold transition-all cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3 text-neutral-400" />
                          <span>Editar</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL CRIAR / EDITAR CATEGORIA                            */}
      {/* ========================================================= */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-blue-500" />
                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
              </h3>
              <button
                onClick={closeCategoryModal}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {categoryError && (
              <div className="p-3 rounded-xl bg-red-950/70 border border-red-800/80 text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>{categoryError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-1">
                  Nome da Categoria *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Hambúrgueres Artesanais"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs text-white placeholder-neutral-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-1">
                  Ordem de Exibição
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    value={categoryDisplayOrder}
                    onChange={(e) => setCategoryDisplayOrder(e.target.value)}
                    className="w-full px-3 py-2 pl-7 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs text-white outline-none font-mono"
                  />
                  <Layers className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-2.5" />
                </div>
              </div>

              {editingCategory && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                  <div>
                    <span className="block text-xs font-bold text-white">Status da Categoria</span>
                    <span className="text-[11px] text-neutral-400">
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
                    <div className="w-10 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={closeCategoryModal}
                  disabled={isSaving}
                  className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-950/40"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-orange-500" />
                {editingItem ? 'Editar Item do Cardápio' : 'Novo Item do Cardápio'}
              </h3>
              <button
                onClick={closeItemModal}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {itemError && (
              <div className="p-3 rounded-xl bg-red-950/70 border border-red-800/80 text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>{itemError}</span>
              </div>
            )}

            <form onSubmit={handleSaveItem} className="space-y-4">
              {/* Categoria */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-1">
                  Categoria *
                </label>
                <select
                  required
                  value={itemCategoryId}
                  onChange={(e) => setItemCategoryId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-xs text-white outline-none cursor-pointer"
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
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-1">
                  Nome do Prato / Bebida *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Combo Burger Mega Bacon + Fritas"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-xs text-white placeholder-neutral-600 outline-none"
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-1">
                  Descrição / Ingredientes
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Pão brioche, 180g de blend artesanal, cheddar duplo, bacon crocante e maionese da casa"
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-xs text-white placeholder-neutral-600 outline-none resize-none"
                />
              </div>

              {/* Preço Normal e Preço Promocional */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-1">
                    Preço Normal ($ USD) *
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
                      className="w-full px-3 py-2 pl-7 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-xs text-white placeholder-neutral-600 outline-none font-mono"
                    />
                    <DollarSign className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-1">
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
                      className="w-full px-3 py-2 pl-7 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-xs text-white placeholder-neutral-600 outline-none font-mono"
                    />
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 absolute left-2.5 top-2.5" />
                  </div>
                </div>
              </div>

              {/* Imagem e Ordem */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-1">
                    URL da Foto (Opcional)
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={itemImageUrl}
                      onChange={(e) => setItemImageUrl(e.target.value)}
                      className="w-full px-3 py-2 pl-7 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-xs text-white placeholder-neutral-600 outline-none"
                    />
                    <ImageIcon className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-1">
                    Ordem
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="1"
                      value={itemDisplayOrder}
                      onChange={(e) => setItemDisplayOrder(e.target.value)}
                      className="w-full px-3 py-2 pl-7 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-xs text-white outline-none font-mono"
                    />
                    <Layers className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-2.5" />
                  </div>
                </div>
              </div>

              {/* Disponível Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                <div>
                  <span className="block text-xs font-bold text-white">Disponibilidade</span>
                  <span className="text-[11px] text-neutral-400">
                    {itemAvailable ? 'Disponível no cardápio' : 'Esgotado / Oculto'}
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={itemAvailable}
                    onChange={(e) => setItemAvailable(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={closeItemModal}
                  disabled={isSaving}
                  className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 active:bg-orange-700 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-orange-950/40"
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
