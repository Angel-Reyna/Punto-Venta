import { useState } from "react";

import { PageHeader } from "../../components/PageHeader";
import { StatusFeedback } from "../../components/StatusFeedback";
import { useAuth } from "../../auth/AuthContext";
import { PERMISSIONS } from "../../auth/permissions";
import {
  getInventoryFormDisabledReason,
  initialInventoryMovementForm,
  isInventoryFormInvalid,
} from "./inventoryShared";
import type { InventoryView } from "./inventoryShared";
import { InventoryAdjustmentForm } from "./InventoryAdjustmentForm";
import { InventoryControlHero } from "./InventoryControlHero";
import { InventoryMovementsSection } from "./InventoryMovementsSection";
import { InventoryStockSection } from "./InventoryStockSection";
import { useInventoryData } from "./useInventoryData";

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
  const [form, setForm] = useState(initialInventoryMovementForm);

  async function submit(type: "in" | "out") {
    const success = await submitInventoryMovement(type, form);

    if (!success) {
      return;
    }

    setForm(initialInventoryMovementForm);
    setActiveView("stock");
  }

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
        <InventoryStockSection
          rows={stockRows}
          searchQuery={stockSearch}
          onSearchChange={setStockSearch}
        />
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
        <InventoryMovementsSection
          movements={movements}
          searchQuery={movementSearch}
          onSearchChange={setMovementSearch}
        />
      )}
    </>
  );
}
