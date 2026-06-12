import { useEffect, useMemo, useState } from "react";

import { Box, Chip, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import { SearchToolbar } from "../../components/SearchToolbar";
import type { Movement } from "./inventoryShared";
import { isInventoryShrinkageReason } from "./inventoryShared";
import { InventoryMovementTimeline } from "./InventoryMovementTimeline";

type MovementFilter = "all" | "shrinkage" | Movement["type"];

const MOVEMENT_FILTERS: Array<{ label: string; value: MovementFilter }> = [
  { label: "Todos", value: "all" },
  { label: "Entradas", value: "IN" },
  { label: "Salidas", value: "OUT" },
  { label: "Merma", value: "shrinkage" },
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

  useEffect(() => {
    if (isShrinkageSearchQuery(searchQuery)) {
      setMovementFilter("shrinkage");
    }
  }, [searchQuery]);

  const filteredMovements = useMemo(
    () =>
      movementFilter === "all"
        ? movements
        : movementFilter === "shrinkage"
          ? movements.filter((movement) => movement.type === "OUT" && isInventoryShrinkageReason(movement.reasonType))
          : movements.filter((movement) => movement.type === movementFilter),
    [movements, movementFilter],
  );

  return (
    <>
      <SearchToolbar
        label="Buscar movimientos"
        placeholder="Ej. entrada, salida, merma, venta, producto, almacén o motivo"
        query={searchQuery}
        onQueryChange={onSearchChange}
        resultCount={filteredMovements.length}
        helperText="Filtra movimientos recientes por producto, clave interna/SKU, código, almacén, tipo, motivo o merma."
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
              data-selected={movementFilter === option.value ? "true" : "false"}
              data-testid={`inventory-movement-filter-${option.value}`}
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

function isShrinkageSearchQuery(query: string) {
  const normalized = query
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return ["merma", "caducidad", "danos", "danios", "damage"].includes(normalized);
}
