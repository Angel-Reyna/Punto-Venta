import { Box, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import BuildCircleIcon from "@mui/icons-material/BuildCircle";
import SearchIcon from "@mui/icons-material/Search";

import { SearchToolbar } from "../../components/SearchToolbar";
import { ProductImportActions } from "./ProductImportActions";

type ProductCatalogToolbarProps = {
  canImportProducts: boolean;
  isDownloadingTemplate: boolean;
  isImportingExcel: boolean;
  onDownloadTemplate: () => void;
  onImportExcel: (file: File | undefined) => void | Promise<void>;
  onSearchQueryChange: (query: string) => void;
  productSearchHelper: string;
  resultCount: number;
  searchQuery: string;
};

export function ProductCatalogToolbar({
  canImportProducts,
  isDownloadingTemplate,
  isImportingExcel,
  onDownloadTemplate,
  onImportExcel,
  onSearchQueryChange,
  productSearchHelper,
  resultCount,
  searchQuery,
}: ProductCatalogToolbarProps) {
  const normalizedSearchQuery = searchQuery.trim();

  return (
    <Card
      sx={(theme) => ({
        mb: 2.5,
        border: 1,
        borderColor: alpha(theme.palette.primary.main, 0.14),
      })}
    >
      <CardContent sx={{ p: { xs: 1.75, sm: 2.25, lg: 2.5 } }}>
        <Box
          sx={{
            display: "grid",
            gap: { xs: 2, lg: 2.5 },
            gridTemplateColumns: { xs: "1fr", lg: canImportProducts ? "minmax(0, 1fr) 320px" : "1fr" },
            alignItems: "stretch",
          }}
        >
          <Stack spacing={1.5}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.25}
              alignItems={{ xs: "flex-start", sm: "center" }}
              justifyContent="space-between"
            >
              <Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <SearchIcon color="primary" fontSize="small" />
                  <Typography variant="h6" fontWeight={950}>
                    Encuentra un producto
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Busca por nombre, SKU, código o categoría. En móvil la búsqueda manda; en PC puedes revisar más detalle.
                </Typography>
              </Box>

              <Chip
                size="small"
                color={normalizedSearchQuery ? "primary" : "default"}
                variant={normalizedSearchQuery ? "filled" : "outlined"}
                label={
                  normalizedSearchQuery
                    ? `Filtro: ${normalizedSearchQuery}`
                    : "Sin filtro de búsqueda"
                }
              />
            </Stack>

            <SearchToolbar
              label="Buscar productos"
              placeholder="Ej. COCA-600, refresco, 750..., bebidas"
              query={searchQuery}
              onQueryChange={onSearchQueryChange}
              resultCount={resultCount}
              helperText={productSearchHelper}
            />
          </Stack>

          {canImportProducts && (
            <Box
              sx={(theme) => ({
                p: { xs: 1.5, sm: 1.75 },
                border: 1,
                borderColor: alpha(theme.palette.info.main, 0.22),
                borderRadius: 3,
                bgcolor: alpha(theme.palette.info.main, 0.06),
              })}
            >
              <Stack spacing={1.25}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <BuildCircleIcon color="info" fontSize="small" />
                  <Box>
                    <Typography fontWeight={900}>Herramientas de Excel</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Para altas o actualizaciones masivas del catálogo.
                    </Typography>
                  </Box>
                </Stack>

                <ProductImportActions
                  isDownloadingTemplate={isDownloadingTemplate}
                  isImportingExcel={isImportingExcel}
                  onDownloadTemplate={onDownloadTemplate}
                  onImportExcel={onImportExcel}
                />

                <Chip
                  size="small"
                  color={isImportingExcel ? "warning" : "default"}
                  variant="outlined"
                  label={isImportingExcel ? "Importando Excel" : "Opcional para admin"}
                  sx={{ alignSelf: "flex-start" }}
                />
              </Stack>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
