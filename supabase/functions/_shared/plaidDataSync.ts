import { plaidRequest } from './plaid.ts';

export const PLAID_DATA_PRODUCTS = [
  'accounts',
  'balance',
  'auth',
  'identity',
  'identity_match',
  'investments',
  'investment_transactions',
  'liabilities',
  'signal',
  'transactions',
  'assets',
  'statements',
  'income',
] as const;

export const PLAID_IMMEDIATE_PRODUCTS = [
  'accounts',
  'balance',
  'auth',
  'identity',
  'investments',
  'liabilities',
  'signal',
] as const;

export const PLAID_BACKGROUND_PRODUCTS = [
  'identity_match',
  'transactions',
  'assets',
  'investment_transactions',
  'statements',
  'income',
] as const;

export type PlaidDataProduct = typeof PLAID_DATA_PRODUCTS[number];

export type ProductSyncStatus =
  | 'pending'
  | 'syncing'
  | 'complete'
  | 'partial'
  | 'unsupported'
  | 'access_required'
  | 'failed';

export interface ProductSyncResult {
  product: PlaidDataProduct;
  status: ProductSyncStatus;
  available: boolean;
  recordsCount?: number | null;
  data?: any;
  error?: string | null;
  errorCode?: string | null;
  requestId?: string | null;
  rawMetadata?: Record<string, unknown> | null;
}

export function isoDateDaysAgo(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function redactAuthNumbers(authData: any) {
  const ach = Array.isArray(authData?.numbers?.ach) ? authData.numbers.ach : [];
  return {
    accounts: authData?.accounts || [],
    numbers: {
      ach: ach.map((entry: any) => ({
        account_id: entry.account_id,
        account_mask: entry.account ? String(entry.account).slice(-4) : null,
        routing_mask: entry.routing ? String(entry.routing).slice(-4) : null,
        wire_routing_mask: entry.wire_routing ? String(entry.wire_routing).slice(-4) : null,
      })),
    },
    sensitive_redacted: true,
  };
}

function classifyPlaidError(error: unknown): {
  status: ProductSyncStatus;
  error: string;
  errorCode: string | null;
  requestId: string | null;
} {
  const details = (error as any)?.details || {};
  const code = details.error_code || null;
  const message = details.error_message ||
    (error instanceof Error ? error.message : 'Plaid product sync failed');

  if (code === 'PRODUCT_NOT_READY') {
    return { status: 'pending', error: message, errorCode: code, requestId: details.request_id || null };
  }

  if (
    code === 'PRODUCT_NOT_SUPPORTED' ||
    code === 'PRODUCTS_NOT_SUPPORTED' ||
    code === 'NO_INVESTMENT_ACCOUNTS' ||
    code === 'NO_LIABILITY_ACCOUNTS'
  ) {
    return { status: 'unsupported', error: message, errorCode: code, requestId: details.request_id || null };
  }

  if (
    code === 'ACCESS_NOT_GRANTED' ||
    code === 'ITEM_LOGIN_REQUIRED' ||
    code === 'ADDITIONAL_CONSENT_REQUIRED' ||
    code === 'MISSING_PRODUCT_ACCESS'
  ) {
    return { status: 'access_required', error: message, errorCode: code, requestId: details.request_id || null };
  }

  return { status: 'failed', error: message, errorCode: code, requestId: details.request_id || null };
}

async function updateProductStatus(
  supabase: any,
  params: {
    userId: string;
    plaidItemId: string;
    product: PlaidDataProduct;
    status: ProductSyncStatus;
    available?: boolean;
    recordsCount?: number | null;
    error?: string | null;
    errorCode?: string | null;
    requestId?: string | null;
    rawMetadata?: Record<string, unknown> | null;
  },
) {
  const now = new Date().toISOString();
  const terminal = ['complete', 'partial', 'unsupported', 'access_required', 'failed'].includes(params.status);
  const { error } = await supabase.from('plaid_product_sync_statuses').upsert({
    user_id: params.userId,
    plaid_item_id: params.plaidItemId,
    product: params.product,
    status: params.status,
    available: Boolean(params.available),
    records_count: params.recordsCount ?? null,
    error_code: params.errorCode || null,
    error_message: params.error || null,
    request_id: params.requestId || null,
    raw_metadata: params.rawMetadata || null,
    started_at: params.status === 'syncing' ? now : undefined,
    completed_at: terminal ? now : null,
    attempts: params.status === 'syncing' ? undefined : 1,
    updated_at: now,
  }, { onConflict: 'user_id,plaid_item_id,product' });
  if (error) throw error;
}

export async function ensureProductStatuses(
  supabase: any,
  userId: string,
  plaidItemId: string,
) {
  const now = new Date().toISOString();
  const rows = PLAID_DATA_PRODUCTS.map((product) => ({
    user_id: userId,
    plaid_item_id: plaidItemId,
    product,
    status: 'pending',
    available: false,
    updated_at: now,
  }));

  const { error } = await supabase
    .from('plaid_product_sync_statuses')
    .upsert(rows, { onConflict: 'user_id,plaid_item_id,product', ignoreDuplicates: true });
  if (error) throw error;
}

async function mergeUserFinancialData(
  supabase: any,
  userId: string,
  patch: Record<string, unknown>,
  product: PlaidDataProduct,
  result: ProductSyncResult,
) {
  const { data: existing, error: existingError } = await supabase
    .from('user_financial_data')
    .select('available_products, fetch_errors')
    .eq('user_id', userId)
    .maybeSingle();
  if (existingError) throw existingError;

  const availableProducts = {
    ...(existing?.available_products || {}),
    [product]: result.available,
  };
  const fetchErrors = { ...(existing?.fetch_errors || {}) };
  if (result.error) {
    fetchErrors[product] = {
      error: result.error,
      error_code: result.errorCode || null,
    };
  } else {
    delete fetchErrors[product];
  }

  const availableCount = Object.values(availableProducts).filter(Boolean).length;
  const status = availableCount >= 5 ? 'complete' : availableCount > 0 ? 'partial' : 'failed';
  const now = new Date().toISOString();
  const { error } = await supabase.from('user_financial_data').upsert({
    user_id: userId,
    ...patch,
    plaid_access_token: null,
    available_products: availableProducts,
    fetch_errors: Object.keys(fetchErrors).length > 0 ? fetchErrors : null,
    status,
    plaid_sync_status: status,
    plaid_sync_completed_at: now,
    data_sync_summary: {
      products_available: availableCount,
      last_product_synced: product,
      last_product_status: result.status,
    },
    updated_at: now,
  }, { onConflict: 'user_id' });
  if (error) throw error;
}

export async function upsertAccounts(
  supabase: any,
  userId: string,
  plaidItemId: string,
  institution: { id?: string | null; name?: string | null },
  accounts: any[],
) {
  const now = new Date().toISOString();

  for (const [index, account] of accounts.entries()) {
    const balances = account.balances || {};
    const { error: accountError } = await supabase.from('plaid_accounts').upsert({
      plaid_item_id: plaidItemId,
      plaid_account_id: account.account_id,
      name: account.name || null,
      official_name: account.official_name || null,
      type: account.type || null,
      subtype: account.subtype || null,
      current_balance: balances.current ?? null,
      available_balance: balances.available ?? null,
      iso_currency_code: balances.iso_currency_code || 'USD',
      mask: account.mask || null,
      last_synced_at: now,
      updated_at: now,
    }, { onConflict: 'plaid_account_id' });
    if (accountError) throw accountError;

    if (['checking', 'savings', 'cash management'].includes(String(account.subtype || '').toLowerCase())) {
      const { error: transferError } = await supabase.from('plaid_transfer_accounts').upsert({
        user_id: userId,
        plaid_item_id: plaidItemId,
        plaid_account_id: account.account_id,
        institution_id: institution.id || null,
        institution_name: institution.name || null,
        name: account.name || null,
        official_name: account.official_name || null,
        type: account.type || null,
        subtype: account.subtype || null,
        mask: account.mask || null,
        iso_currency_code: balances.iso_currency_code || 'USD',
        available_balance: balances.available ?? null,
        current_balance: balances.current ?? null,
        is_default: index === 0,
        status: 'active',
        updated_at: now,
      }, { onConflict: 'user_id,plaid_account_id' });
      if (transferError) throw transferError;
    }
  }
}

async function buildIdentityMatchUser(supabase: any, userId: string) {
  const { data: onboarding } = await supabase
    .from('onboarding_data')
    .select('legal_first_name, legal_last_name, phone_country_code, phone_number, address_line_1, address_line_2, city, state, zip_code, address_country')
    .eq('user_id', userId)
    .maybeSingle();
  const { data: authUser } = await supabase.auth.admin.getUserById(userId);
  const email = authUser?.user?.email || null;
  const legalName = [onboarding?.legal_first_name, onboarding?.legal_last_name].filter(Boolean).join(' ').trim();
  const rawPhone = `${onboarding?.phone_country_code || ''}${onboarding?.phone_number || ''}`.replace(/[^\d+]/g, '');
  const phone = rawPhone.length >= 7 ? (rawPhone.startsWith('+') ? rawPhone : `+${rawPhone}`) : null;
  const address = onboarding?.address_line_1
    ? {
        street: [onboarding.address_line_1, onboarding.address_line_2].filter(Boolean).join(' '),
        city: onboarding.city || undefined,
        region: onboarding.state || undefined,
        postal_code: onboarding.zip_code || undefined,
        country: onboarding.address_country || 'US',
      }
    : null;

  const user: Record<string, unknown> = {};
  if (legalName) user.legal_name = legalName;
  if (email) user.email_address = email;
  if (phone) user.phone_number = phone;
  if (address) user.address = address;
  return user;
}

async function syncTransactions(
  supabase: any,
  userId: string,
  plaidItemId: string,
  accessToken: string,
): Promise<ProductSyncResult> {
  const { data: cursorRow } = await supabase
    .from('plaid_sync_cursors')
    .select('cursor')
    .eq('plaid_item_id', plaidItemId)
    .eq('product', 'transactions')
    .maybeSingle();
  let cursor = cursorRow?.cursor || undefined;
  let hasMore = true;
  let addedCount = 0;
  let modifiedCount = 0;
  let removedCount = 0;
  const sample: any[] = [];

  for (let page = 0; page < 8 && hasMore; page++) {
    const { data } = await plaidRequest('/transactions/sync', {
      access_token: accessToken,
      ...(cursor ? { cursor } : {}),
      count: 500,
    });
    const added = Array.isArray((data as any).added) ? (data as any).added : [];
    const modified = Array.isArray((data as any).modified) ? (data as any).modified : [];
    const removed = Array.isArray((data as any).removed) ? (data as any).removed : [];
    const upsertable = [...added, ...modified];

    for (const transaction of upsertable) {
      const category = Array.isArray(transaction.category) ? transaction.category : null;
      const { error } = await supabase.from('plaid_transactions').upsert({
        plaid_account_id: transaction.account_id,
        plaid_transaction_id: transaction.transaction_id,
        amount: transaction.amount,
        iso_currency_code: transaction.iso_currency_code || 'USD',
        date: transaction.date,
        name: transaction.name || null,
        merchant_name: transaction.merchant_name || null,
        category,
        pending: Boolean(transaction.pending),
        payment_channel: transaction.payment_channel || null,
        transaction_type: transaction.transaction_type || null,
        location: transaction.location || null,
      }, { onConflict: 'plaid_transaction_id' });
      if (error) throw error;
      if (sample.length < 25) sample.push(transaction);
    }

    const removedIds = removed.map((transaction: any) => transaction.transaction_id).filter(Boolean);
    if (removedIds.length > 0) {
      const { error } = await supabase
        .from('plaid_transactions')
        .delete()
        .in('plaid_transaction_id', removedIds);
      if (error) throw error;
    }

    addedCount += added.length;
    modifiedCount += modified.length;
    removedCount += removed.length;
    hasMore = Boolean((data as any).has_more);
    cursor = (data as any).next_cursor || cursor;
  }

  if (cursor) {
    const { error } = await supabase.from('plaid_sync_cursors').upsert({
      plaid_item_id: plaidItemId,
      product: 'transactions',
      cursor,
      last_synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'plaid_item_id,product' });
    if (error) throw error;
  }

  const recordsCount = addedCount + modifiedCount;
  return {
    product: 'transactions',
    status: 'complete',
    available: true,
    recordsCount,
    data: {
      sync_type: 'transactions_sync',
      added_count: addedCount,
      modified_count: modifiedCount,
      removed_count: removedCount,
      sample,
      cursor_saved: Boolean(cursor),
    },
  };
}

async function syncAssetReport(
  supabase: any,
  userId: string,
  accessToken: string,
): Promise<ProductSyncResult> {
  const { data: existing } = await supabase
    .from('user_financial_data')
    .select('asset_report_token')
    .eq('user_id', userId)
    .maybeSingle();

  let assetReportToken = existing?.asset_report_token || null;
  let createdData: any = null;

  if (!assetReportToken) {
    const { data } = await plaidRequest('/asset_report/create', {
      access_tokens: [accessToken],
      days_requested: 731,
      options: { add_ons: ['fast_assets'] },
    });
    createdData = data;
    assetReportToken = (data as any).asset_report_token || null;
    if (assetReportToken) {
      await mergeUserFinancialData(
        supabase,
        userId,
        {
          asset_report_token: assetReportToken,
          asset_report_status: 'pending',
          asset_report_created_at: new Date().toISOString(),
        },
        'assets',
        { product: 'assets', status: 'pending', available: false },
      );
    }
  }

  if (!assetReportToken) {
    return {
      product: 'assets',
      status: 'failed',
      available: false,
      error: 'Plaid did not return an asset_report_token',
      rawMetadata: createdData || null,
    };
  }

  try {
    const { data } = await plaidRequest('/asset_report/get', {
      asset_report_token: assetReportToken,
    });
    return {
      product: 'assets',
      status: 'complete',
      available: true,
      recordsCount: Array.isArray((data as any).report?.items) ? (data as any).report.items.length : null,
      data,
      rawMetadata: { asset_report_token: assetReportToken },
    };
  } catch (error) {
    const classified = classifyPlaidError(error);
    if (classified.status === 'pending') {
      return {
        product: 'assets',
        status: 'pending',
        available: false,
        error: classified.error,
        errorCode: classified.errorCode,
        requestId: classified.requestId,
        rawMetadata: { asset_report_token: assetReportToken },
      };
    }
    throw error;
  }
}

async function syncStatements(
  supabase: any,
  userId: string,
  plaidItemId: string,
  accessToken: string,
): Promise<ProductSyncResult> {
  const { data } = await plaidRequest('/statements/list', { access_token: accessToken });
  const accounts = Array.isArray((data as any).accounts) ? (data as any).accounts : [];
  let count = 0;

  for (const account of accounts) {
    const statements = Array.isArray(account.statements) ? account.statements : [];
    for (const statement of statements) {
      count++;
      const { error } = await supabase.from('plaid_statement_metadata').upsert({
        user_id: userId,
        plaid_item_id: plaidItemId,
        plaid_account_id: account.account_id || null,
        statement_id: statement.statement_id,
        statement_date: statement.statement_date || null,
        period_start: statement.period_start_date || null,
        period_end: statement.period_end_date || null,
        status: 'available',
        metadata: statement,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,statement_id' });
      if (error) throw error;
    }
  }

  return {
    product: 'statements',
    status: 'complete',
    available: true,
    recordsCount: count,
    data,
  };
}

function patchForProduct(product: PlaidDataProduct, result: ProductSyncResult): Record<string, unknown> {
  switch (product) {
    case 'accounts':
      return {};
    case 'balance':
      return result.available ? { balances: result.data } : {};
    case 'auth':
      return result.available ? { auth_numbers: redactAuthNumbers(result.data) } : {};
    case 'identity':
      return result.available ? { identity_data: result.data } : {};
    case 'identity_match':
      return result.available ? { identity_match: result.data, identity_match_scores: result.data } : {};
    case 'investments':
      return result.available ? { investments: result.data } : {};
    case 'investment_transactions':
      return result.available ? { investment_transactions: result.data } : {};
    case 'liabilities':
      return result.available ? { liabilities_data: result.data } : {};
    case 'signal':
      return { signal_prepared: result.available };
    case 'transactions':
      return result.available ? { transactions_data: result.data } : {};
    case 'assets':
      return {
        asset_report_status: result.status,
        ...(result.available ? { asset_report: result.data } : {}),
        ...(result.rawMetadata?.asset_report_token
          ? { asset_report_token: result.rawMetadata.asset_report_token }
          : {}),
      };
    case 'statements':
      return result.available ? { statements_data: result.data } : {};
    case 'income':
      return result.available ? { income_data: result.data } : {};
    default:
      return {};
  }
}

export async function syncPlaidDataProduct(params: {
  supabase: any;
  userId: string;
  item: any;
  accessToken: string;
  product: PlaidDataProduct;
}): Promise<ProductSyncResult> {
  const { supabase, userId, item, accessToken, product } = params;
  const plaidItemId = item.plaid_item_id;

  await updateProductStatus(supabase, {
    userId,
    plaidItemId,
    product,
    status: 'syncing',
  });

  try {
    const baseBody = { access_token: accessToken };
    const startDate = isoDateDaysAgo(731);
    const endDate = todayIsoDate();
    let result: ProductSyncResult;

    if (product === 'accounts') {
      const { data, requestId } = await plaidRequest('/accounts/get', baseBody);
      const accounts = (data as any).accounts || [];
      await upsertAccounts(
        supabase,
        userId,
        plaidItemId,
        { id: item.institution_id, name: item.institution_name },
        accounts,
      );
      result = { product, status: 'complete', available: true, recordsCount: accounts.length, data, requestId };
    } else if (product === 'balance') {
      const { data, requestId } = await plaidRequest('/accounts/balance/get', baseBody);
      result = { product, status: 'complete', available: true, recordsCount: (data as any).accounts?.length || 0, data, requestId };
    } else if (product === 'auth') {
      const { data, requestId } = await plaidRequest('/auth/get', baseBody);
      result = { product, status: 'complete', available: true, recordsCount: (data as any).accounts?.length || 0, data, requestId };
    } else if (product === 'identity') {
      const { data, requestId } = await plaidRequest('/identity/get', baseBody);
      result = { product, status: 'complete', available: true, recordsCount: (data as any).accounts?.length || 0, data, requestId };
    } else if (product === 'identity_match') {
      const user = await buildIdentityMatchUser(supabase, userId);
      if (Object.keys(user).length === 0) {
        result = {
          product,
          status: 'pending',
          available: false,
          error: 'User legal identity fields are not available yet',
          errorCode: 'USER_IDENTITY_PENDING',
        };
      } else {
        const { data, requestId } = await plaidRequest('/identity/match', { ...baseBody, user });
        result = { product, status: 'complete', available: true, recordsCount: 1, data, requestId };
      }
    } else if (product === 'investments') {
      const { data, requestId } = await plaidRequest('/investments/holdings/get', baseBody);
      result = { product, status: 'complete', available: true, recordsCount: (data as any).holdings?.length || 0, data, requestId };
    } else if (product === 'investment_transactions') {
      const { data, requestId } = await plaidRequest('/investments/transactions/get', {
        ...baseBody,
        start_date: startDate,
        end_date: endDate,
        options: { count: 500, offset: 0 },
      });
      result = { product, status: 'complete', available: true, recordsCount: (data as any).investment_transactions?.length || 0, data, requestId };
    } else if (product === 'liabilities') {
      const { data, requestId } = await plaidRequest('/liabilities/get', baseBody);
      const liabilities = (data as any).liabilities || {};
      const recordsCount = Object.values(liabilities)
        .filter(Array.isArray)
        .reduce((sum: number, entries: any) => sum + entries.length, 0);
      result = { product, status: 'complete', available: true, recordsCount, data, requestId };
    } else if (product === 'signal') {
      const { data, requestId } = await plaidRequest('/signal/prepare', baseBody);
      result = { product, status: 'complete', available: true, recordsCount: 1, data, requestId };
    } else if (product === 'transactions') {
      result = await syncTransactions(supabase, userId, plaidItemId, accessToken);
    } else if (product === 'assets') {
      result = await syncAssetReport(supabase, userId, accessToken);
    } else if (product === 'statements') {
      result = await syncStatements(supabase, userId, plaidItemId, accessToken);
    } else if (product === 'income') {
      result = {
        product,
        status: 'access_required',
        available: false,
        error: 'Bank Income requires the dedicated Bank Income/update-mode Link flow',
        errorCode: 'BANK_INCOME_UPDATE_MODE_REQUIRED',
      };
    } else {
      result = {
        product,
        status: 'unsupported',
        available: false,
        error: `Unsupported Plaid product: ${product}`,
        errorCode: 'UNSUPPORTED_PRODUCT',
      };
    }

    await mergeUserFinancialData(supabase, userId, {
      plaid_item_id: plaidItemId,
      institution_name: item.institution_name || null,
      institution_id: item.institution_id || null,
      ...patchForProduct(product, result),
    }, product, result);
    await updateProductStatus(supabase, {
      userId,
      plaidItemId,
      product,
      status: result.status,
      available: result.available,
      recordsCount: result.recordsCount ?? null,
      error: result.error || null,
      errorCode: result.errorCode || null,
      requestId: result.requestId || null,
      rawMetadata: result.rawMetadata || null,
    });
    await supabase.from('plaid_items').update({
      last_data_sync_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('plaid_item_id', plaidItemId);
    return result;
  } catch (error) {
    const classified = classifyPlaidError(error);
    const result: ProductSyncResult = {
      product,
      status: classified.status,
      available: false,
      error: classified.error,
      errorCode: classified.errorCode,
      requestId: classified.requestId,
    };
    await mergeUserFinancialData(supabase, userId, {
      plaid_item_id: plaidItemId,
      institution_name: item.institution_name || null,
      institution_id: item.institution_id || null,
      ...patchForProduct(product, result),
    }, product, result);
    await updateProductStatus(supabase, {
      userId,
      plaidItemId,
      product,
      status: result.status,
      available: false,
      error: result.error,
      errorCode: result.errorCode,
      requestId: result.requestId,
    });
    return result;
  }
}

export function summarizeProductResults(results: ProductSyncResult[]) {
  const availableProducts = Object.fromEntries(
    results.map((result) => [result.product, result.available]),
  );
  const fetchErrors = Object.fromEntries(
    results
      .filter((result) => result.error)
      .map((result) => [result.product, {
        error: result.error,
        error_code: result.errorCode || null,
      }]),
  );
  const productsAvailable = results.filter((result) => result.available).length;
  const canProceed = Boolean(
    availableProducts.accounts &&
    availableProducts.balance &&
    availableProducts.auth
  );
  return {
    status: productsAvailable >= 5 ? 'complete' : productsAvailable > 0 ? 'partial' : 'failed',
    available_products: availableProducts,
    products_available: productsAvailable,
    fetch_errors: fetchErrors,
    can_proceed: canProceed,
  };
}

export function parsePlaidDataProduct(value: unknown): PlaidDataProduct | null {
  const product = String(value || '').trim();
  return PLAID_DATA_PRODUCTS.includes(product as PlaidDataProduct)
    ? product as PlaidDataProduct
    : null;
}
