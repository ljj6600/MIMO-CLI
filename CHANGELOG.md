# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0] - 2026-06-03

### Fixed
- CLI build (`dist/mimo.mjs`) now includes `#!/usr/bin/env node` shebang, enabling direct execution via `npx` and `npm install -g`.
- `files` field added to `package.json`: only `dist/` is published to npm, avoiding shipping source code and node_modules.
- `prepublishOnly` script added: `bun run build` runs automatically before `npm publish`.
- SDK `exports` updated to point to built `dist/sdk.mjs` instead of source `src/sdk/index.ts`, so consumers do not need Bun.
