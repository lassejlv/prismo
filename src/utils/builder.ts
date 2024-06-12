import { $, build } from "bun";

$`rm -rf dist`;

build({
  format: "esm",
  target: "node",
  entrypoints: ["src/index.ts"],
  outdir: "dist",
  minify: {
    whitespace: true,
  },
  sourcemap: "external",
});

await $`bunx tsc`;
