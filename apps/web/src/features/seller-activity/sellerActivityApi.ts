import { getJson } from "../../api/http";
import {
  buildQuery,
  type Seller,
  type SellerActivityFilters,
  type SellerActivityLog,
  type SellerActivityBySeller,
  type SummaryItem,
} from "./sellerActivityShared";

export async function fetchSellerUsers() {
  const users = await getJson<Seller[]>("/users");

  return users.filter((user) => user.role === "CASHIER");
}

export async function fetchSellerActivity(filters: SellerActivityFilters) {
  const query = buildQuery(filters);

  const [rows, summary, bySeller] = await Promise.all([
    getJson<SellerActivityLog[]>(`/seller-activity?${query}`),
    getJson<SummaryItem[]>(`/seller-activity/summary?${query}`),
    getJson<SellerActivityBySeller[]>(`/seller-activity/by-seller?${query}`),
  ]);

  return {
    bySeller,
    rows,
    summary,
  };
}
