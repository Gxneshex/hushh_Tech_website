import type { ReactNode } from "react";

interface ConsentCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
  /** When true, shows an error border + tint to flag a required, unchecked box. */
  error?: boolean;
  disabled?: boolean;
  id?: string;
}

/**
 * Low-friction inline consent checkbox styled to match the Apple-style
 * onboarding surfaces (financial-link / step-9). One concise acknowledgment,
 * sits next to the existing CTA — no modal. Links inside `children` stay
 * clickable without toggling the box.
 */
export default function ConsentCheckbox({
  checked,
  onChange,
  children,
  error = false,
  disabled = false,
  id = "consent-checkbox",
}: ConsentCheckboxProps) {
  return (
    <label
      htmlFor={id}
      className={`flex cursor-pointer items-start gap-3 rounded-[16px] px-4 py-3 text-left transition ${
        error
          ? "bg-[#FF3B30]/[0.06] shadow-[inset_0_0_0_1px_rgba(255,59,48,0.35)]"
          : "bg-[#F5F5F7] shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.08)]"
      } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-[18px] w-[18px] shrink-0 cursor-pointer rounded-[5px] accent-[#0066CC]"
      />
      <span className="text-[13px] font-normal leading-[1.5] text-[#1D1D1F]/75">
        {children}
      </span>
    </label>
  );
}
