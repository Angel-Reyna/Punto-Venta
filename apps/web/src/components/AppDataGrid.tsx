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

export type AppDataGridProps<R extends GridValidRowModel = GridValidRowModel> = DataGridProps<R> & {
  noRowsLabel?: string;
  hideFooterWhenSinglePage?: boolean;
  singlePageThreshold?: number;
};

export function AppDataGrid<R extends GridValidRowModel = GridValidRowModel>({
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
      sx={[
        (theme) => ({
          border: 0,
          color: "text.primary",
          backgroundColor: "transparent",
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: "action.hover",
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12
          },
          "& .MuiDataGrid-columnHeaderTitle": {
            fontWeight: 850
          },
          "& .MuiDataGrid-cell": {
            borderColor: "divider"
          },
          "& .MuiDataGrid-row:hover": {
            backgroundColor: "action.hover"
          },
          "& .MuiDataGrid-footerContainer": {
            borderColor: "divider"
          },
          "& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus": {
            outline: "none"
          },
          "& .MuiDataGrid-cell:focus-within, & .MuiDataGrid-columnHeader:focus-within": {
            outline: `2px solid ${theme.palette.primary.main}`,
            outlineOffset: -2
          },
          [theme.breakpoints.down("sm")]: {
            fontSize: "0.8125rem",
            "& .MuiDataGrid-cell": {
              py: 0.75
            },
            "& .MuiDataGrid-columnHeaderTitle": {
              fontSize: "0.75rem"
            }
          }
        }),
        ...(Array.isArray(sx) ? sx : sx ? [sx] : [])
      ]}
    />
  );
}
