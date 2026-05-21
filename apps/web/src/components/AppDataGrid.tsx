import {
  DataGrid,
  type DataGridProps,
  type GridLocaleText,
  type GridValidRowModel
} from "@mui/x-data-grid";
import { esES } from "@mui/x-data-grid/locales";

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const baseLocaleText = esES.components.MuiDataGrid.defaultProps.localeText;

const appLocaleText: Partial<GridLocaleText> = {
  ...baseLocaleText,
  noRowsLabel: "Sin registros para mostrar",
  noResultsOverlayLabel: "No se encontraron resultados.",
  MuiTablePagination: {
    ...baseLocaleText.MuiTablePagination,
    labelRowsPerPage: "Filas por página:",
    labelDisplayedRows: ({ from, to, count }) =>
      count === -1 ? `${from}-${to} de más de ${to}` : `${from}-${to} de ${count}`
  }
};

function getFirstPageSize(pageSizeOptions: DataGridProps["pageSizeOptions"]) {
  const firstOption = pageSizeOptions?.[0];

  if (typeof firstOption === "number") return firstOption;

  if (
    firstOption &&
    typeof firstOption === "object" &&
    "value" in firstOption
  ) {
    return Number(firstOption.value);
  }

  return DEFAULT_PAGE_SIZE_OPTIONS[0];
}

export type AppDataGridProps<R extends GridValidRowModel = any> = DataGridProps<R> & {
  noRowsLabel?: string;
  hideFooterWhenSinglePage?: boolean;
  singlePageThreshold?: number;
};

export function AppDataGrid<R extends GridValidRowModel = any>({
  rows,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  disableRowSelectionOnClick = true,
  autoHeight = true,
  density = "standard",
  hideFooter,
  hideFooterWhenSinglePage = true,
  singlePageThreshold,
  noRowsLabel,
  localeText,
  sx,
  ...props
}: AppDataGridProps<R>) {
  const safeRows = rows ?? [];
  const defaultPageSize = singlePageThreshold ?? getFirstPageSize(pageSizeOptions);
  const resolvedHideFooter =
    hideFooter ?? (hideFooterWhenSinglePage && safeRows.length <= defaultPageSize);

  return (
    <DataGrid
      {...props}
      autoHeight={autoHeight}
      density={density}
      rows={safeRows}
      pageSizeOptions={pageSizeOptions}
      disableRowSelectionOnClick={disableRowSelectionOnClick}
      hideFooter={resolvedHideFooter}
      localeText={{
        ...appLocaleText,
        ...(noRowsLabel ? { noRowsLabel } : {}),
        ...localeText
      }}
      sx={{
        border: 0,
        "& .MuiDataGrid-columnHeaders": {
          backgroundColor: "action.hover"
        },
        "& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus": {
          outline: "none"
        },
        "& .MuiDataGrid-cell:focus-within, & .MuiDataGrid-columnHeader:focus-within": {
          outline: "2px solid rgba(37, 99, 235, 0.55)",
          outlineOffset: -2
        },
        ...sx
      }}
    />
  );
}
