import React, { useState, useEffect, useCallback } from 'react';
import {
  UtensilsCrossed,
  Search,
  CheckCircle2,
  Clock,
  RefreshCw,
  AlertCircle,
  Loader2,
  Phone,
  Mail,
  User,
  ChefHat,
  PackageCheck,
  CheckCheck,
  XCircle,
  Calendar,
  Receipt,
  ArrowRight,
  X,
} from 'lucide-react';

interface MenuOrderItem {
  item_name: string;
  unit_price_cents: number;
  quantity: number;
}

interface MenuOrderRecord {
  id: string;
  holder_name: string;
  holder_email: string;
  holder_phone: string;
  status: 'pending' | 'paid' | 'preparing' | 'ready' | 'delivered' | 'canceled';
  total_price_cents: number;
  created_at: string;
  items: MenuOrderItem[];
}

interface AdminMenuOrdersTabProps {
  onSessionExpired: () => void;
}

export default function AdminMenuOrdersTab({ onSessionExpired }: AdminMenuOrdersTabProps) {
  const [orders, setOrders] = useState<MenuOrderRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Busca os pedidos de cardápio da Netlify Function
  const fetchOrders = useCallback(
    async (query: string = '', isSilent: boolean = false) => {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        onSessionExpired();
        return;
      }

      if (!isSilent) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setErrorMessage(null);

      try {
        const url = new URL('/.netlify/functions/admin-list-menu-orders', window.location.origin);
        if (query.trim()) {
          url.searchParams.set('search', query.trim());
        }

        const response = await fetch(url.toString(), {
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
          throw new Error(errData.error || 'Erro ao carregar lista de pedidos do cardápio.');
        }

        const data: MenuOrderRecord[] = await response.json();
        setOrders(Array.isArray(data) ? data : []);
      } catch (err: unknown) {
        console.error('[Admin Fetch Menu Orders Error]:', err);
        const msg = err instanceof Error ? err.message : 'Erro ao buscar pedidos do servidor.';
        setErrorMessage(msg);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [onSessionExpired]
  );

  // Carrega ao montar
  useEffect(() => {
    fetchOrders(searchQuery);
  }, [fetchOrders]); // eslint-disable-line react-hooks/exhaustive-deps

  // Busca com debounce quando o usuário digita
  useEffect(() => {
    const delayTimer = setTimeout(() => {
      fetchOrders(searchQuery, true);
    }, 350);

    return () => clearTimeout(delayTimer);
  }, [searchQuery, fetchOrders]);

  // Atualiza o status do pedido
  const handleUpdateOrderStatus = async (
    orderId: string,
    newStatus: 'preparing' | 'ready' | 'delivered'
  ) => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      onSessionExpired();
      return;
    }

    setUpdatingOrderId(orderId);
    setErrorMessage(null);
    setSuccessNotice(null);

    try {
      const response = await fetch('/.netlify/functions/admin-update-menu-order-status', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_id: orderId,
          new_status: newStatus,
        }),
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('admin_token');
        onSessionExpired();
        return;
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Erro ao atualizar o status do pedido.');
      }

      const updatedOrder: MenuOrderRecord = await response.json();

      // Atualiza o estado local imediatamente
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, status: updatedOrder.status }
            : o
        )
      );

      const statusLabels = {
        preparing: 'Em Preparo',
        ready: 'Pronto para Retirada',
        delivered: 'Entregue',
      };

      setSuccessNotice(`Pedido de "${updatedOrder.holder_name}" atualizado para: ${statusLabels[newStatus]}!`);
      setTimeout(() => setSuccessNotice(null), 4000);
    } catch (err: unknown) {
      console.error('[Admin Update Menu Order Error]:', err);
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar o pedido.';
      setErrorMessage(msg);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Renderiza o badge de status
  const renderStatusBadge = (status: MenuOrderRecord['status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold uppercase tracking-wider">
            <Clock className="w-3 h-3" /> Pendente
          </span>
        );
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-3 h-3" /> Pago
          </span>
        );
      case 'preparing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold uppercase tracking-wider">
            <ChefHat className="w-3 h-3" /> Preparando
          </span>
        );
      case 'ready':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-bold uppercase tracking-wider">
            <PackageCheck className="w-3 h-3" /> Pronto
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-bold uppercase tracking-wider">
            <CheckCheck className="w-3 h-3 text-emerald-600" /> Entregue
          </span>
        );
      case 'canceled':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 text-[11px] font-bold uppercase tracking-wider">
            <XCircle className="w-3 h-3" /> Cancelado
          </span>
        );
    }
  };

  // Formatação de data e hora do pedido
  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return 'Horário não disponível';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  // Filtragem de pedidos
  const filteredOrders = orders.filter((order) => {
    if (statusFilter === 'all') return true;
    return order.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Top Search & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
        {/* Search Box */}
        <div className="relative flex-1 max-w-lg">
          <input
            id="admin-menu-order-search-input"
            type="text"
            placeholder="Buscar por cliente, e-mail ou telefone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3.5 py-2.5 pl-9 pr-8 rounded-xl bg-[#FAF0E1] border border-[#EADCC9] focus:border-[#E8734A] focus:ring-1 focus:ring-[#E8734A] text-xs text-slate-900 placeholder-slate-400 transition-all outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-slate-400 hover:text-slate-600 absolute right-3 top-3 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Quick Filter & Refresh */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-[11px] overflow-x-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({orders.length})
            </button>
            <button
              onClick={() => setStatusFilter('paid')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                statusFilter === 'paid'
                  ? 'bg-emerald-600 text-white'
                  : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              Pagos ({orders.filter((o) => o.status === 'paid').length})
            </button>
            <button
              onClick={() => setStatusFilter('preparing')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                statusFilter === 'preparing'
                  ? 'bg-blue-600 text-white'
                  : 'text-blue-700 hover:bg-blue-50'
              }`}
            >
              Preparo ({orders.filter((o) => o.status === 'preparing').length})
            </button>
            <button
              onClick={() => setStatusFilter('ready')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                statusFilter === 'ready'
                  ? 'bg-purple-600 text-white'
                  : 'text-purple-700 hover:bg-purple-50'
              }`}
            >
              Prontos ({orders.filter((o) => o.status === 'ready').length})
            </button>
          </div>

          <button
            onClick={() => fetchOrders(searchQuery, false)}
            disabled={isLoading || isRefreshing}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
            title="Atualizar lista"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing || isLoading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* Success / Error Alerts */}
      {successNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Orders Grid / Cards */}
      {isLoading ? (
        <div className="py-24 text-center flex flex-col items-center justify-center gap-3 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <Loader2 className="w-7 h-7 text-[#E8734A] animate-spin" />
          <span className="text-xs text-slate-500 uppercase tracking-wider">
            Carregando pedidos do cardápio...
          </span>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="py-20 px-4 text-center bg-white border border-slate-200 rounded-2xl shadow-sm">
          <UtensilsCrossed className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">
            Nenhum pedido encontrado
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `Nenhum resultado corresponde ao termo "${searchQuery}". Tente buscar por outro cliente.`
              : statusFilter !== 'all'
              ? 'Nenhum pedido com o filtro de status selecionado.'
              : 'Nenhum pedido de cardápio registrado no momento.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredOrders.map((order) => {
            const isUpdating = updatingOrderId === order.id;
            const totalFormatted = (order.total_price_cents / 100).toFixed(2);
            const totalItemsCount = (order.items || []).reduce((acc, i) => acc + (i.quantity || 1), 0);

            return (
              <div
                key={order.id}
                id={`menu-order-card-${order.id}`}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col transition-all hover:border-slate-300"
              >
                {/* Card Top / Header */}
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Receipt className="w-3.5 h-3.5 text-[#E8734A]" />
                      <span className="text-xs font-mono font-bold text-slate-700">
                        Pedido #{order.id.slice(0, 8)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{formatDateTime(order.created_at)}</span>
                    </div>
                  </div>
                  <div>{renderStatusBadge(order.status)}</div>
                </div>

                {/* Customer Information */}
                <div className="p-4 border-b border-slate-100 bg-white text-xs space-y-1.5">
                  <div className="flex items-center gap-2 text-slate-900 font-semibold">
                    <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{order.holder_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{order.holder_email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 font-mono text-[11px]">
                    <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>{order.holder_phone}</span>
                  </div>
                </div>

                {/* Items List */}
                <div className="p-4 flex-1 space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1.5">
                    <span>Itens do Pedido ({totalItemsCount})</span>
                    <span>Qtd</span>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {order.items && order.items.length > 0 ? (
                      order.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-2 text-xs py-1.5 px-2 rounded-lg bg-slate-50 border border-slate-200/80"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#E8734A] flex-shrink-0" />
                            <span className="text-slate-900 font-medium truncate">{item.item_name}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="px-2 py-0.5 rounded bg-slate-200/70 text-slate-700 text-[11px] font-mono font-bold">
                              x{item.quantity}
                            </span>
                            <span className="text-[11px] text-slate-600 font-mono">
                              ${((item.unit_price_cents * item.quantity) / 100).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic py-2">Detalhes dos itens indisponíveis.</p>
                    )}
                  </div>
                </div>

                {/* Card Footer / Total & Actions */}
                <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
                  {/* Total Value */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600 font-medium">Total do Pedido:</span>
                    <span className="text-base font-black text-slate-900 font-mono">
                      ${totalFormatted}
                    </span>
                  </div>

                  {/* Actions depending on status */}
                  <div>
                    {order.status === 'paid' && (
                      <button
                        id={`order-action-preparing-${order.id}`}
                        onClick={() => handleUpdateOrderStatus(order.id, 'preparing')}
                        disabled={isUpdating}
                        className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                      >
                        {isUpdating ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Atualizando...</span>
                          </>
                        ) : (
                          <>
                            <ChefHat className="w-4 h-4" />
                            <span>Iniciar Preparo</span>
                            <ArrowRight className="w-3.5 h-3.5 ml-auto" />
                          </>
                        )}
                      </button>
                    )}

                    {order.status === 'preparing' && (
                      <button
                        id={`order-action-ready-${order.id}`}
                        onClick={() => handleUpdateOrderStatus(order.id, 'ready')}
                        disabled={isUpdating}
                        className="w-full py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 active:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                      >
                        {isUpdating ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Atualizando...</span>
                          </>
                        ) : (
                          <>
                            <PackageCheck className="w-4 h-4" />
                            <span>Marcar como Pronto</span>
                            <ArrowRight className="w-3.5 h-3.5 ml-auto" />
                          </>
                        )}
                      </button>
                    )}

                    {order.status === 'ready' && (
                      <button
                        id={`order-action-delivered-${order.id}`}
                        onClick={() => handleUpdateOrderStatus(order.id, 'delivered')}
                        disabled={isUpdating}
                        className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                      >
                        {isUpdating ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Atualizando...</span>
                          </>
                        ) : (
                          <>
                            <CheckCheck className="w-4 h-4" />
                            <span>Marcar como Entregue</span>
                            <ArrowRight className="w-3.5 h-3.5 ml-auto" />
                          </>
                        )}
                      </button>
                    )}

                    {order.status === 'pending' && (
                      <div className="py-2 text-center text-[11px] text-amber-700 font-medium bg-amber-50 rounded-xl border border-amber-200">
                        Aguardando confirmação de pagamento
                      </div>
                    )}

                    {order.status === 'delivered' && (
                      <div className="py-2 text-center text-[11px] text-emerald-700 font-semibold flex items-center justify-center gap-1.5 bg-emerald-50 rounded-xl border border-emerald-200">
                        <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> Pedido Concluído e Entregue
                      </div>
                    )}

                    {order.status === 'canceled' && (
                      <div className="py-2 text-center text-[11px] text-slate-500 font-semibold bg-slate-100 rounded-xl border border-slate-200">
                        Pedido Cancelado
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
