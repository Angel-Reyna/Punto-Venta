export const DEFAULT_LIST_PAGE_SIZE = 100;
export const DEFAULT_ADMIN_PAGE_SIZE = 50;

export type ListQueryParams = {
  page?: number;
  pageSize?: number;
  q?: string;
};

export function optionalSearchQuery(query: string) {
  const normalizedQuery = query.trim();

  return normalizedQuery || undefined;
}
