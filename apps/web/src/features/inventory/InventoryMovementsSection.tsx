import { SearchToolbar } from "../../components/SearchToolbar";
import type { Movement } from "./inventoryShared";
import { InventoryMovementTimeline } from "./InventoryMovementTimeline";

export function InventoryMovementsSection({
  movements,
  searchQuery,
  onSearchChange,
}: {
  movements: Movement[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
}) {
  return (
    <>
      <SearchToolbar
        label="Buscar movimientos"
        placeholder="Ej. entrada, salida, venta, producto, almacén o motivo"
        query={searchQuery}
        onQueryChange={onSearchChange}
        resultCount={movements.length}
        helperText="Filtra movimientos recientes por producto, clave interna/SKU, código, almacén, tipo o motivo."
      />

      <InventoryMovementTimeline movements={movements} searchQuery={searchQuery} />
    </>
  );
}
