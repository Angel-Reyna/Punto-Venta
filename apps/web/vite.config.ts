import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function manualVendorChunk(id: string) {
  if (!id.includes("node_modules")) {
    return undefined;
  }

  const normalizedId = id.replace(/\\/g, "/");

  if (normalizedId.includes("/@mui/x-data-grid/")) {
    return "vendor-mui-datagrid";
  }

  if (normalizedId.includes("/@mui/icons-material/")) {
    return "vendor-mui-icons";
  }

  if (
    normalizedId.includes("/@mui/material/") ||
    normalizedId.includes("/@mui/system/") ||
    normalizedId.includes("/@mui/utils/") ||
    normalizedId.includes("/@emotion/")
  ) {
    return "vendor-mui-core";
  }

  if (
    normalizedId.includes("/react/") ||
    normalizedId.includes("/react-dom/") ||
    normalizedId.includes("/react-router-dom/") ||
    normalizedId.includes("/scheduler/")
  ) {
    return "vendor-react";
  }

  if (normalizedId.includes("/axios/")) {
    return "vendor-http";
  }

  return "vendor";
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5173,
  },
  preview: {
    port: 4173,
  },
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: manualVendorChunk,
      },
    },
  },
});
