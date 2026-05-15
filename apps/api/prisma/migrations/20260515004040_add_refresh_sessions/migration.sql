/*
  Warnings:

  - A unique constraint covering the columns `[tokenHash]` on the table `RefreshSession` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `RefreshSession` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "RefreshSession" ADD COLUMN     "replacedBySessionId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "RefreshSession_tokenHash_key" ON "RefreshSession"("tokenHash");
