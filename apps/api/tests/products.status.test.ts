const productMock = {
  findUnique: jest.fn(),
  update: jest.fn()
};

jest.mock("../src/config/prisma", () => ({
  prisma: {
    product: productMock
  }
}));

import { toggleProductActive } from "../src/modules/products/products.queries";

const ACTIVE_PRODUCT = {
  id: "product-1",
  sku: "SKU-1",
  name: "Producto activo",
  isActive: true
};

const INACTIVE_PRODUCT = {
  ...ACTIVE_PRODUCT,
  name: "Producto inactivo",
  isActive: false
};

describe("toggleProductActive", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    productMock.findUnique.mockResolvedValue(ACTIVE_PRODUCT);
    productMock.update.mockImplementation(
      async ({ data }: { data: { isActive: boolean } }) => ({
        ...ACTIVE_PRODUCT,
        isActive: data.isActive
      })
    );
  });

  it("deactivates a product using an explicit target state", async () => {
    const result = await toggleProductActive("product-1", false);

    expect(productMock.findUnique).toHaveBeenCalledWith({
      where: {
        id: "product-1"
      }
    });
    expect(productMock.update).toHaveBeenCalledWith({
      where: {
        id: "product-1"
      },
      data: {
        isActive: false
      }
    });
    expect(result.product.isActive).toBe(false);
  });

  it("reactivates a product using an explicit target state", async () => {
    productMock.findUnique.mockResolvedValue(INACTIVE_PRODUCT);
    productMock.update.mockImplementation(
      async ({ data }: { data: { isActive: boolean } }) => ({
        ...INACTIVE_PRODUCT,
        isActive: data.isActive
      })
    );

    const result = await toggleProductActive("product-1", true);

    expect(productMock.update).toHaveBeenCalledWith({
      where: {
        id: "product-1"
      },
      data: {
        isActive: true
      }
    });
    expect(result.product.isActive).toBe(true);
  });

  it("does not write when the product already has the requested state", async () => {
    const result = await toggleProductActive("product-1", true);

    expect(productMock.update).not.toHaveBeenCalled();
    expect(result).toEqual({
      oldData: ACTIVE_PRODUCT,
      product: ACTIVE_PRODUCT
    });
  });

  it("keeps legacy toggle behavior when no target state is sent", async () => {
    const result = await toggleProductActive("product-1");

    expect(productMock.update).toHaveBeenCalledWith({
      where: {
        id: "product-1"
      },
      data: {
        isActive: false
      }
    });
    expect(result.product.isActive).toBe(false);
  });

  it("throws a controlled 404 when the product does not exist", async () => {
    productMock.findUnique.mockResolvedValue(null);

    await expect(
      toggleProductActive("missing-product", true)
    ).rejects.toMatchObject({
      statusCode: 404,
      message: "Producto no encontrado"
    });
    expect(productMock.update).not.toHaveBeenCalled();
  });
});
