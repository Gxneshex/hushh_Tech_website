// fund-payment-admin-detail — one investor's full profile for the /fund-admin
// cockpit detail page. Team-gated (Supabase JWT + email allowlist). Read-only.
// PII-safe: SSN is NEVER returned (only `ssnProvided`); DOB is masked to year.
import {
  createAdminClient,
  formatUsdCents,
  getCorsHeaders,
  getDisplayName,
  normalizeRecurringSummary,
  json,
} from "../_shared/fundStripe.ts";
import { authenticateTeamMember } from "../_shared/security.ts";

const toCents = (a: unknown) => Math.round(Number(a || 0) * 100);

// MM/DD/YYYY (or similar) → ••/••/YYYY. Year only, never the full DOB.
function maskDob(dob: unknown): string | null {
  if (!dob) return null;
  const parts = String(dob).split(/[\/\-.]/).filter(Boolean);
  const year = parts.find((p) => p.length === 4) || "";
  return year ? `••/••/${year}` : "••/••/••••";
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders();
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const teamAuth = await authenticateTeamMember(req);
    if (teamAuth.error || !teamAuth.user) {
      return json({ error: teamAuth.error || "Unauthorized" }, teamAuth.status || 401, corsHeaders);
    }

    const body = await req.json().catch(() => ({}));
    const userId = body.userId || body.user_id;
    if (!userId) return json({ error: "userId is required" }, 400, corsHeaders);

    const supabase = createAdminClient();

    const [authRes, onbRes, payRes, reviewRes, ceoRes, ndaRes, finRes, syncRes, kycRes] =
      await Promise.all([
        supabase.auth.admin.getUserById(userId),
        supabase.from("onboarding_data").select("*").eq("user_id", userId).maybeSingle(),
        supabase
          .from("fund_stripe_payment_requests")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
        supabase
          .from("fund_payment_reviews")
          .select("status, flags, notes, reviewed_by, reviewed_at")
          .eq("user_id", userId)
          .order("reviewed_at", { ascending: false }),
        supabase
          .from("ceo_meeting_payments")
          .select("payment_status, calendly_booked, meeting_start_time")
          .eq("user_id", userId)
          .maybeSingle(),
        supabase
          .from("nda_signatures")
          .select("signer_name, signed_at, nda_version, pdf_url")
          .eq("user_id", userId)
          .maybeSingle(),
        supabase
          .from("user_financial_data")
          .select("institution_name, status, plaid_sync_status, plaid_item_id, plaid_sync_completed_at")
          .eq("user_id", userId)
          .maybeSingle(),
        supabase
          .from("plaid_product_sync_statuses")
          .select("product, status, available, records_count")
          .eq("user_id", userId),
        supabase
          .from("kyc_attestations")
          .select("status, risk_band, risk_score, verified_at, provider_name")
          .eq("user_id", userId)
          .order("verified_at", { ascending: false }),
      ]);

    const authUser = authRes.data?.user || null;
    const ob = onbRes.data || null;
    const payments = payRes.data || [];
    const latest = payments[0] || null;
    const reviews = reviewRes.data || [];
    const ceo = ceoRes.data || null;
    const nda = ndaRes.data || null;
    const fin = finRes.data || null;
    const sync = syncRes.data || [];
    const kyc = (kycRes.data || [])[0] || null;

    // Plaid accounts for this user's linked item (plaid_accounts keys on item).
    let accounts: any[] = [];
    if (fin?.plaid_item_id) {
      const { data: acctData } = await supabase
        .from("plaid_accounts")
        .select("name, official_name, type, subtype, mask, current_balance, iso_currency_code")
        .eq("plaid_item_id", fin.plaid_item_id);
      accounts = acctData || [];
    }

    // Reviewer emails.
    const reviewerEmail = new Map<string, string | null>();
    for (const id of [...new Set(reviews.map((r) => r.reviewed_by).filter(Boolean))]) {
      try {
        const { data } = await supabase.auth.admin.getUserById(id);
        reviewerEmail.set(id, data?.user?.email ?? null);
      } catch {
        reviewerEmail.set(id, null);
      }
    }

    const phone = ob
      ? `${ob.phone_country_code || ""}${ob.phone_number || ""}`.trim() || null
      : null;
    const address = ob
      ? [ob.address_line_1, ob.address_line_2, ob.city, ob.state, ob.zip_code, ob.address_country]
          .filter(Boolean)
          .join(", ") || null
      : null;

    return json({
      success: true,
      investor: {
        userId,
        name: getDisplayName(authUser, ob),
        email: authUser?.email ?? null,
        phone,
        address,
        dobMasked: maskDob(ob?.date_of_birth),
        ssnProvided: Boolean(ob?.ssn_encrypted),
        accountType: ob?.account_type ?? null,
        currentStep: ob?.current_step ?? null,
        onboardingComplete: Boolean(ob?.is_completed),
        verificationStatus: ob?.fund_investor_verification_status ?? latest?.status ?? null,
        timeline: {
          ndaSignedAt: nda?.signed_at ?? ob?.nda_signed_at ?? null,
          ndaVersion: nda?.nda_version ?? null,
          ndaPdfUrl: nda?.pdf_url ?? null,
          meetCeo: ceo
            ? {
                paid: ceo.payment_status === "completed",
                calendlyBooked: Boolean(ceo.calendly_booked),
                meetingStartTime: ceo.meeting_start_time ?? null,
              }
            : null,
          firstPaidAt: latest?.paid_at ?? null,
          verifiedAt: latest?.verified_at ?? null,
          rejectedAt: latest?.rejected_at ?? null,
        },
        investment: latest
          ? {
              paymentRequestId: latest.id,
              requestReference: latest.request_reference,
              status: latest.status,
              selectedFund: latest.selected_fund,
              commitment: formatUsdCents(toCents(latest.commitment_amount)),
              firstPayment: formatUsdCents(toCents(latest.first_payment_amount)),
              units: {
                a: Number(latest.class_a_units || 0),
                b: Number(latest.class_b_units || 0),
                c: Number(latest.class_c_units || 0),
              },
              recurring: normalizeRecurringSummary(latest || ob || {}),
              riskFlags: Array.isArray(latest.risk_flags) ? latest.risk_flags : [],
              reviewerNote: latest.reviewer_note ?? null,
            }
          : null,
        plaid: {
          institution: fin?.institution_name ?? null,
          syncStatus: fin?.plaid_sync_status ?? fin?.status ?? null,
          accounts: accounts.map((a) => ({
            name: a.name || a.official_name || "Account",
            type: a.type ?? null,
            subtype: a.subtype ?? null,
            mask: a.mask ?? null,
            balance: a.current_balance != null ? formatUsdCents(toCents(a.current_balance)) : null,
          })),
          products: sync.map((s) => ({
            product: s.product,
            status: s.status,
            available: Boolean(s.available),
            records: s.records_count ?? null,
          })),
        },
        kyc: kyc
          ? {
              status: kyc.status,
              riskBand: kyc.risk_band,
              riskScore: kyc.risk_score,
              provider: kyc.provider_name,
              verifiedAt: kyc.verified_at,
            }
          : null,
        reviews: reviews.map((r) => ({
          status: r.status,
          notes: r.notes,
          reviewedAt: r.reviewed_at,
          reviewerEmail: r.reviewed_by ? reviewerEmail.get(r.reviewed_by) ?? null : null,
          flags: Array.isArray(r.flags) ? r.flags : [],
        })),
      },
    }, 200, corsHeaders);
  } catch (error) {
    console.error("[fund-payment-admin-detail] Error:", error);
    return json({ error: error instanceof Error ? error.message : "Internal server error" }, 500, corsHeaders);
  }
});
