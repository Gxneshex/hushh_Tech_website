import { useLocation, useNavigate } from "react-router-dom";
import {
  CANONICAL_ONBOARDING_ROUTES,
  getOnboardingDisplayMeta,
  withLocalOnboardingPreview,
} from "../../services/onboarding/flow";

export function OnboardingStepJumpNav({
  currentStep,
  totalSteps,
}: OnboardingStepJumpNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const steps = CANONICAL_ONBOARDING_ROUTES.slice(0, totalSteps);

  return (
    <nav
      aria-label="Onboarding step navigation"
      className="mt-4 flex items-center justify-center gap-2"
    >
      {steps.map((route) => {
        const meta = getOnboardingDisplayMeta(route);
        const isCurrent = meta.displayStep === currentStep;
        const isPast = meta.displayStep < currentStep;

        return (
          <button
            key={route}
            type="button"
            onClick={() => {
              if (location.pathname === route) return;
              navigate(withLocalOnboardingPreview(route));
            }}
            aria-current={isCurrent ? "step" : undefined}
            aria-label={`Go to onboarding step ${meta.displayStep}`}
            className={`flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-medium transition active:scale-95 ${
              isCurrent
                ? "bg-[#0066CC] text-white shadow-[0_8px_20px_rgba(0,102,204,0.24)]"
                : isPast
                  ? "bg-[#EAF4FF] text-[#0066CC] shadow-[inset_0_0_0_0.5px_rgba(0,102,204,0.20)] hover:bg-[#DDEFFF]"
                  : "bg-white text-[#1D1D1F]/42 shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.12)] hover:text-[#1D1D1F]/65"
            }`}
          >
            {meta.displayStep}
          </button>
        );
      })}
    </nav>
  );
}

interface OnboardingStepJumpNavProps {
  currentStep: number;
  totalSteps: number;
}
