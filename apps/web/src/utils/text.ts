const DIACRITIC_MARKS_PATTERN = /[\u0300-\u036f]/g;

export type SearchableValue = string | number | null | undefined;

export function normalizeSearchText(value: SearchableValue) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(DIACRITIC_MARKS_PATTERN, "")
    .trim()
    .toLowerCase();
}

export function valuesIncludeSearchText(values: SearchableValue[], query: string) {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return true;
  }

  return values.some((value) =>
    normalizeSearchText(value).includes(normalizedQuery)
  );
}
