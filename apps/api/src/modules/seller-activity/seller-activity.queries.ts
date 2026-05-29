import { AppError } from "../../utils/AppError";
import { getPagination } from "../../utils/pagination";
import { sellerActivityQuerySchema } from "./seller-activity.shared";

export function parseSellerActivityRequest(query: Record<string, unknown>) {
  const parsed = sellerActivityQuerySchema.safeParse(query);

  if (!parsed.success) {
    throw new AppError(400, "Filtros inválidos");
  }

  const pagination = getPagination(
    {
      ...query,
      ...(parsed.data.limit ? { pageSize: parsed.data.limit } : {})
    },
    {
      defaultPageSize: 50,
      maxPageSize: 100
    }
  );

  return {
    query: parsed.data,
    pagination
  };
}
