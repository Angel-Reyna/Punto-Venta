import type { Response } from "express";

import { AppError } from "./AppError";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

export type Pagination = {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
};

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

function readPositiveInteger(
  value: unknown,
  fieldName: string,
  fallback: number
) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new AppError(400, `${fieldName} debe ser un entero positivo`);
  }

  return parsed;
}

export function getPagination(
  query: Record<string, unknown>,
  options?: {
    defaultPageSize?: number;
    maxPageSize?: number;
  }
): Pagination {
  const maxPageSize = options?.maxPageSize ?? MAX_PAGE_SIZE;
  const defaultPageSize = Math.min(
    options?.defaultPageSize ?? DEFAULT_PAGE_SIZE,
    maxPageSize
  );

  const page = readPositiveInteger(query.page, "page", DEFAULT_PAGE);
  const requestedPageSize = readPositiveInteger(
    query.pageSize,
    "pageSize",
    defaultPageSize
  );

  const pageSize = Math.min(requestedPageSize, maxPageSize);

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize
  };
}

export function buildPaginationMeta(
  pagination: Pagination,
  total: number
): PaginationMeta {
  return {
    page: pagination.page,
    pageSize: pagination.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pagination.pageSize))
  };
}

export function setPaginationHeaders(
  res: Response,
  meta: PaginationMeta
) {
  res.setHeader("X-Total-Count", String(meta.total));
  res.setHeader("X-Page", String(meta.page));
  res.setHeader("X-Page-Size", String(meta.pageSize));
  res.setHeader("X-Total-Pages", String(meta.totalPages));
}

export function getDateRange(query: Record<string, unknown>) {
  const dateFrom = parseDateQuery(query.dateFrom, "dateFrom");
  const dateTo = parseDateQuery(query.dateTo, "dateTo");

  if (dateFrom && dateTo && dateFrom > dateTo) {
    throw new AppError(400, "dateFrom no puede ser mayor que dateTo");
  }

  return {
    dateFrom,
    dateTo
  };
}

function parseDateQuery(value: unknown, fieldName: string) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (Array.isArray(value)) {
    throw new AppError(400, `${fieldName} debe ser una fecha válida`);
  }

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    throw new AppError(400, `${fieldName} debe ser una fecha válida`);
  }

  return date;
}

export function getOptionalString(
  value: unknown,
  maxLength = 120
) {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (Array.isArray(value)) {
    throw new AppError(400, "Parámetro inválido");
  }

  const text = String(value).trim();

  if (!text) {
    return undefined;
  }

  if (text.length > maxLength) {
    throw new AppError(400, `El parámetro no debe superar ${maxLength} caracteres`);
  }

  return text;
}

export function getOptionalBoolean(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (value === true || value === "true") {
    return true;
  }

  if (value === false || value === "false") {
    return false;
  }

  throw new AppError(400, "El parámetro booleano debe ser true o false");
}
