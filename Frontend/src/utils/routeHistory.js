const ROUTE_HISTORY_KEY = "coursify_route_history";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

export function getCurrentRoute() {
  if (typeof window === "undefined") return "";
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

export function recordRoute(route) {
  if (!canUseStorage()) return;

  const nextRoute = String(route || "").trim();
  if (!nextRoute) return;

  const previous = getRouteHistory().current || "";
  if (previous === nextRoute) return;

  window.sessionStorage.setItem(
    ROUTE_HISTORY_KEY,
    JSON.stringify({
      previous,
      current: nextRoute,
    })
  );
}

export function getRouteHistory() {
  if (!canUseStorage()) return { previous: "", current: "" };

  try {
    return JSON.parse(window.sessionStorage.getItem(ROUTE_HISTORY_KEY) || "{\"previous\":\"\",\"current\":\"\"}");
  } catch {
    return { previous: "", current: "" };
  }
}

export function getPreviousRoute() {
  return getRouteHistory().previous || "";
}
