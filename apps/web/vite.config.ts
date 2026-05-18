import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function manualChunks(id: string) {
  if (!id.includes("node_modules")) {
    return undefined;
  }

  if (id.includes("@mui/")) {
    return "mui";
  }

  if (id.includes("react") || id.includes("react-dom") || id.includes("react-router-dom")) {
    return "react-vendor";
  }

  if (id.includes("axios")) {
    return "http-vendor";
  }

  return "vendor";
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173
  },
  preview: {
    port: 4173
  },
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks
      }
    }
  }
});
