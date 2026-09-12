import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { getSupabaseClient } from '../_shared/supabase.ts';
import { getStripe } from '../_shared/stripe.ts';

interface MenuItemPayload {
  id: string;
  quantity: number;
  selectedVariation?: {
    name: string;
    price_cents: number;
  };
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') {
    return errorResponse(`Método ${req.method} não permitido. Use POST.`, 405);
  }

  try {
    let payload: {
      items?: MenuItemPayload[];
      customerName?: string;
      customerPhone?: string;
      tableNumber?: string;
      notes?: string;
    } = {};

    try {
      payload = await req.json();
    } catch {
      return errorResponse('Payload JSON inválido no corpo da requisição.', 400);
    }

    const { items, customerName, customerPhone, tableNumber, notes } = payload;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return errorResponse('Nenhum item do cardápio selecionado.', 400);
    }

    if (!customerName || typeof customerName !== 'string' || !customerName.trim()) {
      return errorResponse('O nome do cliente é obrigatório para o pedido.', 400);
    }

    for (const item of items) {
      if (!item.id || typeof item.id !== 'string') {
        return errorResponse('Identificador de item inválido.', 400);
      }
      if (!item.quantity || !Number.isInteger(item.quantity) || item.quantity <= 0) {
        return errorResponse('Quantidade deve ser um número inteiro positivo.', 400);
      }
    }

    const supabase = getSupabaseClient();
    const stripe = getStripe();

    const itemIds = items.map((i) => i.id);
    const { data: dbItems, error: dbError } = await supabase
      .from('menu_items')
      .select('*')
      .in('id', itemIds)
      .eq('available', true);

    if (dbError) {
      console.error('[Create Menu Checkout Session] Erro ao consultar itens:', dbError);
      return errorResponse('Erro ao consultar itens do cardápio.', 500);
    }

    if (!dbItems || dbItems.length === 0) {
      return errorResponse('Nenhum dos itens selecionados está disponível no momento.', 404);
    }

    const itemMap = new Map(dbItems.map((item) => [item.id, item]));

    const missingIds = itemIds.filter((id) => !itemMap.has(id));
    if (missingIds.length > 0) {
      return errorResponse('Um ou mais itens não estão disponíveis para compra.', 400);
    }

    const appUrl = (
      Deno.env.get('APP_URL') ||
      req.headers.get('origin') ||
      'https://familyfuntown.com'
    ).replace(/\/$/, '');

    const lineItems: any[] = [];
    const itemsWithDetails: any[] = [];

    for (const item of items) {
      const dbItem = itemMap.get(item.id)!;

      let unitPriceCents = dbItem.price_cents;
      let variationName = '';

      if (
        dbItem.promo_price_cents &&
        dbItem.promo_price_cents > 0 &&
        dbItem.promo_price_cents < dbItem.price_cents
      ) {
        unitPriceCents = dbItem.promo_price_cents;
      }

      if (item.selectedVariation && Array.isArray(dbItem.variations)) {
        const foundVar = dbItem.variations.find(
          (v: any) => v.name === item.selectedVariation?.name
        );
        if (foundVar && foundVar.price_cents > 0) {
          unitPriceCents = foundVar.price_cents;
          variationName = ` (${foundVar.name})`;
        }
      }

      const displayName = `${dbItem.name}${variationName}`;

      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: displayName,
            description: dbItem.description || undefined,
            images: dbItem.image_url ? [dbItem.image_url] : undefined,
          },
          unit_amount: unitPriceCents,
        },
        quantity: item.quantity,
      });

      itemsWithDetails.push({
        menu_item_id: dbItem.id,
        name: displayName,
        quantity: item.quantity,
        unit_price_cents: unitPriceCents,
        total_cents: unitPriceCents * item.quantity,
        variation: variationName ? variationName.trim() : null,
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: lineItems,
      success_url: `${appUrl}/cardapio?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/cardapio`,
      metadata: {
        order_type: 'menu_order',
        customer_name: customerName.trim(),
        customer_phone: customerPhone ? customerPhone.trim() : '',
        table_number: tableNumber ? String(tableNumber).trim() : '',
        notes: notes ? notes.trim() : '',
        items_json: JSON.stringify(itemsWithDetails),
      },
    });

    return jsonResponse({
      id: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error('[Create Menu Checkout Session] Erro inesperado:', error);
    return errorResponse(error?.message || 'Erro interno ao criar pedido do cardápio.', 500);
  }
});
