"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

type AdminUser = {
  id: string;
  email: string;
  full_name: string;
  role: "owner" | "admin" | "editor";
  preferred_locale: string;
  is_active: boolean;
  last_login_at: string | null;
  avatar_media_id: string | null;
};

type AuthState = {
  accessToken: string | null;
  user: AdminUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<boolean>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail ?? "Échec de connexion");
      }

      const data = await res.json();
      setAccessToken(data.access_token);

      const meRes = await fetch("/api/admin/auth/me", {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });
      const meData = await meRes.json();
      setUser(meData);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    setAccessToken(null);
    setUser(null);
  }, []);

    const restoreSession = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch("/api/admin/auth/refresh", { method: "POST" });
      if (!res.ok) return false;

      const data = await res.json();
      setAccessToken(data.access_token);

      const meRes = await fetch("/api/admin/auth/me", {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });
      if (!meRes.ok) return false;

      const meData = await meRes.json();
      setUser(meData);
      return true;
    } catch {
      return false;
    }
  }, []);

    return (
    <AuthContext.Provider
      value={{ accessToken, user, isLoading, login, logout, restoreSession }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth doit être utilisé dans un AuthProvider");
  }
  return ctx;
}