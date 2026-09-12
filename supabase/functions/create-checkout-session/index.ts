import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { getSupabaseClient } from '../_shared/supabase.ts';
import { getStripe } from '../_shared/stripe.ts';

interface CheckoutItem {
  id: string;
  quantity: number;
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') {
    return errorResponse(`Método ${req.method} não permitido. Use POST.`, 405);
  }

  try {
    let payload: {
      items?: CheckoutItem[];
      customerEmail?: string;
      visitDate?: string;
      customerName?: string;
      customerPhone?: string;
    } = {};

    try {
      payload = await req.json();
    } catch {
      return errorResponse('Payload JSON inválido no corpo da requisição.', 400);
    }

    const { items, customerEmail, visitDate, customerName, customerPhone } = payload;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return errorResponse('Nenhum ingresso selecionado para o checkout.', 400);
    }

    for (const item of items) {
      if (!item.id || typeof item.id !== 'string') {
        return errorResponse('Identificador de ingresso inválido.', 400);
      }
      if (!item.quantity || !Number.isInteger(item.quantity) || item.quantity <= 0) {
        return errorResponse('Quantidade de ingressos deve ser um número inteiro positivo.', 400);
      }
    }

    const supabase = getSupabaseClient();
    const stripe = getStripe();

    const packageIds = items.map((i) => i.id);
    const { data: dbPackages, error: dbError } = await supabase
      .from('ticket_packages')
      .select('*')
      .in('id', packageIds)
      .eq('active', true);

    if (dbError) {
      console.error('[Create Checkout Session] Erro ao buscar pacotes no banco:', dbError);
      return errorResponse('Erro ao validar os pacotes selecionados no banco de dados.', 500);
    }

    if (!dbPackages || dbPackages.length === 0) {
      return errorResponse('Nenhum dos pacotes selecionados está ativo ou disponível.', 404);
    }

    const packageMap = new Map(dbPackages.map((pkg) => [pkg.id, pkg]));

    const missingIds = packageIds.filter((id) => !packageMap.has(id));
    if (missingIds.length > 0) {
      return errorResponse(
        `Um ou mais pacotes selecionados não existem ou foram desativados: ${missingIds.join(', ')}`,
        400
      );
    }

    const appUrl = (
      Deno.env.get('APP_URL') ||
      req.headers.get('origin') ||
      'https://familyfuntown.com'
    ).replace(/\/$/, '');

    const lineItems: any[] = [];
    const itemsWithDetails: any[] = [];

    for (const item of items) {
      const pkg = packageMap.get(item.id)!;

      const lineItem: any = {
        price_data: {
          currency: 'usd',
          product_data: {
            name: pkg.name,
            description: pkg.description || undefined,
            images: pkg.image_url ? [pkg.image_url] : undefined,
          },
          unit_amount: pkg.price_cents,
        },
        quantity: item.quantity,
      };

      lineItems.push(lineItem);

      itemsWithDetails.push({
        package_id: pkg.id,
        name: pkg.name,
        quantity: item.quantity,
        unit_price_cents: pkg.price_cents,
        total_cents: pkg.price_cents * item.quantity,
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: customerEmail || undefined,
      line_items: lineItems,
      success_url: `${appUrl}/ingressos?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/ingressos`,
      metadata: {
        order_type: 'tickets',
        customer_name: customerName || '',
        customer_email: customerEmail || '',
        customer_phone: customerPhone || '',
        visit_date: visitDate || '',
        items_json: JSON.stringify(itemsWithDetails),
      },
    });

    return jsonResponse({
      id: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error('[Create Checkout Session] Erro inesperado:', error);
    return errorResponse(error?.message || 'Erro interno ao criar sessão de checkout.', 500);
  }
});
