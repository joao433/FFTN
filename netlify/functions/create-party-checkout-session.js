import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Lazy initialization of Stripe and Supabase clients
function getStripe() {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    throw new Error('STRIPE_SECRET_KEY is not defined in environment variables.');
  }
  return new Stripe(apiKey);
}

function getSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseSecretKey =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error(
      'SUPABASE_URL or SUPABASE_SECRET_KEY is not defined in environment variables.'
    );
  }

  return createClient(supabaseUrl, supabaseSecretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function timeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const parts = timeStr.split(':').map((v) => parseInt(v, 10));
  if (isNaN(parts[0])) return null;
  return parts[0] * 60 + (parts[1] || 0);
}

function minutesToTime(totalMin) {
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export const handler = async (event) => {
  // 1. Aceita apenas requisições POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        Allow: 'POST',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Method Not Allowed. Use POST.' }),
    };
  }

  try {
    // 2. Parse e validação do payload JSON
    let payload = {};
    try {
      payload = JSON.parse(event.body || '{}');
    } catch {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Payload JSON inválido.' }),
      };
    }

    const {
      package_id,
      holder_name,
      holder_email,
      holder_phone,
      event_date,
      start_time = '14:00',
      payment_type = 'full', // 'none' | 'deposit' | 'full'
      guest_count = 10,
      notes = '',
    } = payload;

    if (!package_id || !holder_name || !holder_email || !holder_phone || !event_date) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error:
            'Campos obrigatórios faltando. Envie: package_id, holder_name, holder_email, holder_phone, event_date e start_time.',
        }),
      };
    }

    const supabase = getSupabase();

    // 3. Buscar o pacote de festa
    const { data: pkg, error: pkgError } = await supabase
      .from('party_packages')
      .select('*')
      .eq('id', package_id)
      .maybeSingle();

    if (pkgError) {
      console.error('[Create Party Checkout Session] Erro ao consultar party_packages:', pkgError);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Erro interno ao consultar o pacote de festa.' }),
      };
    }

    if (!pkg || !pkg.active) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Pacote de festa não encontrado ou inativo.',
        }),
      };
    }

    const packageDuration = Number(pkg.duration_minutes) || 120; // Padrão 2h

    // 4. Validação de horário de funcionamento (10h às 22h)
    const proposedStartMin = timeToMinutes(start_time);
    if (proposedStartMin === null || proposedStartMin < 10 * 60 || proposedStartMin > 21 * 60) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Horário de início inválido. O parque funciona das 10:00 às 22:00.',
        }),
      };
    }

    const proposedEndMin = proposedStartMin + packageDuration;
    if (proposedEndMin > 22 * 60) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: `A festa tem duração de ${Math.floor(packageDuration / 60)}h${packageDuration % 60 ? (packageDuration % 60) + 'min' : ''} e precisa terminar antes das 22:00 (fechamento do parque). Escolha um horário mais cedo.`,
        }),
      };
    }

    const computedStartTime = minutesToTime(proposedStartMin);
    const computedEndTime = minutesToTime(proposedEndMin);

    // 5. TRAVA DE SOBREPOSIÇÃO NO BACKEND (NUNCA DUAS FESTAS NO MESMO HORÁRIO)
    // O parque só tem 1 salão de festas. Nenhuma reserva ativa pode se sobrepor!
    const { data: existingBookings, error: checkOverlapError } = await supabase
      .from('party_bookings')
      .select('id, start_time, end_time, duration_minutes, status, holder_name')
      .eq('event_date', event_date)
      .neq('status', 'canceled');

    if (checkOverlapError) {
      console.warn('[Create Party Checkout Session] Aviso ao consultar sobreposição:', checkOverlapError);
    } else if (Array.isArray(existingBookings) && existingBookings.length > 0) {
      for (const booking of existingBookings) {
        if (!booking.start_time) continue; // Reservas legadas sem horário

        const existingStartMin = timeToMinutes(booking.start_time);
        if (existingStartMin === null) continue;

        const existDuration = Number(booking.duration_minutes) || 120;
        const existingEndMin = booking.end_time ? (timeToMinutes(booking.end_time) || (existingStartMin + existDuration)) : (existingStartMin + existDuration);

        // Verifica intersecção de intervalos [S1, E1) e [S2, E2)
        // Dois intervalos colidem se: proposedStartMin < existingEndMin && existingStartMin < proposedEndMin
        if (proposedStartMin < existingEndMin && existingStartMin < proposedEndMin) {
          const bookedFrom = minutesToTime(existingStartMin);
          const bookedTo = minutesToTime(existingEndMin);
          return {
            statusCode: 409,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              error: `Conflito de horário: o salão de festas já está reservado das ${bookedFrom} às ${bookedTo} nesta data (${event_date}). Por favor, selecione outro horário ou outro dia.`,
            }),
          };
        }
      }
    }

    // 6. Consultar configurações de pagamento de festas (party_payment_settings)
    let paymentSettings = {
      allow_no_deposit: true,
      allow_partial_deposit: true,
      deposit_percentage: 30,
      allow_full_payment: true,
    };

    try {
      const { data: settingsData } = await supabase
        .from('party_payment_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (settingsData) {
        paymentSettings = {
          allow_no_deposit: Boolean(settingsData.allow_no_deposit),
          allow_partial_deposit: Boolean(settingsData.allow_partial_deposit),
          deposit_percentage: Number(settingsData.deposit_percentage) || 30,
          allow_full_payment: Boolean(settingsData.allow_full_payment),
        };
      }
    } catch {
      // Usa fallback
    }

    // Valida a opção solicitada
    const normalizedPaymentType = ['none', 'deposit', 'full'].includes(payment_type) ? payment_type : 'full';

    if (normalizedPaymentType === 'none' && !paymentSettings.allow_no_deposit) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'A opção "Sem entrada" não está disponível no momento.' }),
      };
    }
    if (normalizedPaymentType === 'deposit' && !paymentSettings.allow_partial_deposit) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'A opção de entrada parcial não está disponível no momento.' }),
      };
    }
    if (normalizedPaymentType === 'full' && !paymentSettings.allow_full_payment) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'A opção de pagamento integral não está disponível no momento.' }),
      };
    }

    const totalPackagePriceCents = pkg.price_cents;
    const parsedGuestCount = typeof guest_count === 'number' ? guest_count : parseInt(guest_count, 10) || 10;

    let amountToChargeCents = totalPackagePriceCents;
    let initialAmountPaidCents = 0;
    let initialBalanceDueCents = totalPackagePriceCents;

    if (normalizedPaymentType === 'none') {
      amountToChargeCents = 0;
      initialAmountPaidCents = 0;
      initialBalanceDueCents = totalPackagePriceCents;
    } else if (normalizedPaymentType === 'deposit') {
      const percentage = Math.max(5, Math.min(90, paymentSettings.deposit_percentage || 30));
      amountToChargeCents = Math.round(totalPackagePriceCents * (percentage / 100));
      initialAmountPaidCents = 0; // Será preenchido quando a Stripe confirmar
      initialBalanceDueCents = totalPackagePriceCents - amountToChargeCents;
    } else {
      // 100% integral
      amountToChargeCents = totalPackagePriceCents;
      initialAmountPaidCents = 0; // Será totalPackagePriceCents ao confirmar
      initialBalanceDueCents = 0;
    }

    // 7. Inserir previamente o registro em party_bookings
    // Monta payload completo e faz fallback defensivo se colunas novas ainda não foram migradas
    const bookingInsertPayload = {
      package_id: pkg.id,
      holder_name: holder_name.trim(),
      holder_email: holder_email.trim().toLowerCase(),
      holder_phone: holder_phone.trim(),
      event_date,
      start_time: computedStartTime,
      end_time: computedEndTime,
      duration_minutes: packageDuration,
      guest_count: parsedGuestCount,
      notes: notes ? notes.trim() : null,
      price_cents: totalPackagePriceCents,
      total_price_cents: totalPackagePriceCents,
      payment_type: normalizedPaymentType,
      amount_paid_cents: initialAmountPaidCents,
      balance_due_cents: initialBalanceDueCents,
      balance_paid: false,
      status: 'pending',
    };

    let newBooking;
    const { data: insertedData, error: insertBookingError } = await supabase
      .from('party_bookings')
      .insert(bookingInsertPayload)
      .select()
      .single();

    if (insertBookingError) {
      console.warn('[Create Party Checkout Session] Falha com campos novos, tentando payload reduzido:', insertBookingError.message);
      // Tentar sem os novos campos caso a migração ainda não tenha rodado
      const legacyPayload = {
        package_id: pkg.id,
        holder_name: holder_name.trim(),
        holder_email: holder_email.trim().toLowerCase(),
        holder_phone: holder_phone.trim(),
        event_date,
        guest_count: parsedGuestCount,
        notes: notes ? notes.trim() : null,
        price_cents: totalPackagePriceCents,
        status: 'pending',
      };

      const { data: legacyData, error: legacyError } = await supabase
        .from('party_bookings')
        .insert(legacyPayload)
        .select()
        .single();

      if (legacyError) {
        console.error('[Create Party Checkout Session] Erro fatal ao inserir party_booking:', legacyError);
        return {
          statusCode: 500,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Erro ao registrar pré-reserva de festa no banco.' }),
        };
      }
      newBooking = legacyData;
    } else {
      newBooking = insertedData;
    }

    const appUrl = process.env.APP_URL || 'https://fftn.netlify.app';

    // 8. Se a opção for SEM ENTRADA, NÃO chamar Stripe! Finaliza direto com sucesso
    if (normalizedPaymentType === 'none') {
      const redirectSuccessUrl = `${appUrl}/sucesso?type=party&booking_id=${newBooking.id}&no_deposit=true`;
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          payment_type: 'none',
          booking_id: newBooking.id,
          redirect_url: redirectSuccessUrl,
          url: redirectSuccessUrl,
        }),
      };
    }

    // 9. Se for com entrada parcial ou 100% integral, criar Checkout Session na Stripe em USD
    const stripe = getStripe();
    const successUrl = `${appUrl}/sucesso?session_id={CHECKOUT_SESSION_ID}&type=party`;
    const cancelUrl = `${appUrl}/cancelado?type=party`;

    let productTitle = `Reserva de Festa: ${pkg.name}`;
    let productDesc = pkg.description || `Reserva para ${parsedGuestCount} convidados das ${computedStartTime} às ${computedEndTime}`;

    if (normalizedPaymentType === 'deposit') {
      const pct = paymentSettings.deposit_percentage || 30;
      productTitle = `Entrada (${pct}%) — Festa: ${pkg.name}`;
      productDesc = `Valor total: $${(totalPackagePriceCents / 100).toFixed(2)}. Saldo restante de $${(initialBalanceDueCents / 100).toFixed(2)} a pagar no parque.`;
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: holder_email.trim().toLowerCase(),
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: productTitle,
              description: productDesc,
            },
            unit_amount: amountToChargeCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        package_id: pkg.id,
        type: 'party',
        booking_id: newBooking.id,
        payment_type: normalizedPaymentType,
        total_price_cents: String(totalPackagePriceCents),
        amount_paid_cents: String(amountToChargeCents),
        balance_due_cents: String(initialBalanceDueCents),
        start_time: computedStartTime,
        end_time: computedEndTime,
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    // 10. Atualizar party_bookings com o stripe_checkout_session_id gerado
    await supabase
      .from('party_bookings')
      .update({
        stripe_checkout_session_id: session.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', newBooking.id);

    // 11. Retornar URL do checkout
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: session.url }),
    };
  } catch (error) {
    console.error('[Create Party Checkout Session] Erro inesperado:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: error instanceof Error ? error.message : 'Ocorreu um erro interno no servidor.',
      }),
    };
  }
};
