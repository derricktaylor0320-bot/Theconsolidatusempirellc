import { useEffect, useRef } from "react";
import { useLocation } from "wouter";

const VISITOR_ID_KEY = "tce_visitor_id_v1";

function getOrCreateVisitorId(): string {
  try {
    const existing = localStorage.getItem(VISITOR_ID_KEY);
    if (existing && existing.length >= 8) return existing;
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `v-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(VISITOR_ID_KEY, id);
    return id;
  } catch {
    return `v-${Date.now()}`;
  }
}

/** Records anonymous page views for the Empire Back Office analytics dashboard. */
export default function EmpirePageAnalytics() {
  const [location] = useLocation();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (!location || location === lastPath.current) return;
    lastPath.current = location;

    const payload = {
      path: location,
      visitorId: getOrCreateVisitorId(),
      referrer: document.referrer || undefined,
    };

    fetch("/api/analytics/page-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "same-origin",
    }).catch(() => {
      /* best-effort */
    });
  }, [location]);

  return null;
}
