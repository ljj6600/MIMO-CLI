# Changelog

All notable changes to this project will be documented in this file.

## [0.1.5] - 2026-06-05

### Fixed
- SDK Chat 默认模型从旧名称 `MiMo-7B-RL` 修正为 `mimo-v2.5-pro`，与 CLI 命令对齐
- SDK TTS 音色设计方法 `design()` 默认模型从 `mimo-v2.5-tts` 修正为 `mimo-v2.5-tts-voicedesign`
- README 文档优化：以 "不用写一行代码，帮助你的 Agent 拥有 MiMo 的全部能力" 为主体重写

## [0.1.4] - 2026-06-xx

### Changed
- 全面中文化 + openai v6 升级

## [0.1.0] - 2026-06-03

### Fixed
- CLI build (`dist/mimo.mjs`) now includes `#!/usr/bin/env node` shebang, enabling direct execution via `npx` and `npm install -g`.
- `files` field added to `package.json`: only `dist/` is published to npm, avoiding shipping source code and node_modules.
- `prepublishOnly` script added: `bun run build` runs automatically before `npm publish`.
- SDK `exports` updated to point to built `dist/sdk.mjs` instead of source `src/sdk/index.ts`, so consumers do not need Bun.
