-- Migra la categoría heredada usada solo en demos hacia una categoría real.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

INSERT INTO "ProductCategory" ("id", "name", "description", "isActive", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, 'General', 'Categoría general', true, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "ProductCategory" WHERE "name" = 'General'
);

UPDATE "Product"
SET "categoryId" = (
  SELECT "id" FROM "ProductCategory" WHERE "name" = 'General' LIMIT 1
)
WHERE "categoryId" IN (
  SELECT "id" FROM "ProductCategory" WHERE "name" = 'DEMO Abarrotes'
);

DELETE FROM "ProductCategory"
WHERE "name" = 'DEMO Abarrotes'
  AND NOT EXISTS (
    SELECT 1 FROM "Product" WHERE "Product"."categoryId" = "ProductCategory"."id"
  );
