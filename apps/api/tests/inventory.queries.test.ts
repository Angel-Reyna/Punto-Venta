const prismaMock = {
  inventoryMovement: {
    count: jest.fn(),
    findMany: jest.fn()
  }
};

jest.mock("../src/config/prisma", () => ({
  prisma: prismaMock
}));

import { listInventoryMovements } from "../src/modules/inventory/inventory.queries";

describe("inventory.queries", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.inventoryMovement.count.mockResolvedValue(0);
    prismaMock.inventoryMovement.findMany.mockResolvedValue([]);
  });

  it.each(["merma", "caducidad", "expiration", "vencimiento"])(
    "maps inventory movement search term %s to expiration reason type",
    async (q) => {
      await listInventoryMovements({ q });

      expect(prismaMock.inventoryMovement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              {
                reasonType: "EXPIRATION"
              }
            ])
          })
        })
      );
      expect(prismaMock.inventoryMovement.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              {
                reasonType: "EXPIRATION"
              }
            ])
          })
        })
      );
    }
  );

  it("keeps standard text filters without adding expiration alias for unrelated searches", async () => {
    await listInventoryMovements({ q: "cafe" });

    const where = prismaMock.inventoryMovement.findMany.mock.calls[0][0].where;

    expect(where.OR).toEqual(
      expect.arrayContaining([
        {
          reason: {
            contains: "cafe",
            mode: "insensitive"
          }
        },
        {
          productSku: {
            contains: "cafe",
            mode: "insensitive"
          }
        },
        {
          productName: {
            contains: "cafe",
            mode: "insensitive"
          }
        }
      ])
    );
    expect(where.OR).not.toContainEqual({
      reasonType: "EXPIRATION"
    });
  });
});
