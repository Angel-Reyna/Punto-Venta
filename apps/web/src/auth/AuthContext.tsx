import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

import {
  api,
  clearClientAuthState,
  ensureCsrfToken,
  refreshSession,
  setClientAuthSession
} from "../api/client";
import {
  hasPermission,
  type Permission,
  type Role
} from "./permissions";

type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

type AuthResponse = {
  accessToken: string;
  user: User;
  csrfToken: string;
};

type AuthStatus = "loading" | "authenticated" | "guest";

type AuthContextValue = {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  can: (permission: Permission) => boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextValue>({} as AuthContextValue);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function bootstrapSession() {
      try {
        const session = await refreshSession();

        if (!isMounted) return;

        setUser(session.user);
        setStatus("authenticated");
      } catch {
        if (!isMounted) return;

        clearClientAuthState();
        setUser(null);
        setStatus("guest");
      }
    }

    function handleAuthExpired() {
      clearClientAuthState();
      setUser(null);
      setStatus("guest");
    }

    window.addEventListener("pos:auth-expired", handleAuthExpired);
    bootstrapSession();

    return () => {
      isMounted = false;
      window.removeEventListener("pos:auth-expired", handleAuthExpired);
    };
  }, []);

  async function login(email: string, password: string) {
    const response = await api.post<AuthResponse>("/auth/login", {
      email: email.trim().toLowerCase(),
      password
    });

    setClientAuthSession(response.data.accessToken);
    setUser(response.data.user);
    setStatus("authenticated");
  }

  async function logout() {
    try {
      const csrfToken = await ensureCsrfToken();

      await api.post("/auth/logout", undefined, {
        headers: {
          "X-CSRF-Token": csrfToken
        }
      });
    } catch {
      // El logout local no debe depender de la disponibilidad del backend.
    }

    clearClientAuthState();
    setUser(null);
    setStatus("guest");

    window.location.href = "/login";
  }

  const value = useMemo(
    () => ({
      user,
      login,
      logout,
      isAdmin: user?.role === "ADMIN",
      can: (permission: Permission) => hasPermission(user?.role, permission),
      isAuthenticated: status === "authenticated" && Boolean(user),
      isLoading: status === "loading"
    }),
    [user, status]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
