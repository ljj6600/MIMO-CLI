# Changelog

All notable changes to this project will be documented in this file.

## [0.2.0] - 2026-06-08

### Added
- 完整 i18n 国际化支持：所有命令的用户可见文本均支持中英文切换（`mimo config set language zh/en`）
- 新增 quota 命令组：`mimo quota`、`mimo quota bill`、`mimo quota usage`、`mimo quota recharge`
- 新增 59 个 i18n 翻译 key，覆盖全部命令的 description、usage、examples、错误提示等
- 文本输出格式（`--output text`）支持中文对齐，中文字符按双宽度计算
- 子命令自动列出：父命令 `--help` 自动展示已注册的子命令列表

### Changed
- 命令 description 统一使用 i18n key，由 registry 在打印时调用 `t()` 翻译
- `auth status` 输出中 keyType 和 standbyKey 标签支持中英文
- `config show` 输出中 tpApiKey/skApiKey 标签支持中英文
- `vision` 命令错误提示 hint 支持中英文

### Fixed
- 修复 `auth/status.ts` 中硬编码中文"按量计费"和"TokenPlan"，英文模式下不再显示中文
- 修复 `config/show.ts` 中硬编码中文"按量计费"和"TokenPlan"
- 修复 `vision.ts` 中 CLIError hint 硬编码中文路径占位符"路径|URL"和"文本"
- 修复 `auth/logout.ts` 缺少 i18n 翻译
- 修复 `config/set.ts` 缺少 i18n 翻译
- 修复 `help.ts`、`update.ts`、`chat.ts` 等命令缺少 i18n 翻译

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
