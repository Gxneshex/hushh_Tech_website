import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { getPlaidConfig, plaidRequest } from '../_shared/plaid.ts';
import { authenticateEdgeRequest } from '../_shared/security.ts';

const json = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

function defaultFailureReason(eventType: string) {
  if (eventType !== 'failed' && eventType !== 'returned') return null;
  return {
    failure_code: eventType === 'returned' ? 'R01' : 'R01',
    description: `Sandbox simulated ${eventType} transfer`,
  };
}

function daysFromNow(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

async function getSupabase() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey) {
    throw new Error('Supabase service configuration is missing');
  }

  return createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function resolveTransfer(supabase: any, userId: string, body: any) {
  if (body.transferId || body.plaid_transfer_id) {
    return { plaidTransferId: body.transferId || body.plaid_transfer_id, transferRow: null };
  }

  if (body.fundTransferId || body.fund_transfer_id) {
    const { data, error } = await supabase
      .from('fund_transfers')
      .select('*')
      .eq('user_id', userId)
      .eq('id', body.fundTransferId || body.fund_transfer_id)
      .maybeSingle();
    if (error) throw error;
    if (!data?.plaid_transfer_id) {
      throw Object.assign(new Error('Transfer not found for this user'), { status: 404 });
    }
    return { plaidTransferId: data.plaid_transfer_id, transferRow: data };
  }

  const { data, error } = await supabase
    .from('fund_transfers')
    .select('*')
    .eq('user_id', userId)
    .not('plaid_transfer_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data?.plaid_transfer_id) {
    throw Object.assign(new Error('No Plaid transfer found for this user'), { status: 404 });
  }
  return { plaidTransferId: data.plaid_transfer_id, transferRow: data };
}

async function resolveTestClockId(supabase: any, userId: string, body: any) {
  if (body.testClockId || body.test_clock_id) return body.testClockId || body.test_clock_id;

  const recurringId = body.recurringTransferId || body.recurring_transfer_id;
  let query = supabase
    .from('fund_recurring_transfers')
    .select('test_clock_id')
    .eq('user_id', userId)
    .not('test_clock_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1);

  if (recurringId) {
    query = supabase
      .from('fund_recurring_transfers')
      .select('test_clock_id')
      .eq('user_id', userId)
      .eq('plaid_recurring_transfer_id', recurringId)
      .limit(1);
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  if (!data?.test_clock_id) {
    throw Object.assign(new Error('No sandbox test clock found for this user'), { status: 404 });
  }
  return data.test_clock_id;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const userId = body.userId || body.user_id;

    const authFailure = await authenticateEdgeRequest(req, {
      label: 'plaid-transfer-sandbox-simulate',
      expectedUserId: userId || null,
    });
    if (authFailure) return authFailure;
    if (!userId) return json({ error: 'userId is required' }, 400);

    const plaid = getPlaidConfig();
    if (plaid.env !== 'sandbox') {
      return json({ error: 'Sandbox simulation is only available when PLAID_ENV=sandbox' }, 403);
    }

    const supabase = await getSupabase();
    const action = String(body.action || 'simulate_transfer');

    if (action === 'advance_test_clock') {
      const testClockId = await resolveTestClockId(supabase, userId, body);
      const newVirtualTime =
        body.newVirtualTime ||
        body.new_virtual_time ||
        daysFromNow(Number(body.days || body.daysToAdvance || 35));

      const { data } = await plaidRequest('/sandbox/transfer/test_clock/advance', {
        test_clock_id: testClockId,
        new_virtual_time: newVirtualTime,
      });

      return json({
        success: true,
        action,
        test_clock_id: testClockId,
        new_virtual_time: newVirtualTime,
        plaid: data,
      });
    }

    const { plaidTransferId, transferRow } = await resolveTransfer(supabase, userId, body);
    const eventType = String(body.eventType || body.event_type || 'posted');
    const failureReason = body.failureReason || body.failure_reason || defaultFailureReason(eventType);

    const simulateBody: Record<string, unknown> = {
      transfer_id: plaidTransferId,
      event_type: eventType,
    };
    if (failureReason) simulateBody.failure_reason = failureReason;
    if (body.testClockId || body.test_clock_id) {
      simulateBody.test_clock_id = body.testClockId || body.test_clock_id;
    }
    if (body.webhook) simulateBody.webhook = body.webhook;

    const { data: simulation } = await plaidRequest('/sandbox/transfer/simulate', simulateBody);

    let webhook = null;
    if (body.fireWebhook || body.fire_webhook) {
      const webhookUrl =
        body.webhook ||
        Deno.env.get('PLAID_TRANSFER_WEBHOOK_URL') ||
        (Deno.env.get('SUPABASE_URL') ? `${Deno.env.get('SUPABASE_URL')}/functions/v1/plaid-transfer-webhook` : null);

      if (webhookUrl) {
        const { data } = await plaidRequest('/sandbox/transfer/fire_webhook', {
          webhook: webhookUrl,
        });
        webhook = data;
      }
    }

    return json({
      success: true,
      action,
      event_type: eventType,
      plaid_transfer_id: plaidTransferId,
      fund_transfer_id: transferRow?.id || null,
      simulation,
      webhook,
      next_step: webhook ? 'Webhook fired; Plaid event sync should update DB.' : 'Call plaid-transfer-webhook or fireWebhook=true to sync DB status.',
    });
  } catch (error) {
    console.error('[plaid-transfer-sandbox-simulate] Error:', error);
    return json({
      error: error instanceof Error ? error.message : 'Internal server error',
      details: (error as any).details || null,
    }, (error as any).status || 500);
  }
});
