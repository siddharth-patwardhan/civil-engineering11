import { createContext, useContext, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type AuthSession } from "@/services/api";

interface AuthContextValue {
  session: AuthSession | null;
  user: AuthSession["user"] | null;
  organization: AuthSession["organization"];
  needsSetup: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data: session, isLoading, refetch } = useQuery({
    queryKey: ["auth", "session"],
    queryFn: async () => {
      try {
        return await api.session();
      } catch {
        return null;
      }
    },
    retry: false,
    staleTime: 5 * 60_000,
  });

  const signOut = async () => {
    await api.logout();
    queryClient.setQueryData(["auth", "session"], null);
    await queryClient.invalidateQueries({ queryKey: ["auth", "session"] });
  };

  const refresh = async () => {
    await refetch();
  };

  const value: AuthContextValue = {
    session: session ?? null,
    user: session?.user ?? null,
    organization: session?.organization ?? null,
    needsSetup: Boolean(session?.needsSetup),
    isAuthenticated: Boolean(session?.user),
    isLoading,
    signOut,
    refresh,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
