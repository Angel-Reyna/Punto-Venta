import { useMemo, useState } from "react";

import { Box, Chip, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import { SearchToolbar } from "../../components/SearchToolbar";
import type { Movement } from "./inventoryShared";
import { InventoryMovementTimeline } from "./InventoryMovementTimeline";

type MovementFilter = "all" | Movement["type"];

const MOVEMENT_FILTERS: Array<{ label: string; value: MovementFilter }> = [
  { label: "Todos", value: "all" },
  { label: "Entradas", value: "IN" },
  { label: "Salidas", value: "OUT" },
  { label: "Ventas", value: "SALE" },
  { label: "Devoluciones", value: "RETURN" },
];

export function InventoryMovementsSection({
  movements,
  searchQuery,
  onSearchChange,
}: {
  movements: Movement[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
}) {
  const [movementFilter, setMovementFilter] = useState<MovementFilter>("all");
  const filteredMovements = useMemo(
    () =>
      movementFilter === "all"
        ? movements
        : movements.filter((movement) => movement.type === movementFilter),
    [movements, movementFilter],
  );

  return (
    <>
      <SearchToolbar
        label="Buscar movimientos"
        placeholder="Ej. entrada, salida, venta, producto, almacén o motivo"
        query={searchQuery}
        onQueryChange={onSearchChange}
        resultCount={filteredMovements.length}
        helperText="Filtra movimientos recientes por producto, clave interna/SKU, código, almacén, tipo o motivo."
      />

      <Box
        sx={(theme) => ({
          border: 1,
          borderColor: alpha(theme.palette.primary.main, 0.14),
          borderRadius: 3,
          bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.045 : 0.025),
          mb: 2,
          px: { xs: 1.5, sm: 2 },
          py: 1.25,
        })}
      >
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
          <Typography color="text.secondary" fontWeight={900} variant="body2">
            Filtrar historial:
          </Typography>
          {MOVEMENT_FILTERS.map((option) => (
            <Chip
              key={option.value}
              clickable
              color={movementFilter === option.value ? "primary" : "default"}
              label={option.label}
              variant={movementFilter === option.value ? "filled" : "outlined"}
              onClick={() => setMovementFilter(option.value)}
              sx={{ fontWeight: 900 }}
            />
          ))}
        </Stack>
      </Box>

      <InventoryMovementTimeline movements={filteredMovements} searchQuery={searchQuery} />
    </>
  );
}
