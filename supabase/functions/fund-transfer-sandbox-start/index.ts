import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { sendGmailEmail } from '../_shared/gmail.ts';
import { getPlaidConfig, plaidRequest } from '../_shared/plaid.ts';
import { authenticateEdgeRequest } from '../_shared/security.ts';
import { getPlaidAccessTokenForUser } from '../_shared/plaidToken.ts';

const json = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const SHARE_PRICES = {
  class_a_units: 25_000_000,
  class_b_units: 5_000_000,
  class_c_units: 1_000_000,
};

const ISO_ALPHA_2_COUNTRY_CODES = [
  'AD', 'AE', 'AF', 'AG', 'AI', 'AL', 'AM', 'AO', 'AQ', 'AR', 'AS', 'AT', 'AU', 'AW', 'AX', 'AZ',
  'BA', 'BB', 'BD', 'BE', 'BF', 'BG', 'BH', 'BI', 'BJ', 'BL', 'BM', 'BN', 'BO', 'BQ', 'BR', 'BS',
  'BT', 'BV', 'BW', 'BY', 'BZ', 'CA', 'CC', 'CD', 'CF', 'CG', 'CH', 'CI', 'CK', 'CL', 'CM', 'CN',
  'CO', 'CR', 'CU', 'CV', 'CW', 'CX', 'CY', 'CZ', 'DE', 'DJ', 'DK', 'DM', 'DO', 'DZ', 'EC', 'EE',
  'EG', 'EH', 'ER', 'ES', 'ET', 'FI', 'FJ', 'FK', 'FM', 'FO', 'FR', 'GA', 'GB', 'GD', 'GE', 'GF',
  'GG', 'GH', 'GI', 'GL', 'GM', 'GN', 'GP', 'GQ', 'GR', 'GS', 'GT', 'GU', 'GW', 'GY', 'HK', 'HM',
  'HN', 'HR', 'HT', 'HU', 'ID', 'IE', 'IL', 'IM', 'IN', 'IO', 'IQ', 'IR', 'IS', 'IT', 'JE', 'JM',
  'JO', 'JP', 'KE', 'KG', 'KH', 'KI', 'KM', 'KN', 'KP', 'KR', 'KW', 'KY', 'KZ', 'LA', 'LB', 'LC',
  'LI', 'LK', 'LR', 'LS', 'LT', 'LU', 'LV', 'LY', 'MA', 'MC', 'MD', 'ME', 'MF', 'MG', 'MH', 'MK',
  'ML', 'MM', 'MN', 'MO', 'MP', 'MQ', 'MR', 'MS', 'MT', 'MU', 'MV', 'MW', 'MX', 'MY', 'MZ', 'NA',
  'NC', 'NE', 'NF', 'NG', 'NI', 'NL', 'NO', 'NP', 'NR', 'NU', 'NZ', 'OM', 'PA', 'PE', 'PF', 'PG',
  'PH', 'PK', 'PL', 'PM', 'PN', 'PR', 'PS', 'PT', 'PW', 'PY', 'QA', 'RE', 'RO', 'RS', 'RU', 'RW',
  'SA', 'SB', 'SC', 'SD', 'SE', 'SG', 'SH', 'SI', 'SJ', 'SK', 'SL', 'SM', 'SN', 'SO', 'SR', 'SS',
  'ST', 'SV', 'SX', 'SY', 'SZ', 'TC', 'TD', 'TF', 'TG', 'TH', 'TJ', 'TK', 'TL', 'TM', 'TN', 'TO',
  'TR', 'TT', 'TV', 'TW', 'TZ', 'UA', 'UG', 'UM', 'US', 'UY', 'UZ', 'VA', 'VC', 'VE', 'VG', 'VI',
  'VN', 'VU', 'WF', 'WS', 'YE', 'YT', 'ZA', 'ZM', 'ZW',
];

const ISO_ALPHA_2_COUNTRY_CODE_SET = new Set(ISO_ALPHA_2_COUNTRY_CODES);

const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  america: 'US',
  britain: 'GB',
  'bosnia and herzegovina': 'BA',
  brunei: 'BN',
  'cape verde': 'CV',
  congo: 'CG',
  'czech republic': 'CZ',
  'east timor': 'TL',
  england: 'GB',
  'great britain': 'GB',
  holland: 'NL',
  iran: 'IR',
  'ivory coast': 'CI',
  ivorycoast: 'CI',
  laos: 'LA',
  macedonia: 'MK',
  micronesia: 'FM',
  moldova: 'MD',
  palestine: 'PS',
  russia: 'RU',
  'sao tome and principe': 'ST',
  swaziland: 'SZ',
  syria: 'SY',
  taiwan: 'TW',
  tanzania: 'TZ',
  uae: 'AE',
  uk: 'GB',
  'united arab emirates': 'AE',
  'united kingdom': 'GB',
  'united states': 'US',
  'united states of america': 'US',
  us: 'US',
  usa: 'US',
  'vatican city': 'VA',
  vietnam: 'VN',
};

const ACH_TRANSFER_ELIGIBLE_SUBTYPES = new Set(['checking', 'savings', 'money market', 'cash management']);

function decimalAmount(value: unknown, fallback: string): string {
  const raw = value == null || value === '' ? fallback : String(value);
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed.toFixed(2);
}

function clientError(message: string, code: string, details: Record<string, unknown> = {}, status = 400) {
  const error = new Error(message);
  (error as any).status = status;
  (error as any).details = { code, ...details };
  return error;
}

function countryKey(value: unknown): string {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function toIsoCountryCode(value: unknown, fallback = 'US'): string {
  const raw = String(value || '').trim();
  if (!raw) return fallback;
  const alphaOnly = raw.toUpperCase().replace(/[^A-Z]/g, '');
  if (alphaOnly.length === 2 && ISO_ALPHA_2_COUNTRY_CODE_SET.has(alphaOnly)) {
    return alphaOnly;
  }

  const key = countryKey(raw);
  const compactKey = key.replace(/\s+/g, '');
  const mapped = COUNTRY_NAME_TO_CODE[key] || COUNTRY_NAME_TO_CODE[compactKey];
  if (mapped) return mapped;

  const displayNames = typeof Intl !== 'undefined' && 'DisplayNames' in Intl
    ? new Intl.DisplayNames(['en'], { type: 'region' })
    : null;
  if (displayNames) {
    for (const code of ISO_ALPHA_2_COUNTRY_CODES) {
      if (countryKey(displayNames.of(code)) === key) return code;
    }
  }

  throw clientError(
    'Transfer address country must be a valid 2-letter ISO country code, such as US.',
    'INVALID_TRANSFER_COUNTRY',
    { country: raw },
  );
}

function achTransferIneligibilityReason(account: any): string | null {
  if (!account || account.status !== 'active') {
    return 'Selected bank account is no longer active. Reconnect a checking or savings account and try again.';
  }
  const type = String(account.type || '').toLowerCase();
  const subtype = String(account.subtype || '').toLowerCase();
  const currency = String(account.iso_currency_code || 'USD').toUpperCase();
  if (type !== 'depository') {
    return 'Only Plaid depository accounts can be used for ACH transfers.';
  }
  if (!ACH_TRANSFER_ELIGIBLE_SUBTYPES.has(subtype)) {
    return 'Please choose a checking, savings, cash-management, or money market account for ACH transfers.';
  }
  if (currency !== 'USD') {
    return 'ACH transfers require a USD bank account.';
  }
  return null;
}

function last4(value: unknown): string | null {
  const digits = String(value || '').replace(/\D/g, '');
  return digits ? digits.slice(-4) : null;
}

function findAchEntry(authData: any, accountId: string) {
  const achEntries = Array.isArray(authData?.numbers?.ach) ? authData.numbers.ach : [];
  return achEntries.find((entry: any) => entry.account_id === accountId) || null;
}

function findAuthAccount(authData: any, accountId: string) {
  const accounts = Array.isArray(authData?.accounts) ? authData.accounts : [];
  return accounts.find((account: any) => account.account_id === accountId) || null;
}

function requestedCommitment(onboarding: any): number {
  const explicit = Number(onboarding.initial_investment_amount || 0);
  if (explicit > 0) return explicit;
  return (
    Number(onboarding.class_a_units || 0) * SHARE_PRICES.class_a_units +
    Number(onboarding.class_b_units || 0) * SHARE_PRICES.class_b_units +
    Number(onboarding.class_c_units || 0) * SHARE_PRICES.class_c_units
  );
}

function recurringSchedule(frequency: string | null, dayOfMonth: number | null) {
  const day = Number(dayOfMonth || 1);
  if (frequency === 'weekly') {
    return { interval_unit: 'week', interval_count: 1, interval_execution_day: 1 };
  }
  if (frequency === 'every_other_week' || frequency === 'twice_a_month') {
    return { interval_unit: 'week', interval_count: 2, interval_execution_day: 1 };
  }
  return {
    interval_unit: 'month',
    interval_count: 1,
    interval_execution_day: day >= 28 || day === 31 ? -1 : Math.max(1, Math.min(day, 28)),
  };
}

function tomorrowIsoDate(): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

function compactPhone(onboarding: any): string | null {
  const raw = `${onboarding.phone_country_code || ''}${onboarding.phone_number || ''}`.replace(/[^\d+]/g, '');
  if (!raw || raw.length < 7) return null;
  return raw.startsWith('+') ? raw : `+${raw}`;
}

function plaidUser(onboarding: any, email: string | null) {
  const legalName = [onboarding.legal_first_name, onboarding.legal_last_name]
    .filter(Boolean)
    .join(' ')
    .trim() || onboarding.bank_account_holder_name || 'Hushh Investor';
  const country = onboarding.address_line_1
    ? toIsoCountryCode(
        onboarding.bank_address_country ||
          onboarding.address_country ||
          onboarding.residence_country ||
          'US',
      )
    : null;
  const address = onboarding.address_line_1
    ? {
        street: [onboarding.address_line_1, onboarding.address_line_2].filter(Boolean).join(' '),
        city: onboarding.city || 'San Francisco',
        region: onboarding.state || 'CA',
        postal_code: onboarding.zip_code || '94103',
        country: country || 'US',
      }
    : undefined;
  return {
    legal_name: legalName,
    ...(email ? { email_address: email } : {}),
    ...(compactPhone(onboarding) ? { phone_number: compactPhone(onboarding) } : {}),
    ...(address ? { address } : {}),
  };
}

function safeAccountDetails(account: any) {
  return {
    name: account?.name || account?.official_name || null,
    mask: account?.mask || account?.ach_account_mask || null,
    type: account?.type || null,
    subtype: account?.subtype || null,
    iso_currency_code: account?.iso_currency_code || null,
  };
}

async function resolveAchTransferAccount(
  supabase: any,
  userId: string,
  accountId: string | null,
) {
  let query = supabase
    .from('plaid_transfer_accounts')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });

  if (accountId) {
    query = query.eq('plaid_account_id', accountId);
  }

  const { data: accounts, error } = await query;
  if (error) throw error;
  if (!Array.isArray(accounts) || accounts.length === 0) {
    throw clientError(
      accountId
        ? 'Selected bank account is no longer available. Reconnect a checking or savings account and try again.'
        : 'No linked bank account is available for ACH transfer. Link a checking or savings account and try again.',
      'NO_ACTIVE_TRANSFER_ACCOUNT',
    );
  }

  let lastReason = '';
  const authByItem = new Map<string, Promise<{ item: any; accessToken: string; authData: any }>>();

  for (const account of accounts) {
    const localReason = achTransferIneligibilityReason(account);
    if (localReason) {
      lastReason = localReason;
      if (accountId) {
        throw clientError(localReason, 'TRANSFER_ACCOUNT_NOT_ELIGIBLE', {
          account: safeAccountDetails(account),
        });
      }
      continue;
    }

    if (!authByItem.has(account.plaid_item_id)) {
      authByItem.set(account.plaid_item_id, (async () => {
        const { item, accessToken } = await getPlaidAccessTokenForUser(
          supabase,
          userId,
          account.plaid_item_id,
        );
        const { data: authData } = await plaidRequest('/auth/get', { access_token: accessToken });
        return { item, accessToken, authData };
      })());
    }

    let authResult: { item: any; accessToken: string; authData: any };
    try {
      authResult = await authByItem.get(account.plaid_item_id)!;
    } catch (authError) {
      lastReason = 'Plaid Auth is not available for this linked bank.';
      if (accountId) {
        throw clientError(
          'Plaid Auth is not available for this linked bank. Reconnect a checking or savings account that supports ACH.',
          'PLAID_AUTH_UNAVAILABLE',
          {
            account: safeAccountDetails(account),
            reason: authError instanceof Error ? authError.message : 'Plaid Auth unavailable',
          },
        );
      }
      continue;
    }

    const authAccount = findAuthAccount(authResult.authData, account.plaid_account_id);
    const achEntry = findAchEntry(authResult.authData, account.plaid_account_id);
    if (!authAccount || !achEntry) {
      lastReason = 'Selected bank account does not expose ACH routing details through Plaid Auth.';
      if (accountId) {
        throw clientError(
          'Selected bank account cannot be used for ACH transfers. Choose a Plaid checking or savings account with ACH routing details, then reconnect your bank.',
          'ACCOUNT_MISSING_ACH_NUMBERS',
          { account: safeAccountDetails(account) },
        );
      }
      continue;
    }

    return {
      account,
      item: authResult.item,
      accessToken: authResult.accessToken,
      authAccount,
      achEntry,
    };
  }

  throw clientError(
    'No ACH-transfer-capable bank account is available. Link or select a USD checking, savings, cash-management, or money market account that supports Plaid Auth.',
    'NO_ACH_TRANSFER_CAPABLE_ACCOUNT',
    { reason: lastReason || 'No eligible depository account found' },
  );
}

function transferEmailHtml(params: {
  name: string;
  status: string;
  requestedAmount: number;
  plaidAmount: string;
  transferId?: string | null;
  recurringId?: string | null;
  accountMask?: string | null;
}) {
  return `
<!doctype html>
<html>
  <body style="margin:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#111;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;background:#f5f5f5;">
      <tr><td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;border:1px solid #e5e5e5;">
          <tr><td style="background:#000;color:#fff;padding:24px 28px;text-align:center;">
            <div style="font-size:18px;font-weight:700;letter-spacing:3px;">HUSHH</div>
            <div style="font-size:11px;color:#aaa;letter-spacing:1.5px;text-transform:uppercase;margin-top:6px;">Fund Transfer Sandbox</div>
          </td></tr>
          <tr><td style="padding:28px;">
            <p style="margin:0 0 16px;font-size:15px;">Hi ${params.name},</p>
            <p style="margin:0 0 18px;font-size:13px;line-height:1.65;color:#333;">
              Your Hushh Fund A transfer setup has been received. This is a sandbox transfer, so no real money has moved.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #111;margin:18px 0;">
              <tr><td style="background:#111;color:#fff;padding:10px 14px;font-size:11px;letter-spacing:1px;text-transform:uppercase;">Transfer Summary</td></tr>
              <tr><td style="padding:12px 14px;font-size:13px;border-bottom:1px solid #eee;">Status: <strong>${params.status}</strong></td></tr>
              <tr><td style="padding:12px 14px;font-size:13px;border-bottom:1px solid #eee;">Fund commitment: <strong>$${params.requestedAmount.toLocaleString()}</strong></td></tr>
              <tr><td style="padding:12px 14px;font-size:13px;border-bottom:1px solid #eee;">Sandbox debit amount: <strong>$${params.plaidAmount}</strong></td></tr>
              <tr><td style="padding:12px 14px;font-size:13px;border-bottom:1px solid #eee;">Bank account: <strong>${params.accountMask ? `****${params.accountMask}` : 'Linked Plaid account'}</strong></td></tr>
              <tr><td style="padding:12px 14px;font-size:13px;">Transfer ID: <strong>${params.transferId || 'pending'}</strong></td></tr>
            </table>
            ${params.recurringId ? `<p style="margin:0 0 18px;font-size:13px;line-height:1.65;color:#333;">Recurring sandbox schedule is active: <strong>${params.recurringId}</strong>.</p>` : ''}
            <p style="margin:0;font-size:11px;line-height:1.55;color:#777;">Hushh stores Plaid access credentials server-side only. The browser sees masked account metadata and transfer status, never Plaid access tokens.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

async function sendAndLogEmail(supabase: any, params: {
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
  await supabase.from('transfer_email_notifications').update({
    status: result.success ? 'sent' : 'failed',
    provider_message_id: result.messageId || null,
    error_message: result.error || null,
    sent_at: result.success ? new Date().toISOString() : null,
  }).eq('id', logRow?.id);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Plaid Transfer money path is parked while Stripe is the live money rail.
  // Refuse all requests until explicitly enabled to prevent accidental access
  // from creating orphan transfer rows that no UI surfaces.
  if (Deno.env.get('HUSHH_FUND_TRANSFER_ENABLED') !== '1') {
    return json({
      error: 'Plaid Transfer money path is currently disabled. Stripe is the live money rail.',
      code: 'FUND_TRANSFER_DISABLED',
    }, 503);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const userId = body.userId || body.user_id;
    const accountId = body.accountId || body.account_id || null;
    const achAuthorized = body.achAuthorized || body.ach_authorized;

    const authFailure = await authenticateEdgeRequest(req, {
      label: 'fund-transfer-sandbox-start',
      expectedUserId: userId || null,
    });
    if (authFailure) return authFailure;

    if (!userId) return json({ error: 'userId is required' }, 400);
    if (!achAuthorized) return json({ error: 'ACH authorization is required' }, 400);

    const plaid = getPlaidConfig();
    if (plaid.env !== 'sandbox' && Deno.env.get('PLAID_TRANSFER_ENABLE_PRODUCTION') !== 'true') {
      return json({ error: 'Plaid Transfer v1 is sandbox-gated' }, 403);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceKey) {
      throw new Error('Supabase service configuration is missing');
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: onboarding, error: onboardingError } = await supabase
      .from('onboarding_data')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (onboardingError) throw onboardingError;
    if (!onboarding) return json({ error: 'Onboarding data not found' }, 400);

    const { data: authUser } = await supabase.auth.admin.getUserById(userId);
    const email = authUser?.user?.email || null;
    const userPayload = plaidUser(onboarding, email);
    const requestedAmount = requestedCommitment(onboarding);
    if (requestedAmount <= 0) return json({ error: 'No fund commitment amount found' }, 400);

    const {
      account: selectedAccount,
      item,
      accessToken,
      authAccount,
      achEntry,
    } = await resolveAchTransferAccount(supabase, userId, accountId);

    const now = new Date().toISOString();
    const device = {
      ip_address: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1',
      user_agent: req.headers.get('user-agent') || 'HushhTech Sandbox',
    };

    await supabase.from('plaid_transfer_accounts').update({
      ach_account_mask: last4(achEntry.account),
      ach_routing_mask: last4(achEntry.routing),
      transfer_capabilities: {
        ach_debit: true,
        plaid_auth: true,
        verified_at: now,
        type: authAccount.type || selectedAccount.type || null,
        subtype: authAccount.subtype || selectedAccount.subtype || null,
      },
      updated_at: now,
    }).eq('id', selectedAccount.id);

    const { data: plan } = await supabase.from('fund_investment_plans').insert({
      user_id: userId,
      onboarding_data_id: onboarding.id,
      selected_fund: onboarding.selected_fund || 'hushh_fund_a',
      class_a_units: onboarding.class_a_units || 0,
      class_b_units: onboarding.class_b_units || 0,
      class_c_units: onboarding.class_c_units || 0,
      commitment_amount: requestedAmount,
      initial_transfer_amount: requestedAmount,
      recurring_enabled: Boolean(onboarding.recurring_amount),
      recurring_amount: onboarding.recurring_amount || null,
      recurring_frequency: onboarding.recurring_frequency || null,
      recurring_day_of_month: onboarding.recurring_day_of_month || null,
      ach_authorized_at: now,
      ach_authorization_ip: device.ip_address,
      ach_authorization_user_agent: device.user_agent,
      status: 'transfer_pending',
    }).select('*').single();

    const plaidAmount = decimalAmount(
      body.sandboxAmount || Deno.env.get('PLAID_TRANSFER_SANDBOX_AMOUNT'),
      '11.11',
    );
    const idempotencyKey = `fund-${plan.id.slice(0, 18)}-${plaidAmount.replace('.', '')}`.slice(0, 50);

    const authRequest = {
      access_token: accessToken,
      account_id: selectedAccount.plaid_account_id,
      idempotency_key: idempotencyKey,
      type: 'debit',
      network: 'ach',
      ach_class: 'web',
      amount: plaidAmount,
      user: userPayload,
      device,
    };

    const { data: authData } = await plaidRequest('/transfer/authorization/create', authRequest);
    const authorization = (authData as any).authorization;
    const authorizationId = authorization?.id;

    if (!authorizationId || authorization?.decision !== 'approved') {
      const { data: failedTransfer } = await supabase.from('fund_transfers').insert({
        user_id: userId,
        plan_id: plan.id,
        plaid_item_id: item.plaid_item_id,
        plaid_account_id: selectedAccount.plaid_account_id,
        plaid_authorization_id: authorizationId || null,
        requested_amount: requestedAmount,
        plaid_amount: Number(plaidAmount),
        description: 'Fund',
        status: 'authorization_declined',
        idempotency_key: idempotencyKey,
        sandbox_mode: plaid.env === 'sandbox',
        raw_authorization: authData,
      }).select('*').single();

      await supabase.from('fund_investment_plans').update({ status: 'failed' }).eq('id', plan.id);
      await supabase.from('onboarding_data').update({
        ach_authorized_at: now,
        ach_authorization_ip: device.ip_address,
        ach_authorization_user_agent: device.user_agent,
        plaid_transfer_setup_status: 'authorization_declined',
        plaid_transfer_setup_error: authorization?.decision_rationale?.description || 'Plaid authorization declined',
        updated_at: now,
      }).eq('user_id', userId);

      return json({ error: 'Plaid transfer authorization was not approved', authorization, transfer: failedTransfer }, 402);
    }

    const { data: transferData } = await plaidRequest('/transfer/create', {
      access_token: accessToken,
      account_id: selectedAccount.plaid_account_id,
      authorization_id: authorizationId,
      amount: plaidAmount,
      description: 'Fund',
      metadata: {
        user_id: userId,
        plan_id: plan.id,
        requested_amount: String(requestedAmount),
      },
    });
    const transfer = (transferData as any).transfer;

    const { data: transferRow } = await supabase.from('fund_transfers').insert({
      user_id: userId,
      plan_id: plan.id,
      plaid_item_id: item.plaid_item_id,
      plaid_account_id: selectedAccount.plaid_account_id,
      plaid_transfer_id: transfer?.id || null,
      plaid_authorization_id: authorizationId,
      transfer_type: transfer?.type || 'debit',
      network: transfer?.network || 'ach',
      ach_class: transfer?.ach_class || 'web',
      requested_amount: requestedAmount,
      plaid_amount: Number(plaidAmount),
      description: 'Fund',
      status: transfer?.status || 'pending',
      idempotency_key: idempotencyKey,
      sandbox_mode: plaid.env === 'sandbox',
      raw_authorization: authData,
      raw_transfer: transferData,
    }).select('*').single();

    let recurringRow = null;
    if (Number(onboarding.recurring_amount || 0) > 0) {
      const recurringAmount = decimalAmount(
        body.sandboxRecurringAmount || Deno.env.get('PLAID_RECURRING_SANDBOX_AMOUNT'),
        plaidAmount,
      );
      let testClockId: string | null = null;
      if (plaid.env === 'sandbox') {
        const { data: clockData } = await plaidRequest('/sandbox/transfer/test_clock/create', {
          virtual_time: new Date().toISOString(),
        });
        testClockId = (clockData as any).test_clock?.test_clock_id || null;
      }

      const schedule = {
        ...recurringSchedule(onboarding.recurring_frequency, onboarding.recurring_day_of_month),
        start_date: tomorrowIsoDate(),
      };
      const recurringIdempotencyKey = `rec-${plan.id.slice(0, 18)}-${recurringAmount.replace('.', '')}`.slice(0, 50);
      const { data: recurringData } = await plaidRequest('/transfer/recurring/create', {
        access_token: accessToken,
        account_id: selectedAccount.plaid_account_id,
        type: 'debit',
        network: 'ach',
        ach_class: 'web',
        amount: recurringAmount,
        user_present: false,
        description: 'Fund',
        idempotency_key: recurringIdempotencyKey,
        schedule,
        user: userPayload,
        device,
        ...(testClockId ? { test_clock_id: testClockId } : {}),
      });
      const recurring = (recurringData as any).recurring_transfer;

      const { data } = await supabase.from('fund_recurring_transfers').insert({
        user_id: userId,
        plan_id: plan.id,
        plaid_recurring_transfer_id: recurring?.recurring_transfer_id || recurring?.id || null,
        plaid_item_id: item.plaid_item_id,
        plaid_account_id: selectedAccount.plaid_account_id,
        requested_amount: Number(onboarding.recurring_amount || 0),
        plaid_amount: Number(recurringAmount),
        recurring_frequency: onboarding.recurring_frequency || null,
        recurring_day_of_month: onboarding.recurring_day_of_month || null,
        schedule,
        test_clock_id: testClockId,
        status: recurring?.status || 'created',
        idempotency_key: recurringIdempotencyKey,
        raw_recurring_transfer: recurringData,
      }).select('*').single();
      recurringRow = data;
    }

    await supabase.from('fund_investment_plans').update({ status: 'active' }).eq('id', plan.id);
    await supabase.from('onboarding_data').update({
      ach_authorized_at: now,
      ach_authorization_ip: device.ip_address,
      ach_authorization_user_agent: device.user_agent,
      plaid_transfer_setup_status: 'created',
      plaid_transfer_setup_error: null,
      updated_at: now,
    }).eq('user_id', userId);

    await sendAndLogEmail(supabase, {
      userId,
      transferRowId: transferRow?.id,
      recipientEmail: email,
      notificationType: 'transfer_created',
      subject: 'Hushh Fund A transfer setup received',
      html: transferEmailHtml({
        name: userPayload.legal_name,
        status: transfer?.status || 'pending',
        requestedAmount,
        plaidAmount,
        transferId: transfer?.id || null,
        recurringId: recurringRow?.plaid_recurring_transfer_id || null,
        accountMask: selectedAccount.mask || selectedAccount.ach_account_mask || null,
      }),
    }).catch((emailError) => console.warn('[fund-transfer] Email skipped:', emailError));

    return json({
      success: true,
      sandbox_mode: plaid.env === 'sandbox',
      plan,
      transfer: transferRow,
      recurring_transfer: recurringRow,
    });
  } catch (error) {
    console.error('[fund-transfer-sandbox-start] Error:', error);
    return json({
      error: error instanceof Error ? error.message : 'Internal server error',
      details: (error as any).details || null,
    }, (error as any).status || 500);
  }
});
