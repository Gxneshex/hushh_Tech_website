import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthSession } from '../auth/AuthSessionProvider';
import { buildLoginRedirectPath } from '../auth/routePolicy';
import { isFundAdminEmail } from '../services/fundAdmin/allowlist';

interface FundAdminRouteProps {
  children: React.ReactNode;
}

/**
 * Gate for the internal Hushh Fund verification dashboard (`/fund-admin`).
 * Unlike ProtectedRoute, this must NOT run the investor onboarding flow —
 * team members are not investors, so we never bounce them to financial-link.
 * The real authorization lives server-side in the fund-payment-admin-* edge
 * functions; this guard just keeps non-team members out of the UI shell.
 */
const FundAdminRoute: React.FC<FundAdminRouteProps> = ({ children }) => {
  const { status, user } = useAuthSession();
  const location = useLocation();

  if (status === 'booting') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0066CC] mx-auto" />
          <p className="mt-4 text-gray-600">Loading…</p>
        </div>
      </div>
    );
  }

  if (status !== 'authenticated' || !user) {
    return (
      <Navigate
        to={buildLoginRedirectPath(location.pathname, location.search, location.hash)}
        replace
      />
    );
  }

  if (!isFundAdminEmail(user.email)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default FundAdminRoute;
