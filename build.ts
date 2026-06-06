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

// Optional: compile standalone Windows executable
// Usage: bun run build.ts --exe
if (process.argv.includes("--exe")) {
  const version = process.env.npm_package_version ?? "0.1.0";

  await build({
    entrypoints: ["./src/exe-entry.ts"],
    compile: {
      target: "bun-windows-x64",
      outfile: "./dist/mimo",
    },
    minify: true,
    bytecode: true,
    sourcemap: "linked",
    define: {
      "process.env.CLI_VERSION": JSON.stringify(version),
    },
  });

  console.log("EXE build complete: dist/mimo.exe");
}

console.log("Build complete!");
