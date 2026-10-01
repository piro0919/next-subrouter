import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    // next-intl's ESM build imports "next/server" without an extension, which
    // Node's ESM resolver rejects; let Vite resolve it instead.
    server: { deps: { inline: ["next-intl"] } },
  },
});
