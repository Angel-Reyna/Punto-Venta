import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

import { api } from "../api/client";
import {
  clearAccessToken,
  setAccessToken
} from "./tokenStore";

type User = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "CASHIER";
};

type AuthResponse = {
  accessToken: string;
  user: User;
};

type AuthStatus = "loading" | "authenticated" | "guest";

type AuthContextValue = {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
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
        const response = await api.post<AuthResponse>("/auth/refresh");

        if (!isMounted) return;

        setAccessToken(response.data.accessToken);
        setUser(response.data.user);
        setStatus("authenticated");
      } catch {
        if (!isMounted) return;

        clearAccessToken();
        setUser(null);
        setStatus("guest");
      }
    }

    function handleAuthExpired() {
      clearAccessToken();
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

    setAccessToken(response.data.accessToken);
    setUser(response.data.user);
    setStatus("authenticated");
  }

  async function logout() {
    try {
      await api.post("/auth/logout");
    } catch {
      // El logout local no debe depender de la disponibilidad del backend.
    }

    clearAccessToken();
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
