import { getJson } from "../../api/http";
import {
  buildQuery,
  type Seller,
  type SellerActivityFilters,
  type SellerActivityLog,
  type SummaryItem,
} from "./sellerActivityShared";

export async function fetchSellerUsers() {
  const users = await getJson<Seller[]>("/users");

  return users.filter((user) => user.role === "CASHIER");
}

export async function fetchSellerActivity(filters: SellerActivityFilters) {
  const query = buildQuery(filters);

  const [rows, summary] = await Promise.all([
    getJson<SellerActivityLog[]>(`/seller-activity?${query}`),
    getJson<SummaryItem[]>(`/seller-activity/summary?${query}`),
  ]);

  return {
    rows,
    summary,
  };
}
