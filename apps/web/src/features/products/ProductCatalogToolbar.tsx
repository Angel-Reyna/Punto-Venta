import { Box, Card, CardContent, Chip, Stack, Typography } from "@mui/material";

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
    <Card sx={{ mb: 2.5 }}>
      <CardContent>
        <Stack spacing={2}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1.5}
            alignItems={{ xs: "flex-start", md: "center" }}
            justifyContent="space-between"
          >
            <Box>
              <Typography variant="h6" fontWeight={900}>
                Control del catálogo
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Busca, importa o descarga el formato sin perder contexto del
                inventario visible.
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              <Chip
                size="small"
                color={normalizedSearchQuery ? "primary" : "default"}
                variant={normalizedSearchQuery ? "filled" : "outlined"}
                label={
                  normalizedSearchQuery
                    ? `Búsqueda: ${normalizedSearchQuery}`
                    : "Sin búsqueda activa"
                }
              />
              {canImportProducts && (
                <Chip
                  size="small"
                  color={isImportingExcel ? "warning" : "default"}
                  variant="outlined"
                  label={isImportingExcel ? "Importando Excel" : "Excel disponible"}
                />
              )}
            </Stack>
          </Stack>

          <SearchToolbar
            label="Buscar productos"
            placeholder="Ej. COCA-600, refresco, 750..., bebidas"
            query={searchQuery}
            onQueryChange={onSearchQueryChange}
            resultCount={resultCount}
            helperText={productSearchHelper}
          />

          {canImportProducts && (
            <ProductImportActions
              isDownloadingTemplate={isDownloadingTemplate}
              isImportingExcel={isImportingExcel}
              onDownloadTemplate={onDownloadTemplate}
              onImportExcel={onImportExcel}
            />
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
