import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken
} from "../auth/tokenStore";

const API_URL = import.meta.env.VITE_API_URL;

type User = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "CASHIER";
};

export type AuthSessionResponse = {
  accessToken: string;
  user: User;
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

export function refreshSession() {
  if (!refreshSessionPromise) {
    const requestVersion = authSessionVersion;

    refreshSessionPromise = api
      .post<AuthSessionResponse>("/auth/refresh")
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
