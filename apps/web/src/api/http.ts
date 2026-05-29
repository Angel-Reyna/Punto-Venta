import type { AxiosRequestConfig } from "axios";

import { api } from "./client";

export type ApiPrimitiveParam = string | number | boolean | null | undefined;
export type ApiQueryParams = Record<string, ApiPrimitiveParam>;

export type ApiRequestConfig = Omit<AxiosRequestConfig, "params"> & {
  params?: ApiQueryParams;
};

function normalizeParams(params?: ApiQueryParams) {
  if (!params) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null),
  );
}

function withNormalizedParams(config: ApiRequestConfig = {}): AxiosRequestConfig {
  return {
    ...config,
    params: normalizeParams(config.params),
  };
}

export async function getJson<TResponse>(
  url: string,
  config?: ApiRequestConfig,
): Promise<TResponse> {
  const response = await api.get<TResponse>(url, withNormalizedParams(config));

  return response.data;
}

export async function postJson<TResponse = void, TPayload = unknown>(
  url: string,
  payload?: TPayload,
  config?: ApiRequestConfig,
): Promise<TResponse> {
  const response = await api.post<TResponse>(url, payload, withNormalizedParams(config));

  return response.data;
}

export async function patchJson<TResponse = void, TPayload = unknown>(
  url: string,
  payload?: TPayload,
  config?: ApiRequestConfig,
): Promise<TResponse> {
  const response = await api.patch<TResponse>(url, payload, withNormalizedParams(config));

  return response.data;
}

export async function deleteJson<TResponse = void>(
  url: string,
  config?: ApiRequestConfig,
): Promise<TResponse> {
  const response = await api.delete<TResponse>(url, withNormalizedParams(config));

  return response.data;
}

export async function getBlob(url: string, config?: ApiRequestConfig): Promise<Blob> {
  const response = await api.get<Blob>(url, {
    ...withNormalizedParams(config),
    responseType: "blob",
  });

  return response.data;
}

export async function postFormData<TResponse>(
  url: string,
  formData: FormData,
  config?: ApiRequestConfig,
): Promise<TResponse> {
  const response = await api.post<TResponse>(url, formData, {
    ...withNormalizedParams(config),
    headers: {
      ...config?.headers,
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
}
