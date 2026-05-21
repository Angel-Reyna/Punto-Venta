import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken
} from "../auth/tokenStore";
import type { Permission, Role } from "../auth/permissions";

const API_URL = import.meta.env.VITE_API_URL;

const CSRF_COOKIE_NAME = "csrfToken";
const CSRF_HEADER_NAME = "X-CSRF-Token";

type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  permissions: Permission[];
};

export type AuthSessionResponse = {
  accessToken: string;
  user: User;
  csrfToken: string;
};

type CsrfTokenResponse = {
  csrfToken: string;
};

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

let refreshSessionPromise: Promise<AuthSessionResponse> | null = null;
let authExpiredNotified = false;
let authSessionVersion = 0;

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json"
  },
  withCredentials: true
});

function getCookieValue(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const cookiePrefix = `${name}=`;
  const cookie = document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(cookiePrefix));

  if (!cookie) {
    return null;
  }

  return decodeURIComponent(cookie.slice(cookiePrefix.length));
}

function getCsrfTokenFromCookie(): string | null {
  return getCookieValue(CSRF_COOKIE_NAME);
}

function isUnsafeHttpMethod(method?: string) {
  return !["get", "head", "options"].includes((method ?? "get").toLowerCase());
}

function isAuthRoute(url: string) {
  return (
    url.includes("/auth/login") ||
    url.includes("/auth/logout") ||
    url.includes("/auth/refresh")
  );
}

function setAuthorizationHeader(config: RetriableRequestConfig, token: string) {
  config.headers.Authorization = `Bearer ${token}`;
}

function setCsrfHeader(config: RetriableRequestConfig, token: string) {
  config.headers[CSRF_HEADER_NAME] = token;
}

function notifyAuthExpiredOnce() {
  if (authExpiredNotified) {
    return;
  }

  authExpiredNotified = true;

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("pos:auth-expired"));
  }
}

function markAuthSessionActive() {
  authExpiredNotified = false;
}

export function setClientAuthSession(accessToken: string) {
  authSessionVersion += 1;
  setAccessToken(accessToken);
  markAuthSessionActive();
}

export function clearClientAuthState() {
  authSessionVersion += 1;
  clearAccessToken();
  refreshSessionPromise = null;
}

export async function ensureCsrfToken() {
  const existingToken = getCsrfTokenFromCookie();

  if (existingToken) {
    return existingToken;
  }

  const response = await api.get<CsrfTokenResponse>("/auth/csrf-token");

  return response.data.csrfToken;
}

export function refreshSession() {
  if (!refreshSessionPromise) {
    const requestVersion = authSessionVersion;

    refreshSessionPromise = ensureCsrfToken()
      .then((csrfToken) =>
        api.post<AuthSessionResponse>("/auth/refresh", undefined, {
          headers: {
            [CSRF_HEADER_NAME]: csrfToken
          }
        })
      )
      .then((response) => {
        if (requestVersion !== authSessionVersion) {
          throw new Error("La sesión cambió durante la renovación.");
        }

        setAccessToken(response.data.accessToken);
        markAuthSessionActive();

        return response.data;
      })
      .finally(() => {
        refreshSessionPromise = null;
      });
  }

  return refreshSessionPromise;
}

api.interceptors.request.use((config) => {
  const accessToken = getAccessToken();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  if (isUnsafeHttpMethod(config.method)) {
    const csrfToken = getCsrfTokenFromCookie();

    if (csrfToken) {
      setCsrfHeader(config, csrfToken);
    }
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;
    const status = error.response?.status;
    const url = originalRequest?.url ?? "";

    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthRoute(url)
    ) {
      originalRequest._retry = true;

      try {
        const session = await refreshSession();

        setAuthorizationHeader(originalRequest, session.accessToken);

        return api(originalRequest);
      } catch (refreshError) {
        clearClientAuthState();
        notifyAuthExpiredOnce();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
