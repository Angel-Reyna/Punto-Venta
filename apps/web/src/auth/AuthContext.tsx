import {
  createContext,
  ReactNode,
  useContext,
  useMemo,
  useState
} from "react";

import { api } from "../api/client";

type User = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "CASHIER";
};

type LoginResponse = {
  accessToken: string;
  user: User;
};

type AuthContextValue = {
  user: User | null;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextValue>({} as AuthContextValue);

const ACCESS_KEY = "pos_access_token";
const USER_KEY = "pos_user";

function getStoredUser(): User | null {
  const storedUser = localStorage.getItem(USER_KEY);

  if (!storedUser) return null;

  try {
    return JSON.parse(storedUser) as User;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(() =>
    localStorage.getItem(ACCESS_KEY)
  );

  const [user, setUser] = useState<User | null>(() => getStoredUser());

  async function login(email: string, password: string) {
    const response = await api.post<LoginResponse>("/auth/login", {
      email,
      password
    });

    const data = response.data;

    localStorage.setItem(ACCESS_KEY, data.accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));

    setAccessToken(data.accessToken);
    setUser(data.user);
  }

  async function logout() {
    try {
      await api.post("/auth/logout");
    } catch {
      // No bloquear logout local si el backend no responde.
    }

    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(USER_KEY);

    setAccessToken(null);
    setUser(null);

    window.location.href = "/login";
  }

  const value = useMemo(
    () => ({
      user,
      accessToken,
      login,
      logout,
      isAdmin: user?.role === "ADMIN",
      isAuthenticated: Boolean(accessToken && user)
    }),
    [user, accessToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}