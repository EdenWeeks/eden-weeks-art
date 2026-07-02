import path from "node:path";

import react from "@vitejs/plugin-react-swc";
import { configDefaults, defineConfig } from "vitest/config";

import pkg from "./package.json";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  // The site version shown in the footer. Single source of truth is
  // package.json's `version`; releases tag the same commit `v<version>`.
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
  ],
  test: {
    // The order service has its own node:test suite (run in CI's
    // Order Service Tests job) that Vitest can't run; exclude the subtree.
    exclude: [...configDefaults.exclude, 'order-service/**'],
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    onConsoleLog(log) {
      return !log.includes("React Router Future Flag Warning");
    },
    env: {
      DEBUG_PRINT_LIMIT: '0', // Suppress DOM output that exceeds AI context windows
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));