import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { getSupabaseClient } from '../_shared/supabase.ts';
import { getStripe } from '../_shared/stripe.ts';

function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, '0');
  const minutes = (totalMinutes % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

function checkTimeConflict(startA: number, endA: number, startB: number, endB: number): boolean {
  return Math.max(startA, startB) < Math.min(endA, endB);
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') {
    return errorResponse(`Método ${req.method} não permitido. Use POST.`, 405);
  }

  try {
    let payload: any = {};
    try {
      payload = await req.json();
    } catch {
      return errorResponse('Payload JSON inválido no corpo da requisição.', 400);
    }

    const {
      packageId,
      partyDate,
      startTime,
      guestCount,
      customerName,
      customerEmail,
      customerPhone,
      specialRequests,
    } = payload;

    if (!packageId || typeof packageId !== 'string') {
      return errorResponse('O pacote de festa é obrigatório.', 400);
    }

    if (!partyDate || !/^\d{4}-\d{2}-\d{2}$/.test(partyDate)) {
      return errorResponse('Data da festa inválida. Formato esperado: YYYY-MM-DD.', 400);
    }

    if (!startTime || !/^\d{2}:\d{2}$/.test(startTime)) {
      return errorResponse('Horário de início inválido. Formato esperado: HH:mm.', 400);
    }

    const guests = Number(guestCount);
    if (!Number.isInteger(guests) || guests <= 0) {
      return errorResponse('Quantidade de convidados deve ser um número inteiro positivo.', 400);
    }

    if (!customerName || typeof customerName !== 'string' || !customerName.trim()) {
      return errorResponse('O nome do cliente é obrigatório.', 400);
    }

    if (
      !customerEmail ||
      typeof customerEmail !== 'string' ||
      !customerEmail.includes('@')
    ) {
      return errorResponse('O e-mail do cliente é obrigatório e deve ser válido.', 400);
    }

    const supabase = getSupabaseClient();
    const stripe = getStripe();

    const { data: partyPackage, error: pkgError } = await supabase
      .from('party_packages')
      .select('*')
      .eq('id', packageId)
      .eq('active', true)
      .maybeSingle();

    if (pkgError || !partyPackage) {
      return errorResponse('Pacote de festa não encontrado ou desativado.', 404);
    }

    const durationMinutes = Number(partyPackage.duration_minutes || 120);
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = startMinutes + durationMinutes;
    const endTime = minutesToTime(endMinutes);

    const { data: existingBookings, error: bookingsError } = await supabase
      .from('party_bookings')
      .select('id, start_time, end_time, status, payment_status')
      .eq('party_date', partyDate)
      .not('status', 'eq', 'cancelled')
      .not('payment_status', 'eq', 'failed');

    if (bookingsError) {
      console.error('[Create Party Checkout Session] Erro ao verificar reservas:', bookingsError);
      return errorResponse('Erro ao verificar disponibilidade de horário.', 500);
    }

    if (existingBookings && existingBookings.length > 0) {
      for (const booking of existingBookings) {
        if (!booking.start_time || !booking.end_time) continue;
        const bStart = timeToMinutes(booking.start_time);
        const bEnd = timeToMinutes(booking.end_time);

        if (checkTimeConflict(startMinutes, endMinutes, bStart, bEnd)) {
          return errorResponse(
            `O horário selecionado (${startTime} às ${endTime}) conflita com outra reserva já existente no mesmo dia.`,
            409
          );
        }
      }
    }

    let requirePayment = true;
    let paymentMode = 'full';
    let depositPercentage = 50;

    try {
      const { data: settingsData } = await supabase
        .from('party_payment_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (settingsData) {
        requirePayment = settingsData.require_payment ?? true;
        paymentMode = settingsData.payment_mode || 'full';
        depositPercentage = Number(settingsData.deposit_percentage) || 50;
      }
    } catch (settErr) {
      console.warn('[Create Party Checkout Session] Configurações de pagamento não encontradas, usando padrão:', settErr);
    }

    const totalPackagePriceCents = Number(partyPackage.price_cents);
    let chargeAmountCents = totalPackagePriceCents;
    let paymentDescription = `Reserva de Festa: ${partyPackage.name} - ${partyDate} às ${startTime}`;

    if (paymentMode === 'deposit') {
      chargeAmountCents = Math.round((totalPackagePriceCents * depositPercentage) / 100);
      paymentDescription = `Sinal (${depositPercentage}%) Reserva: ${partyPackage.name} - ${partyDate} às ${startTime}`;
    }

    const appUrl = (
      Deno.env.get('APP_URL') ||
      req.headers.get('origin') ||
      'https://familyfuntown.com'
    ).replace(/\/$/, '');

    if (!requirePayment) {
      const { data: newBooking, error: insertError } = await supabase
        .from('party_bookings')
        .insert({
          package_id: partyPackage.id,
          customer_name: customerName.trim(),
          customer_email: customerEmail.trim().toLowerCase(),
          customer_phone: customerPhone ? customerPhone.trim() : null,
          party_date: partyDate,
          start_time: startTime,
          end_time: endTime,
          guest_count: guests,
          total_price_cents: totalPackagePriceCents,
          special_requests: specialRequests ? specialRequests.trim() : null,
          status: 'confirmed',
          payment_status: 'exempt',
        })
        .select('*')
        .single();

      if (insertError) {
        console.error('[Create Party Checkout Session] Erro ao criar reserva gratuita:', insertError);
        return errorResponse('Erro ao confirmar a reserva no banco de dados.', 500);
      }

      return jsonResponse({
        freeBooking: true,
        bookingId: newBooking.id,
        url: `${appUrl}/festas?booking_id=${newBooking.id}&free=true`,
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: customerEmail.trim().toLowerCase(),
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Reserva Family Fun Town - ${partyPackage.name}`,
              description: paymentDescription,
              images: partyPackage.image_url ? [partyPackage.image_url] : undefined,
            },
            unit_amount: chargeAmountCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/festas?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/festas`,
      metadata: {
        order_type: 'party_booking',
        package_id: partyPackage.id,
        package_name: partyPackage.name,
        party_date: partyDate,
        start_time: startTime,
        end_time: endTime,
        duration_minutes: String(durationMinutes),
        guest_count: String(guests),
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim().toLowerCase(),
        customer_phone: customerPhone ? customerPhone.trim() : '',
        special_requests: specialRequests ? specialRequests.trim() : '',
        payment_mode: paymentMode,
        deposit_percentage: String(depositPercentage),
        total_price_cents: String(totalPackagePriceCents),
        charge_amount_cents: String(chargeAmountCents),
      },
    });

    return jsonResponse({
      id: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error('[Create Party Checkout Session] Erro inesperado:', error);
    return errorResponse(error?.message || 'Erro interno ao iniciar reserva de festa.', 500);
  }
});
