import { useCallback, useEffect, useState } from "react";

const RECENT_KEY = "kk_recently_viewed_v1";
const MAX_RECENT = 20;

export function readRecentlyViewed(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === "string")
      : [];
  } catch {
    return [];
  }
}

export function useRecentlyViewed() {
  const [recent, setRecent] = useState<string[]>(() => readRecentlyViewed());

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === RECENT_KEY) setRecent(readRecentlyViewed());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const recordView = useCallback((priceId: string) => {
    if (!priceId) return;
    setRecent((prev) => {
      const next = [priceId, ...prev.filter((id) => id !== priceId)].slice(
        0,
        MAX_RECENT,
      );
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {
        /* ignore storage failures */
      }
      return next;
    });
  }, []);

  return { recent, recordView };
}
