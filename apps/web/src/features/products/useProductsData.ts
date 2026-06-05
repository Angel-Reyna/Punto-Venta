import { useCallback, useEffect, useState } from "react";

import { getApiErrorMessage } from "../../utils/apiError";
import { downloadBlob } from "../../utils/downloadBlob";

import { Product, ProductCategory } from "./productShared";
import {
  CreateProductInput,
  UpdateProductInput,
  createProduct as createProductRequest,
  deleteAllProducts as deleteAllProductsRequest,
  deleteProduct as deleteProductRequest,
  downloadProductTemplate,
  importProductsExcel,
  listProductCategories,
  listProducts,
  toggleProduct as toggleProductRequest,
  updateProduct as updateProductRequest,
} from "./productsApi";

type UseProductsDataOptions = {
  canCreateProduct: boolean;
};

function isValidExcelFile(file: File) {
  return file.name.toLowerCase().endsWith(".xlsx");
}

function formatImportMessage(response: {
  imported: number;
  created: number;
  updated: number;
  withInitialStock: number;
  message?: string;
}) {
  const details = [
    `${response.created} creado${response.created === 1 ? "" : "s"}`,
    `${response.updated} actualizado${response.updated === 1 ? "" : "s"}`
  ];

  if (response.withInitialStock > 0) {
    details.push(
      `${response.withInitialStock} con stock inicial`
    );
  }

  return `${response.message ?? `Productos procesados: ${response.imported}`} (${details.join(", ")}).`;
}

export function useProductsData({ canCreateProduct }: UseProductsDataOptions) {
  const [rows, setRows] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [updatingProductId, setUpdatingProductId] = useState<string | null>(null);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [isImportingExcel, setIsImportingExcel] = useState(false);
  const [togglingProductId, setTogglingProductId] = useState<string | null>(
    null,
  );
  const [deletingProductId, setDeletingProductId] = useState<string | null>(
    null,
  );
  const [isDeletingAllProducts, setIsDeletingAllProducts] = useState(false);
  const [productPendingDelete, setProductPendingDelete] =
    useState<Product | null>(null);

  const load = useCallback(
    async (query = searchQuery) => {
      try {
        setError("");

        const [products, productCategories] = await Promise.all([
          listProducts(query),
          canCreateProduct
            ? listProductCategories()
            : Promise.resolve([] as ProductCategory[]),
        ]);

        setRows(products);
        setCategories(productCategories);
      } catch {
        setError("No se pudo cargar el catálogo de productos.");
      }
    },
    [canCreateProduct, searchQuery],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void load(searchQuery);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [load, searchQuery]);

  const createProduct = useCallback(
    async (payload: CreateProductInput) => {
      if (isCreatingProduct) return false;

      setMessage("");
      setError("");
      setIsCreatingProduct(true);

      try {
        await createProductRequest(payload);

        setMessage("Producto creado correctamente.");
        await load();

        return true;
      } catch (err: unknown) {
        setError(
          getApiErrorMessage(
            err,
            "No se pudo crear el producto. Revisa SKU, precios y campos obligatorios.",
          ),
        );

        return false;
      } finally {
        setIsCreatingProduct(false);
      }
    },
    [isCreatingProduct, load],
  );


  const updateProduct = useCallback(
    async (productId: string, payload: UpdateProductInput) => {
      if (updatingProductId) return false;

      setMessage("");
      setError("");
      setUpdatingProductId(productId);

      try {
        await updateProductRequest(productId, payload);

        setMessage("Producto actualizado correctamente.");
        await load();

        return true;
      } catch (err: unknown) {
        setError(
          getApiErrorMessage(
            err,
            "No se pudo actualizar el producto. Revisa SKU, precios y campos obligatorios.",
          ),
        );

        return false;
      } finally {
        setUpdatingProductId(null);
      }
    },
    [load, updatingProductId],
  );

  const downloadTemplate = useCallback(async () => {
    setError("");
    setIsDownloadingTemplate(true);

    try {
      const template = await downloadProductTemplate();

      downloadBlob(template, "formato-productos.xlsx");
    } catch {
      setError("No se pudo descargar el formato Excel.");
    } finally {
      setIsDownloadingTemplate(false);
    }
  }, []);

  const importExcel = useCallback(
    async (file?: File) => {
      if (isImportingExcel) return;

      setMessage("");
      setError("");

      if (!file) {
        setError("Selecciona un archivo Excel .xlsx para importar productos.");
        return;
      }

      if (!isValidExcelFile(file)) {
        setError("El archivo debe tener extensión .xlsx. Descarga el formato desde Punta Venta y vuelve a intentarlo.");
        return;
      }

      setIsImportingExcel(true);

      try {
        const response = await importProductsExcel(file);

        setMessage(formatImportMessage(response));
        await load();
      } catch (err: unknown) {
        setError(
          getApiErrorMessage(
            err,
            "No se pudo importar el archivo Excel. Verifica que uses el formato correcto.",
          ),
        );
      } finally {
        setIsImportingExcel(false);
      }
    },
    [isImportingExcel, load],
  );

  const toggleProduct = useCallback(
    async (product: Product) => {
      if (togglingProductId) return;

      const nextIsActive = !product.isActive;

      setMessage("");
      setError("");
      setTogglingProductId(product.id);

      try {
        const updatedProduct = await toggleProductRequest(product.id, nextIsActive);

        setRows((currentRows) =>
          currentRows.map((row) =>
            row.id === updatedProduct.id ? { ...row, ...updatedProduct } : row,
          ),
        );
        setMessage(
          nextIsActive
            ? "Producto activado correctamente."
            : "Producto desactivado correctamente.",
        );
        await load();
      } catch (err: unknown) {
        setError(getApiErrorMessage(err, "No se pudo actualizar el estado del producto."));
      } finally {
        setTogglingProductId(null);
      }
    },
    [load, togglingProductId],
  );

  const deleteSelectedProduct = useCallback(async () => {
    if (!productPendingDelete || deletingProductId) return;

    setMessage("");
    setError("");
    setDeletingProductId(productPendingDelete.id);

    try {
      const response = await deleteProductRequest(productPendingDelete.id);

      setMessage(response.message ?? "Producto eliminado correctamente.");
      setProductPendingDelete(null);
      await load();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "No se pudo eliminar el producto."));
    } finally {
      setDeletingProductId(null);
    }
  }, [deletingProductId, load, productPendingDelete]);

  const deleteAllProducts = useCallback(async () => {
    if (isDeletingAllProducts) return false;

    setMessage("");
    setError("");
    setIsDeletingAllProducts(true);

    try {
      const response = await deleteAllProductsRequest();

      setMessage(
        response.message ??
          `Se eliminaron ${response.deletedProducts} productos del catálogo.`,
      );
      await load("");
      setSearchQuery("");

      return true;
    } catch (err: unknown) {
      setError(
        getApiErrorMessage(
          err,
          "No se pudieron eliminar todos los productos.",
        ),
      );

      return false;
    } finally {
      setIsDeletingAllProducts(false);
    }
  }, [isDeletingAllProducts, load]);

  return {
    categories,
    createProduct,
    deleteAllProducts,
    deletingProductId,
    deleteSelectedProduct,
    downloadTemplate,
    error,
    importExcel,
    isCreatingProduct,
    isDeletingAllProducts,
    isDownloadingTemplate,
    isImportingExcel,
    load,
    message,
    productPendingDelete,
    rows,
    searchQuery,
    setError,
    setMessage,
    setProductPendingDelete,
    setSearchQuery,
    togglingProductId,
    toggleProduct,
    updatingProductId,
    updateProduct,
  };
}
