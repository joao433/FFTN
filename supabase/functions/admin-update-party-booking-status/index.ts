import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { getSupabaseClient } from '../_shared/supabase.ts';
import { verifyAdminToken, AuthError } from '../_shared/verifyAdmin.ts';

const VALID_STATUSES = ['pending', 'paid', 'confirmed', 'canceled'];

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') {
    return errorResponse('Método não permitido. Use POST.', 405);
  }

  try {
    verifyAdminToken(req);
  } catch (authErr: any) {
    return errorResponse(
      authErr.message || 'Acesso não autorizado.',
      authErr instanceof AuthError ? authErr.statusCode : 401
    );
  }

  try {
    let payload: any = {};
    try {
      payload = await req.json();
    } catch {
      return errorResponse('Payload JSON inválido.', 400);
    }

    const { booking_id, new_status, mark_balance_paid } = payload;

    if (!booking_id || typeof booking_id !== 'string') {
      return errorResponse('O campo booking_id é obrigatório.', 400);
    }

    if (!mark_balance_paid && (!new_status || !VALID_STATUSES.includes(new_status))) {
      return errorResponse(
        `Status inválido ou ausente. Valores permitidos: ${VALID_STATUSES.join(', ')}.`,
        400
      );
    }

    const supabase = getSupabaseClient();

    const { data: currentBooking, error: fetchErr } = await supabase
      .from('party_bookings')
      .select('*')
      .eq('id', booking_id)
      .maybeSingle();

    if (fetchErr || !currentBooking) {
      return errorResponse('Reserva de festa não encontrada.', 404);
    }

    const now = new Date().toISOString();
    const totalPrice = Number(currentBooking.total_price_cents || currentBooking.price_cents || 0);

    const updatePayload: Record<string, any> = {
      updated_at: now,
    };

    if (new_status && VALID_STATUSES.includes(new_status)) {
      updatePayload.status = new_status;
    }

    if (mark_balance_paid) {
      updatePayload.balance_paid = true;
      updatePayload.balance_due_cents = 0;
      updatePayload.amount_paid_cents = totalPrice;
      if (!new_status) {
        updatePayload.status = currentBooking.status === 'pending' ? 'confirmed' : currentBooking.status;
      }
    }

    let { data: updatedBooking, error: updateError } = await supabase
      .from('party_bookings')
      .update(updatePayload)
      .eq('id', booking_id)
      .select(`
        *,
        party_packages (
          id,
          name,
          duration_minutes
        )
      `)
      .single();

    if (updateError) {
      console.warn('[Admin Update Party Booking] Tentando payload simplificado:', updateError.message);
      const basicPayload: Record<string, any> = {
        updated_at: now,
      };
      if (new_status && VALID_STATUSES.includes(new_status)) {
        basicPayload.status = new_status;
      } else if (mark_balance_paid) {
        basicPayload.status = 'confirmed';
      }

      const fallbackUpdate = await supabase
        .from('party_bookings')
        .update(basicPayload)
        .eq('id', booking_id)
        .select(`
          *,
          party_packages (
            id,
            name
          )
        `)
        .single();

      if (fallbackUpdate.error) {
        console.error('[Admin Update Party Booking] Erro definitivo:', fallbackUpdate.error);
        return errorResponse('Erro ao atualizar a reserva de festa no banco.', 500);
      }
      updatedBooking = fallbackUpdate.data;
    }

    const pkgDuration = updatedBooking.party_packages?.duration_minutes || 120;
    const duration = updatedBooking.duration_minutes || pkgDuration;
    const bookingTotal =
      updatedBooking.total_price_cents !== null && updatedBooking.total_price_cents !== undefined
        ? Number(updatedBooking.total_price_cents)
        : Number(updatedBooking.price_cents || 0);

    const result = {
      id: updatedBooking.id,
      holder_name: updatedBooking.holder_name || updatedBooking.customer_name || 'Cliente',
      holder_email: updatedBooking.holder_email || updatedBooking.customer_email || '',
      holder_phone: updatedBooking.holder_phone || updatedBooking.customer_phone || '',
      package_name: updatedBooking.party_packages?.name || 'Pacote de Festa',
      event_date: updatedBooking.event_date || updatedBooking.party_date,
      start_time: updatedBooking.start_time || null,
      end_time: updatedBooking.end_time || null,
      duration_minutes: duration,
      guest_count: updatedBooking.guest_count,
      notes: updatedBooking.notes || updatedBooking.special_requests,
      payment_type: updatedBooking.payment_type || 'full',
      price_cents: bookingTotal,
      total_price_cents: bookingTotal,
      amount_paid_cents:
        updatedBooking.amount_paid_cents !== undefined
          ? Number(updatedBooking.amount_paid_cents)
          : bookingTotal,
      balance_due_cents:
        updatedBooking.balance_due_cents !== undefined
          ? Number(updatedBooking.balance_due_cents)
          : 0,
      balance_paid:
        updatedBooking.balance_paid !== undefined
          ? Boolean(updatedBooking.balance_paid)
          : true,
      status: updatedBooking.status,
      created_at: updatedBooking.created_at,
    };

    return jsonResponse(result);
  } catch (err: any) {
    console.error('[Admin Update Party Booking] Erro:', err);
    return errorResponse(err?.message || 'Erro interno do servidor ao atualizar reserva.', 500);
  }
});
