import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL;

export const api = axios.create({
  baseURL: API_URL,

  headers: {
    "Content-Type": "application/json"
  },

  withCredentials: true
});

api.interceptors.request.use(
  (config) => {
    const accessToken =
      localStorage.getItem("pos_access_token");

    if (accessToken) {
      config.headers.Authorization =
        `Bearer ${accessToken}`;
    }

    return config;
  }
);

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (
      error?.response?.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const response = await api.post(
          "/auth/refresh"
        );

        const newAccessToken =
          response.data.accessToken;

        localStorage.setItem(
          "pos_access_token",
          newAccessToken
        );

        originalRequest.headers.Authorization =
          `Bearer ${newAccessToken}`;

        return api(originalRequest);
      } catch {
        localStorage.removeItem(
          "pos_access_token"
        );

        localStorage.removeItem("pos_user");

        if (
          window.location.pathname !==
          "/login"
        ) {
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  }
);