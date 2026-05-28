import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { sendGmailEmail } from '../_shared/gmail.ts';
import { plaidRequest } from '../_shared/plaid.ts';

const json = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

function assertWebhookSecret(req: Request, body: Record<string, unknown>) {
  const expected = Deno.env.get('PLAID_TRANSFER_WEBHOOK_SECRET');
  if (!expected) return;

  const provided =
    req.headers.get('x-hushh-webhook-secret') ||
    req.headers.get('x-webhook-secret') ||
    new URL(req.url).searchParams.get('secret') ||
    String(body.webhook_secret || '');

  if (provided !== expected) {
    throw Object.assign(new Error('Invalid webhook secret'), { status: 401 });
  }
}

function statusLabel(status: string): string {
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function shouldNotifyStatus(status: string): boolean {
  return ['posted', 'settled', 'funds_available', 'failed', 'returned', 'cancelled'].includes(status);
}

function requestedAfterId(body: Record<string, unknown>, fallback: number): number {
  const explicit = body.after_id ?? body.afterId;
  if (explicit == null || explicit === '') return fallback;
  const parsed = Number(explicit);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return Math.floor(parsed);
}

function eventFailure(event: any) {
  const failure = event?.failure_reason || {};
  return {
    code: failure.failure_code || failure.ach_return_code || null,
    message: failure.description || null,
  };
}

function transferStatusEmailHtml(params: {
  name: string;
  status: string;
  plaidTransferId: string;
  amount?: number | null;
  failureMessage?: string | null;
}) {
  return `
<!doctype html>
<html>
  <body style="margin:0;background:#f6f6f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#111;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:28px 16px;background:#f6f6f6;">
      <tr><td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;border:1px solid #e5e5e5;">
          <tr><td style="background:#111;color:#fff;padding:22px 26px;text-align:center;">
            <div style="font-size:18px;font-weight:700;letter-spacing:3px;">HUSHH</div>
            <div style="font-size:11px;color:#bbb;letter-spacing:1.5px;text-transform:uppercase;margin-top:6px;">Fund Transfer Update</div>
          </td></tr>
          <tr><td style="padding:26px;">
            <p style="margin:0 0 14px;font-size:15px;">Hi ${params.name},</p>
            <p style="margin:0 0 16px;font-size:13px;line-height:1.65;color:#333;">
              Your Hushh Fund A sandbox transfer status is now <strong>${statusLabel(params.status)}</strong>.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #111;margin:18px 0;">
              <tr><td style="background:#111;color:#fff;padding:10px 14px;font-size:11px;letter-spacing:1px;text-transform:uppercase;">Status Detail</td></tr>
              <tr><td style="padding:12px 14px;font-size:13px;border-bottom:1px solid #eee;">Status: <strong>${statusLabel(params.status)}</strong></td></tr>
              <tr><td style="padding:12px 14px;font-size:13px;border-bottom:1px solid #eee;">Sandbox amount: <strong>${params.amount != null ? `$${params.amount.toFixed(2)}` : 'N/A'}</strong></td></tr>
              <tr><td style="padding:12px 14px;font-size:13px;">Transfer ID: <strong>${params.plaidTransferId}</strong></td></tr>
            </table>
            ${params.failureMessage ? `<p style="margin:0 0 16px;font-size:12px;line-height:1.55;color:#8a1f11;">${params.failureMessage}</p>` : ''}
            <p style="margin:0;font-size:11px;line-height:1.55;color:#777;">Sandbox updates are for testing only; no real money has moved.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

async function logEmail(supabase: any, params: {
  userId: string;
  transferRowId?: string | null;
  recipientEmail: string | null;
  subject: string;
  html: string;
  notificationType: string;
}) {
  if (!params.recipientEmail) return;

  const { data: logRow } = await supabase.from('transfer_email_notifications').insert({
    user_id: params.userId,
    fund_transfer_id: params.transferRowId || null,
    notification_type: params.notificationType,
    recipient_email: params.recipientEmail,
    subject: params.subject,
    status: 'pending',
  }).select('id').single();

  const result = await sendGmailEmail([params.recipientEmail], params.subject, params.html);
  if (!logRow?.id) return;

  await supabase.from('transfer_email_notifications').update({
    status: result.success ? 'sent' : 'failed',
    provider_message_id: result.messageId || null,
    error_message: result.error || null,
    sent_at: result.success ? new Date().toISOString() : null,
  }).eq('id', logRow.id);
}

async function sendTransferStatusEmail(supabase: any, transferRow: any, status: string, failureMessage?: string | null) {
  if (!shouldNotifyStatus(status)) return;

  const { data: existing } = await supabase
    .from('transfer_email_notifications')
    .select('id')
    .eq('fund_transfer_id', transferRow.id)
    .eq('notification_type', `transfer_${status}`)
    .limit(1)
    .maybeSingle();
  if (existing) return;

  const { data: authUser } = await supabase.auth.admin.getUserById(transferRow.user_id);
  const recipientEmail = authUser?.user?.email || null;
  const fallbackName = recipientEmail?.split('@')[0] || 'Investor';

  await logEmail(supabase, {
    userId: transferRow.user_id,
    transferRowId: transferRow.id,
    recipientEmail,
    notificationType: `transfer_${status}`,
    subject: `Hushh Fund A transfer ${statusLabel(status)}`,
    html: transferStatusEmailHtml({
      name: fallbackName,
      status,
      plaidTransferId: transferRow.plaid_transfer_id,
      amount: Number(transferRow.plaid_amount || 0),
      failureMessage,
    }),
  });
}

async function upsertRecurringWebhookTransfer(supabase: any, webhook: any) {
  if (!webhook?.recurring_transfer_id || !webhook?.transfer_id) return null;

  const { data: recurring, error: recurringError } = await supabase
    .from('fund_recurring_transfers')
    .select('*')
    .eq('plaid_recurring_transfer_id', webhook.recurring_transfer_id)
    .maybeSingle();
  if (recurringError) throw recurringError;
  if (!recurring) return null;

  const { data: existing } = await supabase
    .from('fund_transfers')
    .select('*')
    .eq('plaid_transfer_id', webhook.transfer_id)
    .maybeSingle();
  if (existing) return existing;

  const { data: transferData } = await plaidRequest('/transfer/get', {
    transfer_id: webhook.transfer_id,
  });
  const transfer = (transferData as any).transfer || {};
  const { data: inserted, error: insertError } = await supabase.from('fund_transfers').insert({
    user_id: recurring.user_id,
    plan_id: recurring.plan_id,
    plaid_item_id: recurring.plaid_item_id,
    plaid_account_id: recurring.plaid_account_id,
    plaid_transfer_id: webhook.transfer_id,
    plaid_authorization_id: transfer.authorization_id || null,
    transfer_type: transfer.type || 'debit',
    network: transfer.network || 'ach',
    ach_class: transfer.ach_class || 'web',
    requested_amount: recurring.requested_amount,
    plaid_amount: Number(transfer.amount || recurring.plaid_amount || 0),
    description: transfer.description || 'Fund',
    status: transfer.status || 'pending',
    idempotency_key: `rec-origin-${webhook.transfer_id}`.slice(0, 50),
    sandbox_mode: webhook.environment === 'sandbox',
    raw_transfer: transferData,
  }).select('*').single();
  if (insertError) throw insertError;
  return inserted;
}

async function handleRecurringWebhook(supabase: any, webhook: any) {
  const code = String(webhook.webhook_code || '');
  if (!code.startsWith('RECURRING_')) return null;

  const status =
    code === 'RECURRING_CANCELLED' ? 'cancelled' :
    code === 'RECURRING_TRANSFER_SKIPPED' ? 'skipped' :
    code === 'RECURRING_NEW_TRANSFER' ? 'active' :
    'updated';

  const { data: recurring } = await supabase
    .from('fund_recurring_transfers')
    .update({
      status,
      raw_recurring_transfer: webhook,
      updated_at: new Date().toISOString(),
    })
    .eq('plaid_recurring_transfer_id', webhook.recurring_transfer_id)
    .select('*')
    .maybeSingle();

  const transferRow = await upsertRecurringWebhookTransfer(supabase, webhook);

  if (transferRow && code === 'RECURRING_NEW_TRANSFER') {
    await sendTransferStatusEmail(supabase, transferRow, transferRow.status || 'pending');
  }

  return recurring || transferRow;
}

async function processTransferEvent(supabase: any, event: any) {
  const eventId = Number(event.event_id);
  if (!Number.isFinite(eventId)) return { inserted: false, transfer: null };

  const { data: existingEvent } = await supabase
    .from('plaid_transfer_events')
    .select('id')
    .eq('plaid_event_id', eventId)
    .maybeSingle();
  if (existingEvent) return { inserted: false, transfer: null };

  await supabase.from('plaid_transfer_events').insert({
    plaid_event_id: eventId,
    event_type: event.event_type || null,
    event_code: event.event_type || null,
    plaid_transfer_id: event.transfer_id || null,
    plaid_recurring_transfer_id: event.recurring_transfer_id || null,
    event_created_at: event.timestamp || null,
    payload: event,
  });

  if (!event.transfer_id) return { inserted: true, transfer: null };

  const failure = eventFailure(event);
  const { data: transferRow, error: transferError } = await supabase
    .from('fund_transfers')
    .update({
      status: event.event_type,
      failure_code: failure.code,
      failure_message: failure.message,
      updated_at: new Date().toISOString(),
    })
    .eq('plaid_transfer_id', event.transfer_id)
    .select('*')
    .maybeSingle();
  if (transferError) throw transferError;

  if (transferRow) {
    await sendTransferStatusEmail(supabase, transferRow, event.event_type, failure.message);
  }

  return { inserted: true, transfer: transferRow };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    assertWebhookSecret(req, body);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceKey) {
      throw new Error('Supabase service configuration is missing');
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    await handleRecurringWebhook(supabase, body);

    const { data: latest } = await supabase
      .from('plaid_transfer_events')
      .select('plaid_event_id')
      .order('plaid_event_id', { ascending: false })
      .limit(1)
      .maybeSingle();

    let afterId = requestedAfterId(body, Number(latest?.plaid_event_id || 0));
    let processed = 0;
    let inserted = 0;

    for (let page = 0; page < 10; page++) {
      const { data } = await plaidRequest('/transfer/event/sync', {
        after_id: afterId,
        count: 500,
      });
      const events = Array.isArray((data as any).transfer_events)
        ? (data as any).transfer_events
        : [];
      if (events.length === 0) break;

      const orderedEvents = [...events].sort(
        (left, right) => Number(left.event_id || 0) - Number(right.event_id || 0),
      );

      for (const event of orderedEvents) {
        const result = await processTransferEvent(supabase, event);
        processed++;
        if (result.inserted) inserted++;
        afterId = Math.max(afterId, Number(event.event_id || 0));
      }

      if (events.length < 500) break;
    }

    return json({
      success: true,
      webhook_code: body.webhook_code || null,
      processed,
      inserted,
      latest_event_id: afterId,
    });
  } catch (error) {
    console.error('[plaid-transfer-webhook] Error:', error);
    return json({
      error: error instanceof Error ? error.message : 'Internal server error',
      details: (error as any).details || null,
    }, (error as any).status || 500);
  }
});
