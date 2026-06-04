import { build } from "bun";
import { readFileSync, writeFileSync } from "fs";

const isDev = process.argv.includes("--dev");

// CLI build
await build({
  entrypoints: ["./src/main.ts"],
  outdir: "./dist",
  naming: "mimo.mjs",
  target: "node",
  format: "esm",
  minify: !isDev,
  sourcemap: true,
  define: {
    "process.env.CLI_VERSION": JSON.stringify(
      process.env.npm_package_version ?? "0.1.0",
    ),
  },
  external: ["undici"],
});

// Prepend Node shebang so the CLI works with `npx` / `npm install -g`
const cliPath = "./dist/mimo.mjs";
const cliCode = readFileSync(cliPath, "utf-8");
if (!cliCode.startsWith("#!")) {
  writeFileSync(cliPath, "#!/usr/bin/env node\n" + cliCode);
}

// SDK build
await build({
  entrypoints: ["./src/sdk/index.ts"],
  outdir: "./dist",
  naming: "sdk.mjs",
  target: "node",
  format: "esm",
  minify: false,
  sourcemap: true,
  external: ["undici", "openai"],
});

console.log("Build complete!");
