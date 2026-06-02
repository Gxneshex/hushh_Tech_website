import { appleDisplayFont, appleFont } from "../../components/hushh-tech-ui/HushhAppleUI";

export { appleDisplayFont, appleFont };

export const pageBg = "#F5F5F7";
export const textPrimary = "#1D1D1F";
export const textSecondary = "rgba(29, 29, 31, 0.6)";
export const textTertiary = "rgba(29, 29, 31, 0.48)";
export const brandBlue = "#0066CC";
export const cardBorder = "rgba(29, 29, 31, 0.07)";

export const inputFocus = {
  borderColor: brandBlue,
  boxShadow: `0 0 0 1px ${brandBlue}, 0 0 0 4px rgba(0, 102, 204, 0.1)`,
};

export const focusVisible = {
  _focusVisible: inputFocus,
};

export const glassCardChrome = {
  borderRadius: "24px" as const,
  borderWidth: "1px",
  borderColor: cardBorder,
  bg: "rgba(255, 255, 255, 0.82)",
  boxShadow:
    "0 24px 70px rgba(29, 29, 31, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.82)",
  backdropFilter: "blur(22px)",
};

export const glassCardInteractiveChrome = {
  ...glassCardChrome,
  transition: "border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease",
  _hover: {
    borderColor: "rgba(0, 102, 204, 0.24)",
    boxShadow:
      "0 28px 80px rgba(29, 29, 31, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.9)",
    transform: "translateY(-1px)",
    textDecoration: "none",
  },
};

export const fieldChrome = {
  borderRadius: "14px" as const,
  borderColor: "rgba(29, 29, 31, 0.08)",
  bg: "rgba(249, 250, 251, 0.78)",
  color: textPrimary,
  fontSize: "15px",
  fontWeight: "400",
  boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.75)",
  _placeholder: { color: "rgba(29, 29, 31, 0.38)" },
  _hover: { borderColor: "rgba(29, 29, 31, 0.18)" },
  _focusVisible: inputFocus,
};

export const sectionHeadingProps = {
  fontSize: { base: "26px", md: "30px" },
  lineHeight: "1.12",
  letterSpacing: "-0.022em",
  fontWeight: "600",
  color: textPrimary,
};
