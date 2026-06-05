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
  mapInventoryTransferRequestAuditData,
  mapWarehouseAuditData
} from "./inventory.mappers";
import {
  approveInventoryTransferRequest,
  createInventoryTransferRequest,
  createWarehouse,
  ensureSellerStockWarehouse,
  recordInventoryIn,
  recordInventoryOut,
  rejectInventoryTransferRequest
} from "./inventory.service";
import {
  listInventoryMovements,
  listInventoryTransferRequests,
  listProductStock,
  listSellerStock,
  listWarehouses
} from "./inventory.queries";
import {
  inventoryTransferRequestApprovalSchema,
  inventoryTransferRequestReviewSchema,
  inventoryTransferRequestSchema,
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
  "/transfer-requests",
  requirePermission(PERMISSIONS.InventoryTransferRequestRead),
  asyncHandler(async (req, res) => {
    const result = await listInventoryTransferRequests(
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
  "/transfer-requests",
  requirePermission(PERMISSIONS.InventoryTransferRequestCreate),
  validate(inventoryTransferRequestSchema),
  asyncHandler(async (req, res) => {
    const request = await createInventoryTransferRequest(
      {
        id: req.user!.id,
        role: req.user!.role
      },
      {
        fromWarehouseId: req.body.fromWarehouseId,
        reason: req.body.reason,
        items: req.body.items
      }
    );

    await auditLog({
      userId: req.user?.id,
      action: "INVENTORY_TRANSFER_REQUEST_CREATE",
      tableName: "InventoryTransferRequest",
      recordId: request.id,
      newData: mapInventoryTransferRequestAuditData(request),
      ipAddress: req.ip
    });

    res.status(201).json(request);
  })
);


inventoryRouter.post(
  "/transfer-requests/:requestId/approve",
  requirePermission(PERMISSIONS.InventoryTransferRequestReview),
  validate(inventoryTransferRequestApprovalSchema),
  asyncHandler(async (req, res) => {
    const request = await approveInventoryTransferRequest({
      requestId: req.params.requestId,
      reviewedById: req.user!.id,
      reviewNote: req.body.reviewNote
    });

    await auditLog({
      userId: req.user?.id,
      action: "INVENTORY_TRANSFER_REQUEST_APPROVE",
      tableName: "InventoryTransferRequest",
      recordId: request.id,
      newData: mapInventoryTransferRequestAuditData(request),
      ipAddress: req.ip
    });

    res.json(request);
  })
);

inventoryRouter.post(
  "/transfer-requests/:requestId/reject",
  requirePermission(PERMISSIONS.InventoryTransferRequestReview),
  validate(inventoryTransferRequestReviewSchema),
  asyncHandler(async (req, res) => {
    const request = await rejectInventoryTransferRequest({
      requestId: req.params.requestId,
      reviewedById: req.user!.id,
      reviewNote: req.body.reviewNote
    });

    await auditLog({
      userId: req.user?.id,
      action: "INVENTORY_TRANSFER_REQUEST_REJECT",
      tableName: "InventoryTransferRequest",
      recordId: request.id,
      newData: mapInventoryTransferRequestAuditData(request),
      ipAddress: req.ip
    });

    res.json(request);
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
