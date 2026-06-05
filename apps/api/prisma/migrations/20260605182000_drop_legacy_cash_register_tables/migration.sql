-- Drop legacy cash-register persistence after removing the active cash-register module.
-- Keep this as a forward migration instead of editing historical migrations.

DROP TABLE IF EXISTS "CashMovement";
DROP TABLE IF EXISTS "CashRegisterSession";
DROP TYPE IF EXISTS "CashMovementType";
DROP TYPE IF EXISTS "CashRegisterStatus";
