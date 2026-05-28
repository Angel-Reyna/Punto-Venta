import { useState } from "react";

import { PageHeader } from "../../components/PageHeader";
import { SearchToolbar } from "../../components/SearchToolbar";
import { StatusFeedback } from "../../components/StatusFeedback";
import { useAuth } from "../../auth/AuthContext";
import { PERMISSIONS } from "../../auth/permissions";
import {
  InventoryControlHero,
  filterStockRowsByStatus,
  getInventoryFormDisabledReason,
  initialInventoryMovementForm,
  InventoryStatusFilterBar,
  InventoryMovementTimeline,
  InventoryStockOverview,
  InventorySummaryCards,
  isInventoryFormInvalid,
} from "./inventoryShared";
import { InventoryAdjustmentForm } from "./InventoryAdjustmentForm";
import type { StockStatusFilter } from "./inventoryShared";
import { useInventoryData } from "./useInventoryData";

type InventoryView = "stock" | "adjustments" | "movements";

export function InventoryPage() {
  const { can } = useAuth();
  const canAdjustInventory = can(PERMISSIONS.InventoryAdjust);

  const {
    error,
    message,
    movementSearch,
    movements,
    products,
    setError,
    setMessage,
    setMovementSearch,
    setStockSearch,
    stockRows,
    stockSearch,
    submitInventoryMovement,
    warehouses,
  } = useInventoryData();

  const [activeView, setActiveView] = useState<InventoryView>("stock");
  const [stockStatusFilter, setStockStatusFilter] =
    useState<StockStatusFilter>("all");
  const [form, setForm] = useState(initialInventoryMovementForm);

  async function submit(type: "in" | "out") {
    const success = await submitInventoryMovement(type, form);

    if (!success) {
      return;
    }

    setForm(initialInventoryMovementForm);
    setActiveView("stock");
  }

  const filteredStockRows = filterStockRowsByStatus(
    stockRows,
    stockStatusFilter,
  );

  const inventoryFormDisabledReason = getInventoryFormDisabledReason(form);
  const formIsInvalid = isInventoryFormInvalid(form);

  return (
    <>
      <PageHeader
        title="Inventario"
        subtitle={
          canAdjustInventory
            ? "Consulta stock, divide productos por estado y registra entradas o salidas manuales con trazabilidad."
            : "Consulta stock disponible, alertas de reposición y movimientos. Los ajustes manuales requieren permiso administrativo."
        }
      />

      <StatusFeedback
        success={message}
        error={error}
        onSuccessClose={() => setMessage("")}
        onErrorClose={() => setError("")}
      />

      <InventoryControlHero
        activeView={activeView}
        canAdjustInventory={canAdjustInventory}
        movementsCount={movements.length}
        onViewChange={setActiveView}
        stockRows={stockRows}
      />

      {activeView === "stock" && (
        <>
          <SearchToolbar
            label="Buscar existencias"
            placeholder="Ej. COCA-600, refresco, 750..., bebidas"
            query={stockSearch}
            onQueryChange={setStockSearch}
            resultCount={filteredStockRows.length}
            helperText="Busca productos por nombre, clave interna/SKU, código o categoría para revisar su stock real."
          />

          <InventorySummaryCards rows={stockRows} />

          <InventoryStatusFilterBar
            rows={stockRows}
            value={stockStatusFilter}
            onChange={setStockStatusFilter}
          />

          <InventoryStockOverview
            rows={filteredStockRows}
            searchQuery={stockSearch}
            statusFilter={stockStatusFilter}
          />
        </>
      )}

      {activeView === "adjustments" && (
        <InventoryAdjustmentForm
          canAdjustInventory={canAdjustInventory}
          disabledReason={inventoryFormDisabledReason}
          form={form}
          isInvalid={formIsInvalid}
          onChange={setForm}
          onSubmit={submit}
          products={products}
          warehouses={warehouses}
        />
      )}

      {activeView === "movements" && (
        <>
          <SearchToolbar
            label="Buscar movimientos"
            placeholder="Ej. entrada, salida, venta, producto, almacén o motivo"
            query={movementSearch}
            onQueryChange={setMovementSearch}
            resultCount={movements.length}
            helperText="Filtra movimientos recientes por producto, clave interna/SKU, código, almacén, tipo o motivo."
          />

          <InventoryMovementTimeline
            movements={movements}
            searchQuery={movementSearch}
          />
        </>
      )}
    </>
  );
}
