import { build } from "esbuild";

await build({
  entryPoints: ["api/handler.ts"],
  bundle: true,
  platform: "node",
  target: "node18",
  outfile: "api/index.js",
  format: "cjs",
  external: ["@prisma/client", ".prisma/client"],
  logLevel: "info",
});
