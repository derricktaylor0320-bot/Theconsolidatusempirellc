import { useEffect, useState } from "react";

const VISIT_COUNT_KEY = "kk_site_visit_count_v1";
const RETURN_VISITOR_EMAIL_KEY = "kk_return_visitor_discount_email_v1";

export function readSiteVisitCount(): number {
  try {
    const raw = localStorage.getItem(VISIT_COUNT_KEY);
    const parsed = Number.parseInt(raw || "0", 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  } catch {
    return 0;
  }
}

export function isRepeatSiteVisitor(): boolean {
  return readSiteVisitCount() >= 2;
}

export function readReturnVisitorDiscountEmail(): string {
  try {
    return localStorage.getItem(RETURN_VISITOR_EMAIL_KEY)?.trim() || "";
  } catch {
    return "";
  }
}

export function storeReturnVisitorDiscountEmail(email: string): void {
  try {
    localStorage.setItem(RETURN_VISITOR_EMAIL_KEY, email.trim().toLowerCase());
  } catch {
    /* ignore */
  }
}

/** Increment once per browser session so the second session counts as a repeat visit. */
export function useSiteVisits(): { visitCount: number; isRepeatVisitor: boolean } {
  const [visitCount, setVisitCount] = useState(readSiteVisitCount);

  useEffect(() => {
    try {
      const sessionKey = "kk_site_visit_session_recorded_v1";
      if (sessionStorage.getItem(sessionKey) === "1") {
        setVisitCount(readSiteVisitCount());
        return;
      }
      const next = readSiteVisitCount() + 1;
      localStorage.setItem(VISIT_COUNT_KEY, String(next));
      sessionStorage.setItem(sessionKey, "1");
      setVisitCount(next);
    } catch {
      /* ignore */
    }
  }, []);

  return {
    visitCount,
    isRepeatVisitor: visitCount >= 2,
  };
}
