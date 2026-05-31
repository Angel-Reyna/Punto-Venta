import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const MUI_CORE_PACKAGES = [
  "/@emotion/",
  "/@mui/base/",
  "/@mui/core-downloads-tracker/",
  "/@mui/material/",
  "/@mui/private-theming/",
  "/@mui/styled-engine/",
  "/@mui/system/",
  "/@mui/types/",
  "/@mui/utils/",
];

const REACT_PACKAGES = ["/react/", "/react-dom/", "/react-router-dom/", "/scheduler/"];

function includesPackage(normalizedId: string, packages: string[]) {
  return packages.some((packagePath) => normalizedId.includes(packagePath));
}

function manualVendorChunk(id: string) {
  if (!id.includes("node_modules")) {
    return undefined;
  }

  const normalizedId = id.replace(/\\/g, "/");

  if (normalizedId.includes("/@mui/x-data-grid/") || normalizedId.includes("/@mui/x-internals/")) {
    return "vendor-mui-datagrid";
  }

  if (normalizedId.includes("/@mui/icons-material/")) {
    return "vendor-mui-icons";
  }

  if (includesPackage(normalizedId, MUI_CORE_PACKAGES)) {
    return "vendor-mui-core";
  }

  if (includesPackage(normalizedId, REACT_PACKAGES)) {
    return "vendor-react";
  }

  if (normalizedId.includes("/axios/")) {
    return "vendor-http";
  }

  return "vendor-misc";
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
