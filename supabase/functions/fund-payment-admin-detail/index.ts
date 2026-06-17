// fund-payment-admin-detail — one investor's full profile for the /fund-admin
// audit console. Team-gated (Supabase JWT + email allowlist). Read-only except
// the separate review function.
// PII-safe: SSN is NEVER returned (only `ssnProvided`); DOB is masked to year.
import {
  computeCommitmentCents,
  createAdminClient,
  formatUsdCents,
  getCorsHeaders,
  getDisplayName,
  normalizeRecurringSummary,
  json,
} from "../_shared/fundStripe.ts";
import { authenticateTeamMember } from "../_shared/security.ts";
import { logAdminAccess } from "../_shared/fundAdminAudit.ts";
import { computeProofOfFundsStatus, maxAccountBalanceCents } from "../_shared/proofOfFunds.ts";

const toCents = (a: unknown) => Math.round(Number(a || 0) * 100);

type SourceWarning = {
  source: string;
  code?: string | null;
  message: string;
};

function warn(source: string, error: any, sourceWarnings: SourceWarning[]) {
  if (!error) return;
  sourceWarnings.push({
    source,
    code: error.code ?? null,
    message: error.message || "Unable to load source",
  });
}

function rows<T = any>(
  source: string,
  result: { data?: T[] | null; error?: any },
  sourceWarnings: SourceWarning[],
): T[] {
  warn(source, result.error, sourceWarnings);
  return result.error ? [] : result.data || [];
}

function row<T = any>(
  source: string,
  result: { data?: T | null; error?: any },
  sourceWarnings: SourceWarning[],
): T | null {
  warn(source, result.error, sourceWarnings);
  return result.error ? null : result.data || null;
}

// MM/DD/YYYY (or similar) → ••/••/YYYY. Year only, never the full DOB.
function maskDob(dob: unknown): string | null {
  if (!dob) return null;
  const parts = String(dob).split(/[\/\-.]/).filter(Boolean);
  const year = parts.find((p) => p.length === 4) || "";
  return year ? `••/••/${year}` : "••/••/••••";
}

function financialDataStatus(params: {
  onboarding: any | null;
  financial: any | null;
  accounts: any[];
  products: any[];
}) {
  const finStatus = String(params.financial?.status || "").toLowerCase();
  const syncStatus = String(params.financial?.plaid_sync_status || "").toLowerCase();
  const linkStatus = String(params.onboarding?.financial_link_status || "").toLowerCase();
  if (finStatus === "complete" || syncStatus === "complete") return "complete";
  if (finStatus === "partial" || syncStatus === "partial") return "partial";
  if (params.financial?.plaid_item_id || params.accounts.length > 0 || params.products.length > 0) return "linked";
  if (linkStatus === "skipped") return "skipped";
  if (linkStatus === "pending") return "pending";
  return "missing";
}

function sourceList(params: {
  onboarding: any | null;
  payments: any[];
  reviews: any[];
  ceo: any | null;
  nda: any | null;
  financial: any | null;
  accounts: any[];
  products: any[];
  kyc: any | null;
}) {
  const sources = new Set<string>();
  if (params.onboarding) sources.add("onboarding_data");
  if (params.payments.length) sources.add("fund_stripe_payment_requests");
  if (params.reviews.length) sources.add("fund_payment_reviews");
  if (params.ceo) sources.add("ceo_meeting_payments");
  if (params.nda) sources.add("nda_signatures");
  if (params.financial) sources.add("user_financial_data");
  if (params.accounts.length) sources.add("plaid_accounts");
  if (params.products.length) sources.add("plaid_product_sync_statuses");
  if (params.kyc) sources.add("kyc_attestations");
  return Array.from(sources).sort();
}

const nonEmpty = (v: unknown) => String(v ?? "").trim() !== "";

// PII-safe account-type detail block (custodian account number + EIN are reduced
// to *Provided booleans, mirroring the SSN handling).
function buildAccountTypeDetails(ob: any | null) {
  if (!ob) return null;
  if (ob.account_type === "retirement") {
    return {
      retirementAccountType: ob.retirement_account_type ?? null,
      custodianName: ob.custodian_name ?? null,
      custodianContactEmail: ob.custodian_contact_email ?? null,
      custodianContactPhone: ob.custodian_contact_phone ?? null,
      custodianAccountProvided: Boolean(ob.custodian_account_number),
      custodianApprovalRequired: Boolean(ob.custodian_approval_required),
    };
  }
  if (ob.account_type === "trust") {
    return {
      entityType: ob.entity_type ?? null,
      entityLegalName: ob.entity_legal_name ?? null,
      entityTaxIdProvided: Boolean(ob.entity_tax_id_ein),
      formationState: ob.formation_state ?? null,
      formationCountry: ob.formation_country ?? null,
      registeredAddress: ob.registered_address ?? null,
      principalAddress: ob.principal_address ?? null,
    };
  }
  return null;
}

function missingPieces(params: {
  onboarding: any | null;
  latest: any | null;
  bankLinked: boolean;
  financialStatus: string;
  ndaSigned: boolean;
  kycAvailable: boolean;
  kyc: any | null;
  parties: any[];
}) {
  const pieces: string[] = [];
  if (params.bankLinked && !params.onboarding) pieces.push("missing_onboarding_row");
  if (params.bankLinked && params.onboarding?.financial_link_status !== "completed") {
    pieces.push("onboarding_financial_link_status_not_completed");
  }
  if (!params.bankLinked && params.financialStatus !== "skipped") pieces.push("bank_not_linked");
  if (!params.ndaSigned) pieces.push("nda_not_signed");
  if (params.onboarding?.is_completed && !params.latest) pieces.push("payment_not_started");
  if (params.latest && !params.latest.paid_at) pieces.push("first_payment_not_paid");
  if (params.latest?.paid_at && !["verified_investor", "rejected"].includes(params.latest.status)) {
    pieces.push("awaiting_manual_verification");
  }
  if (params.kycAvailable && !params.kyc) pieces.push("kyc_not_found");
  // AML signal: the investor's CURRENT location (GPS captured at onboarding)
  // differs from their declared LEGAL residence — e.g. a US-resident onboarding
  // from abroad. Review flag for a human reviewer, never a block.
  {
    const gpsCountry = String(params.onboarding?.gps_country || "").trim().toLowerCase();
    const residenceCountry = String(params.onboarding?.residence_country || "").trim().toLowerCase();
    if (gpsCountry && residenceCountry && gpsCountry !== residenceCountry) {
      pieces.push("current_location_differs_from_residence");
    }
  }
  // Account-type gating (mirrors accountTypeConfig + the submit edge fn).
  {
    const ob = params.onboarding;
    const at = String(ob?.account_type || "individual");
    const completedRoles = new Set(
      (params.parties || []).filter((p) => p.status === "completed").map((p) => p.party_role),
    );
    if (at !== "individual" && !ob?.authorised_signatory_confirmed_at) {
      pieces.push("signatory_not_confirmed");
    }
    if (at === "retirement" && !(nonEmpty(ob?.retirement_account_type) && nonEmpty(ob?.custodian_name))) {
      pieces.push("account_type_fields_incomplete");
    }
    if (at === "trust" && !(nonEmpty(ob?.entity_type) && nonEmpty(ob?.entity_legal_name))) {
      pieces.push("account_type_fields_incomplete");
    }
    if (at === "joint" && !completedRoles.has("joint_owner")) {
      pieces.push("required_party_not_completed");
    }
    if (at === "trust" && !completedRoles.has("trustee")) {
      pieces.push("required_party_not_completed");
    }
    if (
      at !== "individual" &&
      !["submitted", "compliance_review", "approved", "rejected"].includes(
        String(ob?.application_status || ""),
      )
    ) {
      pieces.push("application_not_submitted");
    }
  }
  return [...new Set(pieces)];
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
    // Compliance: record that this admin viewed this investor's profile.
    await logAdminAccess({
      supabase,
      actorUserId: teamAuth.user.id,
      actorEmail: teamAuth.user.email,
      action: "view_investor",
      targetUserId: userId,
      req,
    });
    const sourceWarnings: SourceWarning[] = [];

    const [authRes, onbRes, payRes, reviewRes, ceoRes, ndaRes, finRes, syncRes, kycRes, notesRes, tagsRes] =
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
          .select("status, risk_band, risk_score, verified_at, provider_name, expires_at, sanctions_checked, pep_checked, aml_score, verification_level")
          .eq("user_id", userId)
          .order("verified_at", { ascending: false }),
        supabase
          .from("fund_investor_notes")
          .select("id, body, author_email, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
        supabase
          .from("fund_investor_tags")
          .select("tag")
          .eq("user_id", userId)
          .order("created_at", { ascending: true }),
      ]);

    if (authRes.error) warn("auth.users", authRes.error, sourceWarnings);
    const authUser = authRes.data?.user || null;
    const ob = row("onboarding_data", onbRes, sourceWarnings);
    const payments = rows("fund_stripe_payment_requests", payRes, sourceWarnings);
    const latest = payments[0] || null;
    const reviews = rows("fund_payment_reviews", reviewRes, sourceWarnings);
    const ceo = row("ceo_meeting_payments", ceoRes, sourceWarnings);
    const nda = row("nda_signatures", ndaRes, sourceWarnings);
    const fin = row("user_financial_data", finRes, sourceWarnings);
    const sync = rows("plaid_product_sync_statuses", syncRes, sourceWarnings);
    const kycRows = rows("kyc_attestations", kycRes, sourceWarnings);
    const kyc = kycRows[0] || null;
    const kycAvailable = !kycRes.error;
    // CRM notes + tags (best-effort: empty if the migration hasn't been applied yet).
    const notes = (notesRes?.data || []).map((n: any) => ({
      id: n.id,
      body: n.body,
      authorEmail: n.author_email ?? null,
      createdAt: n.created_at,
    }));
    const tags = (tagsRes?.data || []).map((t: any) => t.tag);

    let accounts: any[] = [];
    if (fin?.plaid_item_id) {
      const acctRes = await supabase
        .from("plaid_accounts")
        .select("name, official_name, type, subtype, mask, current_balance, iso_currency_code")
        .eq("plaid_item_id", fin.plaid_item_id);
      accounts = rows("plaid_accounts", acctRes, sourceWarnings);
    }

    // Additional onboarding parties (account-type invites) for compliance review.
    const partiesRes = await supabase
      .from("onboarding_parties")
      .select("party_role, display_name, invite_email, status, completed_at, is_required")
      .eq("primary_user_id", userId);
    const partyRows = rows("onboarding_parties", partiesRes, sourceWarnings);

    // Proof-of-funds (§3.3/§3.4, where available): available balance vs commitment.
    const proofOfFundsStatus = computeProofOfFundsStatus({
      balanceCents: maxAccountBalanceCents(accounts),
      investmentCents: ob ? computeCommitmentCents(ob) : 0,
    });

    // Reviewer emails: one batched read from public.users, with a bounded
    // getUserById fallback for any ids missing there (reviewer count is tiny).
    const reviewerIds = [...new Set(reviews.map((r) => r.reviewed_by).filter(Boolean))] as string[];
    const reviewerEmail = new Map<string, string | null>();
    if (reviewerIds.length) {
      try {
        const { data: profs } = await supabase.from("users").select("id, email").in("id", reviewerIds);
        for (const p of profs || []) reviewerEmail.set(p.id, p.email ?? null);
      } catch {
        // fall through to per-id lookup
      }
      const missing = reviewerIds.filter((id) => !reviewerEmail.has(id));
      await Promise.all(
        missing.map(async (id) => {
          try {
            const { data } = await supabase.auth.admin.getUserById(id);
            reviewerEmail.set(id, data?.user?.email ?? null);
          } catch {
            reviewerEmail.set(id, null);
          }
        }),
      );
    }

    const phone = ob
      ? `${ob.phone_country_code || ""}${ob.phone_number || ""}`.trim() || null
      : null;
    const address = ob
      ? [ob.address_line_1, ob.address_line_2, ob.city, ob.state, ob.zip_code, ob.address_country]
          .filter(Boolean)
          .join(", ") || null
      : null;
    const financialStatus = financialDataStatus({ onboarding: ob, financial: fin, accounts, products: sync });
    const bankLinked = ["complete", "partial", "linked"].includes(financialStatus);
    const ndaSignedAt = nda?.signed_at ?? ob?.nda_signed_at ?? null;
    const ndaSigned = Boolean(ndaSignedAt);
    const dataSources = sourceList({ onboarding: ob, payments, reviews, ceo, nda, financial: fin, accounts, products: sync, kyc });
    const pieces = missingPieces({
      onboarding: ob,
      latest,
      bankLinked,
      financialStatus,
      ndaSigned,
      kycAvailable,
      kyc,
      parties: partyRows,
    });
    if (proofOfFundsStatus === "funds_insufficient") pieces.push("funds_insufficient");

    const displayName = ob || authUser
      ? getDisplayName(authUser, ob)
      : nda?.signer_name || "Hushh investor";

    return json({
      success: true,
      sourceWarnings,
      investor: {
        userId,
        name: displayName,
        email: authUser?.email ?? null,
        phone,
        address,
        dobMasked: maskDob(ob?.date_of_birth),
        ssnProvided: Boolean(ob?.ssn_encrypted),
        accountType: ob?.account_type ?? null,
        applicationStatus: ob?.application_status ?? null,
        accountTypeDetails: buildAccountTypeDetails(ob),
        signatory: {
          isPrimary: ob?.authorised_signatory_is_primary ?? null,
          confirmedAt: ob?.authorised_signatory_confirmed_at ?? null,
        },
        parties: partyRows.map((p: any) => ({
          role: p.party_role,
          displayName: p.display_name ?? null,
          email: p.invite_email ?? null,
          status: p.status,
          completedAt: p.completed_at ?? null,
          required: Boolean(p.is_required),
        })),
        currentStep: ob?.current_step ?? null,
        onboardingComplete: Boolean(ob?.is_completed),
        verificationStatus: ob?.fund_investor_verification_status ?? latest?.status ?? null,
        audit: {
          ndaSigned,
          bankLinked,
          financialDataStatus: financialStatus,
          financialLinkStatus: ob?.financial_link_status ?? null,
          firstPaymentPaid: Boolean(latest?.paid_at),
          paymentRequestStatus: latest?.status ?? null,
          manualReviewStatus: latest?.paid_at && !["verified_investor", "rejected"].includes(latest.status)
            ? "pending_manual_verification"
            : latest?.status === "verified_investor" || latest?.status === "rejected"
              ? latest.status
              : null,
          manualInvestorStatus: latest?.status === "verified_investor" || latest?.status === "rejected"
            ? latest.status
            : "not_verified",
          kycStatus: kyc?.status ?? (kycAvailable ? "not_found" : "not_configured"),
          proofOfFunds: proofOfFundsStatus,
          missingPieces: pieces,
          dataSources,
        },
        timeline: {
          ndaSignedAt,
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
              expiresAt: kyc.expires_at ?? null,
              sanctionsChecked: Boolean(kyc.sanctions_checked),
              pepChecked: Boolean(kyc.pep_checked),
              amlScore: kyc.aml_score ?? null,
              verificationLevel: kyc.verification_level ?? null,
            }
          : null,
        reviews: reviews.map((r) => ({
          status: r.status,
          notes: r.notes,
          reviewedAt: r.reviewed_at,
          reviewerEmail: r.reviewed_by ? reviewerEmail.get(r.reviewed_by) ?? null : null,
          flags: Array.isArray(r.flags) ? r.flags : [],
        })),
        notes,
        tags,
      },
    }, 200, corsHeaders);
  } catch (error) {
    console.error("[fund-payment-admin-detail] Error:", error);
    return json({ error: error instanceof Error ? error.message : "Internal server error" }, 500, corsHeaders);
  }
});
