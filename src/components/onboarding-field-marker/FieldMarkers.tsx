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
