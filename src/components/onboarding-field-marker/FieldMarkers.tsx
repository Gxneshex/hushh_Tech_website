interface MarkerProps {
  className?: string;
}

const joinClassNames = (...items: Array<string | undefined>) =>
  items.filter(Boolean).join(" ");

export function RequiredAsterisk({ className }: MarkerProps) {
  return (
    <span
      aria-hidden="true"
      className={joinClassNames("ml-1 text-[#FF3B30]", className)}
    >
      *
    </span>
  );
}

export function OptionalMarker({ className }: MarkerProps) {
  return (
    <span
      className={joinClassNames(
        "ml-1 text-[10px] font-medium normal-case tracking-normal text-[#1D1D1F]/38",
        className
      )}
    >
      Optional
    </span>
  );
}

/**
 * Understated inline tag shown next to a field that was auto-filled from the
 * user's linked bank (Plaid identity). Professional, low-emphasis — reads as
 * provenance metadata, not a loud badge. Disappears once the user edits the field.
 */
export function BankFilledMarker({ className }: MarkerProps) {
  return (
    <span
      className={joinClassNames(
        "ml-2 inline-flex items-center gap-1 align-middle rounded-full bg-[#0066CC]/8 px-2 py-[2px] text-[9px] font-medium normal-case tracking-normal text-[#0066CC]",
        className
      )}
    >
      <span
        className="material-symbols-outlined text-[11px] leading-none"
        style={{ fontVariationSettings: "'FILL' 1, 'wght' 600" }}
        aria-hidden="true"
      >
        account_balance
      </span>
      From your bank
    </span>
  );
}

/**
 * Locked, verified-source tag for a field whose value is bank-verified (Plaid
 * identity). Unlike BankFilledMarker, this signals the field is READ-ONLY — the
 * verification step attests this exact value, so the user changes it by
 * re-linking/unlinking their bank, not by editing the field.
 */
export function BankVerifiedMarker({ className }: MarkerProps) {
  return (
    <span
      className={joinClassNames(
        "ml-2 inline-flex items-center gap-1 align-middle rounded-full bg-[#34C759]/12 px-2 py-[2px] text-[9px] font-medium normal-case tracking-normal text-[#1D7A3A]",
        className
      )}
    >
      <span
        className="material-symbols-outlined text-[11px] leading-none"
        style={{ fontVariationSettings: "'FILL' 1, 'wght' 600" }}
        aria-hidden="true"
      >
        verified
      </span>
      Bank-verified
    </span>
  );
}
