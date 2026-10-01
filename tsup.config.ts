import { defineConfig, type Options } from "tsup";

const shared: Options = {
  dts: true,
  external: ["react", "react-dom", "next"],
  format: ["esm", "cjs"],
  sourcemap: true,
  tsconfig: "tsconfig.build.json",
};

// `pnpm build` empties dist first, so neither entry cleans; they build in
// parallel and one would delete the other's files.
export default defineConfig([
  {
    ...shared,
    entry: { index: "src/utils/next-subrouter/index.ts" },
    treeshake: true,
  },
  {
    ...shared,
    // esbuild drops in-file directives, so the client entry gets the banner.
    // Rollup's treeshake would drop the banner too; esbuild still tree-shakes.
    banner: { js: '"use client";' },
    entry: { client: "src/utils/next-subrouter/client.ts" },
    treeshake: false,
  },
]);
