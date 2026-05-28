import { api } from "../../api/client";
import {
  buildQuery,
  type Seller,
  type SellerActivityFilters,
  type SellerActivityLog,
  type SummaryItem,
} from "./sellerActivityShared";

export async function fetchSellerUsers() {
  const response = await api.get<Seller[]>("/users");

  return response.data.filter((user) => user.role === "CASHIER");
}

export async function fetchSellerActivity(filters: SellerActivityFilters) {
  const query = buildQuery(filters);

  const [activityResponse, summaryResponse] = await Promise.all([
    api.get<SellerActivityLog[]>(`/seller-activity?${query}`),
    api.get<SummaryItem[]>(`/seller-activity/summary?${query}`),
  ]);

  return {
    rows: activityResponse.data,
    summary: summaryResponse.data,
  };
}
