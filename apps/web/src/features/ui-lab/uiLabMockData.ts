export type MockInventoryItem = {
  sku: string;
  name: string;
  category: string;
  totalStock: number;
  minimumStock: number;
  warehouses: Array<{
    name: string;
    type: "MAIN" | "SELLER";
    stock: number;
  }>;
};

export type MockSaleProduct = {
  sku: string;
  name: string;
  stock: number;
  price: number;
  warehouse: string;
};

export const inventoryMockItems: MockInventoryItem[] = [
  {
    sku: "PV-COCA-600",
    name: "Coca-Cola 600 ml",
    category: "Bebidas",
    totalStock: 42,
    minimumStock: 20,
    warehouses: [
      { name: "Principal", type: "MAIN", stock: 32 },
      { name: "Ana López", type: "SELLER", stock: 10 },
    ],
  },
  {
    sku: "PV-TAKIS-FUEGO",
    name: "Takis Fuego 80 g",
    category: "Botanas",
    totalStock: 8,
    minimumStock: 12,
    warehouses: [
      { name: "Principal", type: "MAIN", stock: 8 },
      { name: "Carlos Méndez", type: "SELLER", stock: 0 },
    ],
  },
  {
    sku: "PV-GALLETA-VAIN",
    name: "Galleta vainilla paquete",
    category: "Abarrotes",
    totalStock: 0,
    minimumStock: 10,
    warehouses: [
      { name: "Principal", type: "MAIN", stock: 0 },
      { name: "Ana López", type: "SELLER", stock: 0 },
    ],
  },
];

export const salesMockProducts: MockSaleProduct[] = [
  {
    sku: "PV-COCA-600",
    name: "Coca-Cola 600 ml",
    stock: 10,
    price: 18,
    warehouse: "Stock asignado · Ana López",
  },
  {
    sku: "PV-AGUA-1L",
    name: "Agua natural 1 L",
    stock: 14,
    price: 14,
    warehouse: "Stock asignado · Ana López",
  },
  {
    sku: "PV-TAKIS-FUEGO",
    name: "Takis Fuego 80 g",
    stock: 0,
    price: 17,
    warehouse: "Sin unidades asignadas",
  },
];

export const salesTicketMock = [
  { name: "Coca-Cola 600 ml", quantity: 2, subtotal: 36 },
  { name: "Agua natural 1 L", quantity: 1, subtotal: 14 },
];
