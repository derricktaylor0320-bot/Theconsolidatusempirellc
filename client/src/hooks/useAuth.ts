import { useQuery } from "@tanstack/react-query";
import type { PublicUser } from "@shared/schema";

export function useAuth() {
  const { data, isLoading, error } = useQuery<PublicUser | null>({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      const res = await fetch("/api/auth/user", { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to load user");
      return (await res.json()) as PublicUser;
    },
    retry: false,
    staleTime: 1000 * 60,
  });

  return {
    user: data ?? null,
    isLoading,
    isAuthenticated: !!data,
    error,
  };
}
