import { Router } from "express";

import {
  requireAuth,
  requirePermission
} from "../../middlewares/auth";

import { validate } from "../../middlewares/validate";

import { asyncHandler } from "../../utils/asyncHandler";
import { setPaginationHeaders } from "../../utils/pagination";

import { auditLog } from "../audit/audit.service";
import { PERMISSIONS } from "../auth/permissions";

import {
  mapInventoryMovementAuditData,
  mapWarehouseAuditData
} from "./inventory.mappers";
import {
  createWarehouse,
  ensureSellerStockWarehouse,
  recordInventoryIn,
  recordInventoryOut
} from "./inventory.service";
import {
  listInventoryMovements,
  listProductStock,
  listSellerStock,
  listWarehouses
} from "./inventory.queries";
import {
  movementSchema,
  sellerStockWarehouseParamsSchema,
  warehouseSchema
} from "./inventory.shared";

export const inventoryRouter = Router();

inventoryRouter.use(requireAuth);

inventoryRouter.get(
  "/warehouses",
  requirePermission(PERMISSIONS.InventoryRead),
  asyncHandler(async (_req, res) => {
    const warehouses = await listWarehouses();

    res.json(warehouses);
  })
);

inventoryRouter.post(
  "/warehouses",
  requirePermission(PERMISSIONS.InventoryAdjust),
  validate(warehouseSchema),
  asyncHandler(async (req, res) => {
    const warehouse = await createWarehouse({
      name: req.body.name,
      description: req.body.description
    });

    await auditLog({
      userId: req.user?.id,
      action: "INVENTORY_WAREHOUSE_CREATE",
      tableName: "Warehouse",
      recordId: warehouse.id,
      newData: mapWarehouseAuditData(warehouse),
      ipAddress: req.ip
    });

    res.status(201).json(warehouse);
  })
);


inventoryRouter.get(
  "/seller-stock",
  requirePermission(PERMISSIONS.InventoryRead),
  asyncHandler(async (req, res) => {
    const result = await listSellerStock(
      {
        id: req.user!.id,
        role: req.user!.role
      },
      req.query as Record<string, unknown>
    );

    res.json(result);
  })
);

inventoryRouter.post(
  "/seller-stock/:sellerId/warehouse",
  requirePermission(PERMISSIONS.InventoryAdjust),
  validate(sellerStockWarehouseParamsSchema),
  asyncHandler(async (req, res) => {
    const warehouse = await ensureSellerStockWarehouse(String(req.params.sellerId));

    await auditLog({
      userId: req.user?.id,
      action: "INVENTORY_SELLER_WAREHOUSE_ENSURE",
      tableName: "Warehouse",
      recordId: warehouse.id,
      newData: mapWarehouseAuditData(warehouse),
      ipAddress: req.ip
    });

    res.status(201).json(warehouse);
  })
);

inventoryRouter.get(
  "/movements",
  requirePermission(PERMISSIONS.InventoryRead),
  asyncHandler(async (req, res) => {
    const result = await listInventoryMovements(
      req.query as Record<string, unknown>
    );

    setPaginationHeaders(res, result.meta);

    res.json(result.data);
  })
);

inventoryRouter.get(
  "/stock",
  requirePermission(PERMISSIONS.InventoryRead),
  asyncHandler(async (req, res) => {
    const result = await listProductStock(
      req.query as Record<string, unknown>
    );

    setPaginationHeaders(res, result.meta);

    res.json(result.data);
  })
);

inventoryRouter.post(
  "/in",
  requirePermission(PERMISSIONS.InventoryAdjust),
  validate(movementSchema),
  asyncHandler(async (req, res) => {
    const movement = await recordInventoryIn({
      productId: req.body.productId,
      warehouseId: req.body.warehouseId,
      quantity: req.body.quantity,
      reason: req.body.reason,
      reasonType: req.body.reasonType,
      createdBy: req.user!.id
    });

    await auditLog({
      userId: req.user?.id,
      action: "INVENTORY_IN",
      tableName: "InventoryMovement",
      recordId: movement.id,
      newData: mapInventoryMovementAuditData(movement),
      ipAddress: req.ip
    });

    res.status(201).json(movement);
  })
);

inventoryRouter.post(
  "/out",
  requirePermission(PERMISSIONS.InventoryAdjust),
  validate(movementSchema),
  asyncHandler(async (req, res) => {
    const movement = await recordInventoryOut({
      productId: req.body.productId,
      warehouseId: req.body.warehouseId,
      quantity: req.body.quantity,
      reason: req.body.reason,
      reasonType: req.body.reasonType,
      createdBy: req.user!.id
    });

    await auditLog({
      userId: req.user?.id,
      action: "INVENTORY_OUT",
      tableName: "InventoryMovement",
      recordId: movement.id,
      newData: mapInventoryMovementAuditData(movement),
      ipAddress: req.ip
    });

    res.status(201).json(movement);
  })
);
