import { fileURLToPath } from "url";
import { defineConfig } from "vitest/config";

/** Balancing runs only (`npm run simulate`); kept apart from the unit tests. */
export default defineConfig({
  esbuild: { jsx: "automatic" },
  resolve: { alias: { "@": fileURLToPath(new URL("./", import.meta.url)) } },
  test: { environment: "node", include: ["scripts/**/*.sim.ts"], testTimeout: 3_600_000 },
});
