import { build } from "esbuild";

await build({
  entryPoints: ["api/_index.ts"],
  bundle: true,
  platform: "node",
  target: "node22",
  outfile: "api/index.js",
  external: ["@prisma/client", "@prisma/engines"],
  format: "cjs",
});
