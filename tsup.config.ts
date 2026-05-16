import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/utils/next-subrouter/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  external: ["react", "react-dom", "next", "next/link", "next/navigation", "next/server", "next-intl"],
  tsconfig: "tsconfig.build.json",
});
