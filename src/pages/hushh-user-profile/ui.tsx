/**
 * HushhUserProfile — Revamped UI
 * Clear separation: "Enhance with AI" (BLACK) vs "Save Changes" (WHITE)
 * Edit indicators on all editable fields.
 * Logic stays in logic.ts.
 */
import React from "react";
import { useHushhUserProfileLogic, FIELD_LABELS, VALUE_LABELS } from "./logic";
import { AlertTriangle, Brain, Check, Copy, ExternalLink, Globe, Pencil, Search, ShieldCheck } from "lucide-react";
import { FaApple } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import HushhTechBackHeader from "../../components/hushh-tech-back-header/HushhTechBackHeader";
import HushhTechCta, { HushhTechCtaVariant } from "../../components/hushh-tech-cta/HushhTechCta";
import HushhTechFooter, { HushhFooterTab } from "../../components/hushh-tech-footer/HushhTechFooter";
import NWSScoreBadge from "../../components/profile/NWSScoreBadge";
import { PrivacyShield } from "../../components/profile/PrivacyShield";
import WalletCardPreviewModal from "../../components/wallet/WalletCardPreviewModal";
import type { ProfileIntelligence } from "../../types/shadowProfile";
import {
  AppIcon,
  Display,
  Eyebrow,
  Lede,
  appleFont,
} from "../../components/hushh-tech-ui/HushhAppleUI";
import MyNdaDocuments from "../../components/nda/MyNdaDocuments";

const primaryCtaClass =
  "!rounded-full !border-[#0066CC] !bg-[#0066CC] !text-white !font-medium !tracking-[-0.01em] !shadow-none";
const secondaryCtaClass =
  "!rounded-full !border-[#1D1D1F]/15 !bg-white !text-[#1D1D1F] !font-medium !tracking-[-0.01em] !shadow-none";

/* ── Tiny reusable row (settings-style) with edit indicator ── */
const FieldRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="group flex items-center justify-between gap-4 border-b border-[#1D1D1F]/[0.08] py-4 transition-colors last:border-b-0 hover:bg-white/50">
    <span className="shrink-0 text-[14px] font-light text-[#1D1D1F]/55">{label}</span>
    <div className="flex items-center gap-2 text-right min-w-0 flex-1 justify-end">
      {children}
      {/* Subtle edit pencil — visible on hover */}
      <Pencil className="h-3 w-3 shrink-0 text-[#1D1D1F]/25 opacity-0 transition-opacity group-hover:opacity-100" />
    </div>
  </div>
);

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="mb-4 mt-2 text-[11px] font-medium uppercase tracking-[1.6px] text-[#0066CC]/85">{children}</p>
);

const formatGeneratedAt = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const getSourceLabel = (source: ProfileIntelligence["sources"][number]) => {
  if (source.title) return source.title;
  if (source.domain) return source.domain;
  try {
    return new URL(source.url).hostname.replace(/^www\./, "");
  } catch {
    return "Source";
  }
};

const formatMachineLabel = (value: string) =>
  value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const getConfidencePillClass = (label?: string) => {
  if (label === "High") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (label === "Medium") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-gray-200 bg-gray-50 text-gray-600";
};

const getIdentityLabel = (label?: string) => {
  if (label === "strong") return "Strong match";
  if (label === "possible") return "Possible match";
  if (label === "ambiguous") return "Ambiguous match";
  return "Low signal";
};

const getStatusText = (status: string, runningLabel: string) => {
  if (status === "running") return `${runningLabel}...`;
  if (status === "done") return "Ready";
  if (status === "error") return "Failed";
  if (status === "skipped") return "Skipped";
  return "Waiting";
};

const getStatusClass = (status: string) => {
  if (status === "running") return "text-[#1D1D1F]/45";
  if (status === "done") return "text-[#34C759]";
  if (status === "error") return "text-[#FF3B30]";
  if (status === "skipped") return "text-[#FF9500]";
  return "text-[#1D1D1F]/30";
};

const ProfileIntelligenceSection = ({
  intelligence,
}: {
  intelligence: ProfileIntelligence;
}) => {
  const sources = intelligence.sources || [];
  const evidence = intelligence.evidence?.length
    ? intelligence.evidence
    : sources.map((source) => ({
        title: source.title,
        domain: source.domain || getSourceLabel(source),
        url: source.url,
        supports: "Public web signal",
      }));
  const topEvidence = evidence.slice(0, 4);
  const summaryBullets =
    intelligence.summarySections?.length
      ? []
      : intelligence.summaryBullets?.length
      ? intelligence.summaryBullets.slice(0, 5)
      : intelligence.summary
        ? [intelligence.summary]
        : [];
  const summarySections = (intelligence.summarySections || [])
    .filter((section) => section.items?.length)
    .slice(0, 6);
  const publicProfiles = (intelligence.publicProfiles || []).slice(0, 4);
  const missingSignals = (
    intelligence.missingSignals?.length
      ? intelligence.missingSignals
      : intelligence.missingInformation || []
  ).slice(0, 6);
  const riskFlags = (intelligence.riskFlags || []).slice(0, 6);
  const redactions = (intelligence.redactions || []).slice(0, 6);
  const warnings = (intelligence.warnings || []).slice(0, 4);
  const generatedAt = formatGeneratedAt(intelligence.generatedAt);
  const confidenceLabel = intelligence.confidenceLabel || "Low";
  const statusLabel =
    intelligence.status === "completed"
      ? "Ready"
      : intelligence.status === "partial"
        ? "Partial"
        : intelligence.status === "failed"
          ? "Low signal"
          : "Ready";

  if (summaryBullets.length === 0 && topEvidence.length === 0 && publicProfiles.length === 0) {
    return null;
  }

  return (
    <section className="mb-12">
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between gap-4">
          <h2 className="text-[24px] font-medium leading-[1.06] tracking-[-0.028em] text-[#1D1D1F]">
            Profile intelligence.
          </h2>
          <div className="flex shrink-0 items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0066CC]/10 px-3 py-1 shadow-[inset_0_0_0_1px_rgba(0,102,204,0.18)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#0066CC]" />
              <span className="text-[10px] font-medium uppercase tracking-[1.6px] text-[#0066CC]">
                AI Researched
              </span>
            </span>
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 ${getConfidencePillClass(confidenceLabel)}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              <span className="text-[10px] font-medium uppercase tracking-[1.6px]">{confidenceLabel}</span>
            </span>
          </div>
        </div>
        <p className="text-[12px] leading-[1.45] text-[#1D1D1F]/55">
          A consent-gated, cited view of public signals Hushh found for your own profile.
        </p>
      </div>

      <div className="space-y-7 rounded-[22px] bg-[#F5F5F7] p-5 shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.08)]">
        <div className="border-b border-[#1D1D1F]/[0.08] pb-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px] bg-white shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.08)]">
              <Brain className="h-4 w-4 text-[#0066CC]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[14px] font-medium text-[#1D1D1F]">
                  {intelligence.headline || "Public web self-audit is ready"}
                </p>
                <span className="shrink-0 text-[10px] font-medium uppercase tracking-[1.6px] text-[#1D1D1F]/45">
                  {statusLabel}
                </span>
              </div>
              {(generatedAt || intelligence.model) && (
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[#1D1D1F]/45">
                  {generatedAt && <span>{generatedAt}</span>}
                  {intelligence.model && <span>{intelligence.model}</span>}
                </div>
              )}
            </div>
          </div>
        </div>

        {summarySections.length > 0 && (
          <div>
            <SectionLabel>Readable Summary</SectionLabel>
            <div className="space-y-4 border-b border-[#1D1D1F]/[0.08] pb-4">
              {summarySections.map((section) => (
                <div key={section.title}>
                  <p className="mb-2 text-[14px] font-medium text-[#1D1D1F]">{section.title}</p>
                  <ul className="space-y-2">
                    {section.items.map((item) => (
                      <li key={item} className="flex gap-3 text-[14px] leading-[1.45] text-[#1D1D1F]/70">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#34C759]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {summarySections.length === 0 && summaryBullets.length > 0 && (
          <div>
            <SectionLabel>Readable Summary</SectionLabel>
            <ul className="space-y-3 border-b border-[#1D1D1F]/[0.08] pb-4">
              {summaryBullets.map((item) => (
                <li key={item} className="flex gap-3 text-[14px] leading-[1.45] text-[#1D1D1F]/70">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#34C759]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {intelligence.identityMatch && (
          <div className="border-b border-[#1D1D1F]/[0.08] pb-4">
            <SectionLabel>Identity Match</SectionLabel>
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#0066CC]" />
              <div>
                <p className="text-[14px] font-medium text-[#1D1D1F]">
                  {getIdentityLabel(intelligence.identityMatch.label)}
                </p>
                <p className="mt-1 text-[12px] leading-[1.45] text-[#1D1D1F]/55">
                  {intelligence.identityMatch.explanation}
                </p>
              </div>
            </div>
          </div>
        )}

        {publicProfiles.length > 0 && (
          <div>
            <SectionLabel>Public Profiles</SectionLabel>
            <div className="space-y-2">
              {publicProfiles.map((profile) => (
                <a
                  key={profile.url}
                  href={profile.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-3 border-b border-[#1D1D1F]/[0.08] py-3 text-[14px] transition hover:opacity-80"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-[#1D1D1F]">{profile.platform}</p>
                    <p className="truncate text-[12px] text-[#1D1D1F]/55">{profile.title}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-[10px] uppercase tracking-[1.6px] text-[#1D1D1F]/45">
                      {profile.confidence}
                    </span>
                    <ExternalLink className="h-3.5 w-3.5 text-[#0066CC]" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        <div>
          <SectionLabel>Sources ({sources.length})</SectionLabel>
          {topEvidence.length > 0 ? (
            <div className="space-y-2 border-b border-[#1D1D1F]/[0.08] pb-4">
              {topEvidence.map((source) => (
                <a
                  key={source.url}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-3 rounded-[14px] bg-white px-3 py-2 text-[14px] text-[#0066CC] shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.08)] transition hover:opacity-80"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{source.title}</p>
                    <p className="truncate text-[11px] text-[#1D1D1F]/45">
                      {source.domain} · {source.supports}
                    </p>
                  </div>
                  <Globe className="h-3.5 w-3.5 shrink-0" />
                </a>
              ))}
            </div>
          ) : (
            <p className="border-b border-[#1D1D1F]/[0.08] pb-4 text-[14px] text-[#1D1D1F]/45">
              Not enough reliable cited sources found.
            </p>
          )}
        </div>

        {missingSignals.length > 0 && (
          <div className="border-b border-[#1D1D1F]/[0.08] pb-4">
            <SectionLabel>Missing Signals</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {missingSignals.map((item) => (
                <span
                  key={item}
                  className="rounded-full bg-[#FF9500]/10 px-2.5 py-1 text-[12px] text-[#1D1D1F]/70 shadow-[inset_0_0_0_1px_rgba(255,149,0,0.20)]"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {(riskFlags.length > 0 || redactions.length > 0 || warnings.length > 0) && (
          <details className="group border-b border-[#1D1D1F]/[0.08] pb-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[14px] font-medium text-[#1D1D1F]">
              <span className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-[#FF9500]" />
                Risk and privacy notes
              </span>
              <Search className="h-4 w-4 text-[#1D1D1F]/30 transition-transform group-open:rotate-180" />
            </summary>
            <div className="mt-4 space-y-4">
              {riskFlags.length > 0 && (
                <div>
                  <p className="mb-2 text-[12px] font-medium text-[#1D1D1F]/55">Risk flags</p>
                  <div className="flex flex-wrap gap-2">
                    {riskFlags.map((item) => (
                      <span key={item} className="rounded-full bg-white px-2.5 py-1 text-[12px] text-[#1D1D1F]/65 shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.10)]">
                        {formatMachineLabel(item)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {redactions.length > 0 && (
                <div>
                  <p className="mb-2 text-[12px] font-medium text-[#1D1D1F]/55">Redacted</p>
                  <div className="flex flex-wrap gap-2">
                    {redactions.map((item) => (
                      <span key={item} className="rounded-full bg-[#FF3B30]/10 px-2.5 py-1 text-[12px] text-[#1D1D1F]/70 shadow-[inset_0_0_0_1px_rgba(255,59,48,0.18)]">
                        {formatMachineLabel(item)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {warnings.length > 0 && (
                <div className="space-y-2">
                  {warnings.map((item) => (
                    <p key={item} className="text-[12px] leading-[1.45] text-[#1D1D1F]/55">{item}</p>
                  ))}
                </div>
              )}
            </div>
          </details>
        )}

        {intelligence.status === "failed" && (
          <div className="rounded-[14px] bg-white px-3 py-3 text-[14px] text-[#1D1D1F]/55 shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.08)]">
            Not enough reliable public signals found yet. Add clearer public profile links or try again later.
          </div>
        )}
      </div>
    </section>
  );
};

/* Inline input class */
const inlineInput = "w-full border-none bg-transparent p-0 text-right text-[14px] font-medium text-[#1D1D1F] focus:ring-0 placeholder:text-[#1D1D1F]/35";

/* ── Page ── */
const HushhUserProfilePage: React.FC = () => {
  const {
    form, investorProfile, shadowProfile, loading, loadingSeconds, isProcessing, investorStatus, intelligenceStatus,
    hasOnboardingData, isApplePassLoading, isGooglePassLoading, nwsResult, nwsLoading,
    isWalletPreviewOpen, appleWalletSupported, appleWalletSupportMessage,
    googleWalletSupported, googleWalletSupportMessage, walletPreview,
    hasCopied, onCopy, profileUrl, navigate,
    handleChange, handleBack, handleSave,
    isDirty, isSaving, handleSaveChanges,
    handleAppleWalletPass, handleGoogleWalletPass, COUNTRIES,
    openWalletPreview, closeWalletPreview,
    editingField, setEditingField, FIELD_OPTIONS, MULTI_SELECT_FIELDS,
    handleUpdateAIField, handleMultiSelectToggle, getConfidenceLabel, getConfidenceBadgeClass,
  } = useHushhUserProfileLogic();

  const firstName = form.name?.split(" ")[0] || "Investor";
  const profileIntelligence = shadowProfile?.profileIntelligence;

  return (
    <div
      className="flex min-h-screen flex-col bg-[#FFFFFF] text-[#1D1D1F] antialiased selection:bg-[#0066CC] selection:text-[#F5F5F7]"
      style={{ fontFamily: appleFont }}
    >
      {/* ═══ Header ═══ */}
      <HushhTechBackHeader onBackClick={handleBack} rightType="hamburger" />

      <main className="mx-auto w-full max-w-[560px] flex-grow px-5 pb-48">
        {/* ── Hero ── */}
        <section className="pb-9 pt-8 text-center">
          <div className="mb-6 flex justify-center">
            <AppIcon kind="profile" size={62} />
          </div>
          <Eyebrow>Premium Member</Eyebrow>
          <Display as="h1" size="sm" maxWidth="max-w-[440px]">
            Investor profile.
          </Display>
          <Lede className="text-[16px] md:text-[18px]">
            Welcome back, {firstName}.
          </Lede>
        </section>

        {/* ── NWS strip ── */}
        <section className="mb-10 flex items-center justify-between rounded-[22px] bg-[#F5F5F7] p-5 shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.08)]">
          <span
            className="text-[17px] font-medium tracking-[-0.01em] text-[#1D1D1F]"
            style={{ fontFamily: appleFont }}
          >
            Net Worth Score
          </span>
          {nwsResult ? (
            <NWSScoreBadge result={nwsResult} loading={nwsLoading} size="sm" />
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.10)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#1D1D1F]/25" />
              <span className="text-[10px] font-medium uppercase tracking-[1.6px] text-[#1D1D1F]/45">
                Non-Verified
              </span>
            </span>
          )}
        </section>

        {/* ── Processing Banner ── */}
        {isProcessing && (
          <section className="mb-6 animate-pulse-slow rounded-[20px] bg-[#0066CC]/10 p-4 shadow-[inset_0_0_0_1px_rgba(0,102,204,0.18)]">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[10px] font-medium uppercase tracking-[1.6px] text-[#1D1D1F]/55">
                Building Profile · {loadingSeconds}s
              </span>
              <span className="h-2 w-2 animate-ping rounded-full bg-[#0066CC]" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[#1D1D1F]/55">Investor Profile</span>
                <span className={`text-[10px] uppercase tracking-widest font-medium ${getStatusClass(investorStatus)}`}>
                  {getStatusText(investorStatus, "Analyzing")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[#1D1D1F]/55">Profile Intelligence</span>
                <span className={`text-[10px] uppercase tracking-widest font-medium ${getStatusClass(intelligenceStatus)}`}>
                  {getStatusText(intelligenceStatus, "Researching")}
                </span>
              </div>
            </div>
          </section>
        )}

        {/* ── AI Section ── */}
        <section className="mb-12 rounded-[24px] bg-[#F5F5F7] p-5 shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.08)]">
          <h2
            className="mb-3 text-[24px] font-medium leading-[1.06] tracking-[-0.028em] text-[#1D1D1F]"
            style={{ fontFamily: appleFont }}
          >
            AI-Powered Profile Intelligence
          </h2>
          <p className="mb-6 text-[14px] font-light leading-[1.45] text-[#1D1D1F]/60">
            Hushh AI automatically detects your investment preferences and risk
            appetite to tailor opportunities specifically for you.
          </p>
          <HushhTechCta
            variant={HushhTechCtaVariant.BLACK}
            onClick={handleSave}
            disabled={loading || isProcessing}
            className={primaryCtaClass}
          >
            {loading
              ? `Generating... ${loadingSeconds}s`
              : investorProfile
              ? "Re-enhance with AI"
              : hasOnboardingData
              ? "Enhance with AI"
              : "Generate Investor Profile"}
            <span className="material-symbols-outlined text-lg">auto_awesome</span>
          </HushhTechCta>
        </section>

        {/* ── AI-Generated Investment Profile ── */}
        {investorProfile && Object.keys(investorProfile).length > 0 && (
          <section className="mb-12">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-[24px] font-medium leading-[1.06] tracking-[-0.028em] text-[#1D1D1F]">
                  Investment profile.
                </h2>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0066CC]/10 px-3 py-1 shadow-[inset_0_0_0_1px_rgba(0,102,204,0.18)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#0066CC]" />
                  <span className="text-[10px] font-medium uppercase tracking-[1.6px] text-[#0066CC]">AI Analyzed</span>
                </span>
              </div>
              <p className="text-[12px] leading-[1.45] text-[#1D1D1F]/55">
                AI-detected preferences based on your profile data. Tap any field to adjust.
              </p>
            </div>

            <div className="rounded-[22px] bg-[#F5F5F7] p-5 shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.08)]">
              <SectionLabel>AI Preferences</SectionLabel>
              {Object.entries(investorProfile).map(([fieldName, fieldData]: [string, any]) => {
                if (!fieldData || typeof fieldData !== 'object') return null;
                const label = FIELD_LABELS[fieldName as keyof typeof FIELD_LABELS] || fieldName;
                const valueText = Array.isArray(fieldData.value)
                  ? fieldData.value.map((v: string) => VALUE_LABELS[v as keyof typeof VALUE_LABELS] || v).join(", ")
                  : VALUE_LABELS[fieldData.value as keyof typeof VALUE_LABELS] || fieldData.value;
                const confidence = fieldData.confidence || 0;
                const confLabel = getConfidenceLabel(confidence);
                const isEditing = editingField === fieldName;
                const options = FIELD_OPTIONS[fieldName];
                const isMulti = MULTI_SELECT_FIELDS.includes(fieldName);

                return (
                  <div key={fieldName}>
                    <div
                      className="group flex cursor-pointer items-center justify-between gap-4 border-b border-[#1D1D1F]/[0.08] py-4 transition-colors hover:bg-white/50"
                      onClick={() => options && setEditingField(isEditing ? null : fieldName)}
                      role="button"
                      tabIndex={0}
                      aria-label={`Edit ${label}`}
                      onKeyDown={(e) => { if (e.key === 'Enter' && options) setEditingField(isEditing ? null : fieldName); }}
                    >
                      <span className="shrink-0 text-[14px] font-light text-[#1D1D1F]/55">{label}</span>
                      <div className="flex items-center gap-2">
                        <span className="max-w-[140px] truncate text-[14px] font-medium text-[#1D1D1F]">{valueText || "—"}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full border shrink-0 ${getConfidenceBadgeClass(confidence)}`}>
                          {confLabel}
                        </span>
                        {options && (
                          <Pencil className="h-3 w-3 shrink-0 text-[#1D1D1F]/25 opacity-0 transition-opacity group-hover:opacity-100" />
                        )}
                      </div>
                    </div>
                    {/* Inline edit when tapped */}
                    {isEditing && options && (
                      <div className="px-1 pb-4 pt-1" onClick={(e) => e.stopPropagation()}>
                        {isMulti ? (
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {options.map((opt) => {
                              const currentVals = Array.isArray(fieldData.value) ? fieldData.value : [];
                              const isSelected = currentVals.includes(opt.value);
                              return (
                                <button
                                  key={opt.value}
                                  onClick={() => handleMultiSelectToggle(fieldName, opt.value)}
                                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                                    isSelected ? 'border-[#0066CC] bg-[#0066CC] text-white' : 'border-[#1D1D1F]/10 bg-white text-[#1D1D1F]/65'
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="relative mb-2">
                            <select
                              value={fieldData.value || ""}
                              onChange={(e) => handleUpdateAIField(fieldName, e.target.value)}
                              className="w-full cursor-pointer appearance-none border-none bg-transparent p-0 pr-6 text-right text-[14px] font-medium text-[#1D1D1F] focus:ring-0"
                            >
                              {options.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                            <span className="material-symbols-outlined pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-lg text-[#1D1D1F]/25">expand_more</span>
                          </div>
                        )}
                        <button onClick={() => setEditingField(null)} className="text-[10px] font-medium uppercase tracking-[1.6px] text-[#1D1D1F]/45">Done</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {profileIntelligence && (
          <ProfileIntelligenceSection intelligence={profileIntelligence} />
        )}

        {/* ── Your Hushh Profile (editable section) ── */}
        <section className="mb-6">
          <div className="mb-8">
            <h2
              className="mb-2 text-[24px] font-medium leading-[1.06] tracking-[-0.028em] text-[#1D1D1F]"
              style={{ fontFamily: appleFont }}
            >
              Your Hushh profile.
            </h2>
            <p className="text-[12px] leading-[1.45] text-[#1D1D1F]/55">
              Tap any field to edit your details. Changes are saved separately from AI analysis.
            </p>
            {/* Edit hint banner */}
            <div className="mt-3 flex items-center gap-2 rounded-[14px] bg-[#F5F5F7] px-3 py-2 shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.08)]">
              <Pencil className="h-3.5 w-3.5 shrink-0 text-[#1D1D1F]/35" />
              <span className="text-[11px] text-[#1D1D1F]/45">Tap any field to edit · click "Save Changes" to update</span>
            </div>
          </div>

          {/* Personal Information */}
          <div className="rounded-[22px] bg-[#F5F5F7] p-5 shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.08)]">
            <SectionLabel>Personal Information</SectionLabel>
            <FieldRow label="Full Name">
              <input type="text" value={form.name} onChange={(e) => handleChange("name", e.target.value)} className={inlineInput} placeholder="Your Name" />
            </FieldRow>
            <PrivacyShield
              email={form.email}
              phone={`${form.phoneCountryCode} ${form.phoneNumber}`.trim()}
              className="my-4"
              emailControl={
                <input
                  type="email"
                  aria-label="Email address"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className={inlineInput}
                  placeholder="you@email.com"
                />
              }
              phoneControl={
                <div className="flex items-center gap-1 min-w-0">
                  <select
                    aria-label="Phone country code"
                    value={form.phoneCountryCode}
                    onChange={(e) => handleChange("phoneCountryCode", e.target.value)}
                    className="shrink-0 appearance-none border-none bg-transparent p-0 text-right text-[14px] font-medium text-[#1D1D1F] focus:ring-0"
                  >
                    <option value="+1">+1</option>
                    <option value="+44">+44</option>
                    <option value="+91">+91</option>
                  </select>
                  <input
                    type="tel"
                    aria-label="Phone number"
                    value={form.phoneNumber}
                    onChange={(e) => handleChange("phoneNumber", e.target.value)}
                    className={inlineInput}
                    placeholder="98765 43210"
                  />
                </div>
              }
            />
            <FieldRow label="Age">
              <input type="number" value={form.age} onChange={(e) => handleChange("age", e.target.value)} className={inlineInput} placeholder="34" />
            </FieldRow>
          </div>

          {/* Investment Details */}
          <div className="mt-6 rounded-[22px] bg-[#F5F5F7] p-5 shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.08)]">
            <SectionLabel>Investment Details</SectionLabel>
            <FieldRow label="Organisation">
              <input type="text" value={form.organisation} onChange={(e) => handleChange("organisation", e.target.value)} className={inlineInput} placeholder="Company Name" />
            </FieldRow>
            <FieldRow label="Account Type">
              <div className="relative">
                <select value={form.accountType} onChange={(e) => handleChange("accountType", e.target.value)} className="cursor-pointer appearance-none border-none bg-transparent p-0 pr-6 text-right text-[14px] font-medium text-[#1D1D1F] focus:ring-0">
                  <option value="" disabled>Select</option>
                  <option value="individual">Individual</option>
                  <option value="joint">Joint</option>
                  <option value="retirement">Retirement (IRA)</option>
                  <option value="trust">Trust</option>
                </select>
                <span className="material-symbols-outlined pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-lg text-[#1D1D1F]/25">expand_more</span>
              </div>
            </FieldRow>
            <FieldRow label="Account Structure">
              <div className="relative">
                <select value={form.accountStructure} onChange={(e) => handleChange("accountStructure", e.target.value)} className="cursor-pointer appearance-none border-none bg-transparent p-0 pr-6 text-right text-[14px] font-medium text-[#1D1D1F] focus:ring-0">
                  <option value="" disabled>Select</option>
                  <option value="discretionary">Discretionary</option>
                  <option value="non-discretionary">Non-Discretionary</option>
                </select>
                <span className="material-symbols-outlined pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-lg text-[#1D1D1F]/25">expand_more</span>
              </div>
            </FieldRow>
            <FieldRow label="Selected Fund">
              <div className="relative">
                <select value={form.selectedFund} onChange={(e) => handleChange("selectedFund", e.target.value)} className="cursor-pointer appearance-none border-none bg-transparent p-0 pr-6 text-right text-[14px] font-medium text-[#1D1D1F] focus:ring-0">
                  <option value="" disabled>Choose</option>
                  <option value="hushh_fund_a">Fund A</option>
                  <option value="hushh_fund_b">Fund B</option>
                  <option value="hushh_fund_c">Fund C</option>
                </select>
                <span className="material-symbols-outlined pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-lg text-[#1D1D1F]/25">expand_more</span>
              </div>
            </FieldRow>
            <FieldRow label="Initial Investment">
              <input
                type="text"
                value={form.initialInvestmentAmount ? `$${Number(form.initialInvestmentAmount).toLocaleString()}` : ""}
                onChange={(e) => { const raw = e.target.value.replace(/[^0-9]/g, ""); handleChange("initialInvestmentAmount", raw); }}
                className={inlineInput}
                placeholder="$50,000"
              />
            </FieldRow>
          </div>

          {/* Legal & Residential */}
          <div className="mt-6 rounded-[22px] bg-[#F5F5F7] p-5 shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.08)]">
            <SectionLabel>Legal &amp; Residential</SectionLabel>
            <FieldRow label="Country">
              <div className="relative inline-flex">
                <select value={form.citizenshipCountry} onChange={(e) => handleChange("citizenshipCountry", e.target.value)} className="cursor-pointer appearance-none border-none bg-transparent p-0 pr-6 text-right text-[14px] font-medium text-[#1D1D1F] focus:ring-0">
                  <option value="" disabled>Select</option>
                  {COUNTRIES.map((c) => (<option key={c} value={c}>{c}</option>))}
                </select>
                <span className="material-symbols-outlined pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-lg text-[#1D1D1F]/25">expand_more</span>
              </div>
            </FieldRow>
            <FieldRow label="State">
              <input type="text" value={form.state} onChange={(e) => handleChange("state", e.target.value)} className={inlineInput} placeholder="State" />
            </FieldRow>
            <FieldRow label="Address">
              <input type="text" value={form.addressLine1} onChange={(e) => handleChange("addressLine1", e.target.value)} className={inlineInput} placeholder="Street address" />
            </FieldRow>
            <FieldRow label="City">
              <input type="text" value={form.city} onChange={(e) => handleChange("city", e.target.value)} className={inlineInput} placeholder="City" />
            </FieldRow>
            <FieldRow label="Zip Code">
              <input type="text" value={form.zipCode} onChange={(e) => handleChange("zipCode", e.target.value)} className={inlineInput} placeholder="560001" />
            </FieldRow>
          </div>

          {/* Save Changes button — right after editable fields, WHITE variant */}
          <div className="mt-6">
            <HushhTechCta
              variant={HushhTechCtaVariant.WHITE}
              onClick={handleSaveChanges}
              disabled={!isDirty || isSaving}
              className={secondaryCtaClass}
            >
              {isSaving ? (
                <>Saving... <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span></>
              ) : isDirty ? (
                <>Save Changes <span className="material-symbols-outlined text-lg">save</span></>
              ) : (
                <>Profile Saved <Check className="h-4 w-4 text-[#1D1D1F]/35" /></>
              )}
            </HushhTechCta>
          </div>
        </section>

        {/* ── Profile Link + Wallet ── */}
        <section className="mb-12 rounded-[24px] bg-[#F5F5F7] p-5 shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.08)]">
          <div className="flex items-center justify-between py-3 mb-6">
            <span className="text-[14px] font-light text-[#1D1D1F]/55">Profile Link</span>
            <button type="button" onClick={onCopy} className="flex cursor-pointer items-center gap-2 text-[#0066CC]">
              <span className="max-w-[160px] truncate text-[12px] font-medium">{profileUrl || "hushhtech.com/investor/..."}</span>
              {hasCopied ? <Check className="h-4 w-4 text-[#34C759]" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          <button
            type="button"
            onClick={openWalletPreview}
            className="mb-4 flex w-full items-center justify-center gap-2 rounded-full bg-white px-4 py-3 transition-colors shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.12)] hover:bg-[#FFFFFF]/75"
          >
            <span className="text-[12px] font-medium">View Hushh Gold Pass</span>
          </button>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={handleAppleWalletPass}
              disabled={isApplePassLoading || !appleWalletSupported}
              className="flex items-center justify-center gap-2 rounded-full bg-white px-4 py-3 transition-colors shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.12)] hover:bg-[#FFFFFF]/75 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FaApple className="text-lg" />
              <span className="text-[12px] font-medium">{isApplePassLoading ? "Loading..." : "Apple Wallet"}</span>
            </button>
            <button type="button" onClick={handleGoogleWalletPass} disabled={isGooglePassLoading || !googleWalletSupported} className="flex items-center justify-center gap-2 rounded-full bg-white px-4 py-3 transition-colors shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.12)] hover:bg-[#FFFFFF]/75 disabled:cursor-not-allowed disabled:opacity-50">
              <FcGoogle className="text-lg" />
              <span className="text-[12px] font-medium">{isGooglePassLoading ? "Loading..." : "Google Wallet"}</span>
            </button>
          </div>
          {!appleWalletSupported && (
            <p className="mt-3 text-[12px] font-light text-[#1D1D1F]/55">
              {appleWalletSupportMessage}
            </p>
          )}
          {!googleWalletSupported && (
            <p className="mt-3 text-[12px] font-light text-[#1D1D1F]/55">
              {googleWalletSupportMessage}
            </p>
          )}
        </section>

        <WalletCardPreviewModal
          isOpen={isWalletPreviewOpen}
          onClose={closeWalletPreview}
          preview={walletPreview}
          appleWalletSupported={appleWalletSupported}
          appleWalletSupportMessage={appleWalletSupportMessage}
          onAddToAppleWallet={handleAppleWalletPass}
          isApplePassLoading={isApplePassLoading}
          googleWalletAvailable={googleWalletSupported}
          googleWalletSupportMessage={googleWalletSupportMessage}
          onAddToGoogleWallet={handleGoogleWalletPass}
          isGooglePassLoading={isGooglePassLoading}
        />

        {/* ── My NDA & Documents (shared component; also on /my-documents) ── */}
        <MyNdaDocuments />

        {/* ── Bottom CTA ── */}
        <section className="pb-12">
          <HushhTechCta
            variant={HushhTechCtaVariant.WHITE}
            onClick={() => navigate("/")}
            className={secondaryCtaClass}
          >
            Go to Home
          </HushhTechCta>
        </section>
      </main>

      {/* ═══ Footer Nav ═══ */}
      <HushhTechFooter activeTab={HushhFooterTab.PROFILE} />
    </div>
  );
};

export default HushhUserProfilePage;
