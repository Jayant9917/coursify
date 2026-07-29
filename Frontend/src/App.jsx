import { useEffect, useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";
import { AppRoutes } from "@/routes";
import { useAuth } from "@/hooks/useAuth";
import { authApi, getStoredRefreshToken, setStoredRefreshToken } from "@/services/api";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ClickSpark } from "@/components/common/ClickSpark";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { recordRoute, getCurrentRoute } from "@/utils/routeHistory";
import { brand } from "@/utils/brand";

export default function App() {
  const { hydrated, setAuth, clearAuth, markHydrated } = useAuth();
  const location = useLocation();
  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      try {
        const refreshToken = getStoredRefreshToken();
        if (refreshToken) {
          const data = await authApi.refresh();
          if (!mounted) return;
          setStoredRefreshToken(data.refreshToken);
          setAuth(data.user, data.accessToken);
        } else {
          markHydrated();
        }
      } catch {
        if (!mounted) return;
        clearAuth();
        setStoredRefreshToken(null);
        markHydrated();
      }
    };

    bootstrap();
    return () => {
      mounted = false;
    };
  }, [setAuth, clearAuth, markHydrated]);

  useEffect(() => {
    recordRoute(getCurrentRoute());
  }, [location.pathname, location.search, location.hash]);

  useLayoutEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);
  }, [location.pathname, location.search]);

  if (!hydrated) {
    return <LoadingSpinner label={`Loading ${brand.name}...`} />;
  }

  return (
    <ErrorBoundary>
      <ClickSpark>
        <AppRoutes />
      </ClickSpark>
    </ErrorBoundary>
  );
}
