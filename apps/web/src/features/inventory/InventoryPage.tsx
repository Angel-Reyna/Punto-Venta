import { useState } from "react";

import { PageHeader } from "../../components/PageHeader";
import { StatusFeedback } from "../../components/StatusFeedback";
import { useAuth } from "../../auth/AuthContext";
import { PERMISSIONS } from "../../auth/permissions";
import {
  DEFAULT_INVENTORY_ENTRY_REASON,
  getInventoryFormDisabledReason,
  getWarehouseStockForProduct,
  initialInventoryMovementForm,
  isInventoryFormInvalid,
} from "./inventoryShared";
import type { InventoryView } from "./inventoryShared";
import { InventoryAdjustmentForm } from "./InventoryAdjustmentForm";
import { InventoryControlHero } from "./InventoryControlHero";
import { InventoryMovementsSection } from "./InventoryMovementsSection";
import { InventoryStockSection } from "./InventoryStockSection";
import { InventoryTransferRequestsPanel } from "./InventoryTransferRequestsPanel";
import { useInventoryData } from "./useInventoryData";

export function InventoryPage() {
  const { can } = useAuth();
  const canAdjustInventory = can(PERMISSIONS.InventoryAdjust);
  const canReadTransferRequests = can(PERMISSIONS.InventoryTransferRequestRead);
  const canCreateTransferRequest = can(PERMISSIONS.InventoryTransferRequestCreate);
  const canReviewTransferRequest = can(PERMISSIONS.InventoryTransferRequestReview);

  const {
    error,
    isCreatingWarehouse,
    isSubmittingTransferRequest,
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
    createInventoryWarehouse,
    submitInventoryMovement,
    submitTransferRequest,
    approveTransferRequest,
    rejectTransferRequest,
    transferRequests,
    warehouses,
  } = useInventoryData();

  const [activeView, setActiveView] = useState<InventoryView>("stock");
  const [form, setForm] = useState(initialInventoryMovementForm);
  function changeView(view: InventoryView) {
    setActiveView(view);

    if (view === "entries") {
      setForm((current) => ({
        ...current,
        reasonType: "OTHER",
        reason:
          current.reasonType === "EXPIRATION" || !current.reason.trim()
            ? DEFAULT_INVENTORY_ENTRY_REASON
            : current.reason,
      }));
      return;
    }

    if (view === "exits") {
      setForm((current) => ({
        ...current,
        quantity: 0,
        reasonType: current.reasonType === "EXPIRATION" ? "EXPIRATION" : "OTHER",
        reason:
          current.reason.trim() === DEFAULT_INVENTORY_ENTRY_REASON
            ? ""
            : current.reason,
      }));
    }
  }

  async function submit(type: "in" | "out") {
    const movementForm =
      type === "in"
        ? {
            ...form,
            reasonType: "OTHER" as const,
          }
        : form;
    const success = await submitInventoryMovement(type, movementForm);

    if (!success) {
      return;
    }

    setForm(initialInventoryMovementForm);
    setActiveView("stock");
  }

  const normalizedForm =
    activeView === "entries"
      ? {
          ...form,
          reasonType: "OTHER" as const,
          reason: form.reason.trim() || DEFAULT_INVENTORY_ENTRY_REASON,
        }
      : form;
  const selectedProduct = products.find(
    (product) => product.id === normalizedForm.productId,
  );
  const selectedWarehouse =
    warehouses.find((warehouse) => warehouse.id === normalizedForm.warehouseId) ??
    warehouses[0];
  const selectedWarehouseStock = getWarehouseStockForProduct({
    stockRows,
    productId: normalizedForm.productId,
    warehouseId: normalizedForm.warehouseId,
    defaultWarehouseId: warehouses[0]?.id,
  });
  const stockDisabledReason =
    activeView === "exits" &&
    selectedProduct &&
    normalizedForm.quantity > selectedWarehouseStock
      ? `No puedes retirar más de ${selectedWarehouseStock} unidades disponibles. Almacén: ${selectedWarehouse?.name ?? "este almacén"}.`
      : "";
  const inventoryFormDisabledReason =
    stockDisabledReason || getInventoryFormDisabledReason(normalizedForm);
  const formIsInvalid =
    Boolean(stockDisabledReason) || isInventoryFormInvalid(normalizedForm);

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
        canManageTransferRequests={canReadTransferRequests}
        movements={movements}
        onViewChange={changeView}
        stockRows={stockRows}
      />

      {activeView === "stock" && (
        <>
          <InventoryStockSection
            rows={stockRows}
            searchQuery={stockSearch}
            onSearchChange={setStockSearch}
          />
        </>
      )}

      {activeView === "entries" && (
        <InventoryAdjustmentForm
          canAdjustInventory={canAdjustInventory}
          disabledReason={inventoryFormDisabledReason}
          form={normalizedForm}
          isCreatingWarehouse={isCreatingWarehouse}
          isInvalid={formIsInvalid}
          mode="in"
          onChange={setForm}
          onCreateWarehouse={createInventoryWarehouse}
          onSubmit={submit}
          products={products}
          stockRows={stockRows}
          warehouses={warehouses}
        />
      )}

      {activeView === "exits" && (
        <InventoryAdjustmentForm
          canAdjustInventory={canAdjustInventory}
          disabledReason={inventoryFormDisabledReason}
          form={form}
          isCreatingWarehouse={isCreatingWarehouse}
          isInvalid={formIsInvalid}
          mode="out"
          onChange={setForm}
          onCreateWarehouse={createInventoryWarehouse}
          onSubmit={submit}
          products={products}
          stockRows={stockRows}
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

      {activeView === "transfers" && canReadTransferRequests && (
        <InventoryTransferRequestsPanel
          canCreateTransferRequest={canCreateTransferRequest}
          canReviewTransferRequest={canReviewTransferRequest}
          isSubmitting={isSubmittingTransferRequest}
          onApprove={approveTransferRequest}
          onCreate={submitTransferRequest}
          onReject={rejectTransferRequest}
          products={products}
          requests={transferRequests}
          stockRows={stockRows}
          warehouses={warehouses}
        />
      )}
    </>
  );
}
