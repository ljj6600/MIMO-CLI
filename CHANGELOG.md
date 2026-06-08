# Changelog

All notable changes to this project will be documented in this file.

## [0.2.1] - 2026-06-09

### Added
- **Cookie 自动获取**：`mimo quota` 系列命令执行时自动通过 CDP (Chrome DevTools Protocol) 从 Edge 浏览器获取平台 Cookie，无需手动复制粘贴
- 自动启动 Edge 调试模式浏览器（`--remote-debugging-port` + 独立用户数据目录 `~/.mimo-browser`），避免与用户已打开的浏览器实例冲突
- 自动检测浏览器中是否已打开 `platform.xiaomimimo.com` 页面，未打开时提示用户登录并等待（最长 120 秒轮询）
- Cookie 获取支持 5 次重试机制，每次间隔 2 秒，解决页面加载中 Cookie 尚未就绪的问题
- 新增 `cookie-fetcher.ts` 模块，封装 CDP 连接、WebSocket 通信、Cookie 提取等完整流程
- 新增 9 个 i18n 翻译 key，覆盖自动获取 Cookie 全流程的中英文提示文本
- 新增 `playwright`、`ws` 依赖，用于 CDP WebSocket 通信

### Fixed
- 修复长 Cookie 粘贴时 `promptLongText` 误判为空输入的问题，改用 `process.stdin` 事件流读取
- 修复 `mimo quota` 系列命令 Cookie 失效时未清除配置中旧 Cookie 的问题
- 修复 Cookie 获取成功但 API 请求偶发失败的问题：扩展 Cookie 域名匹配范围至 `.xiaomimimo.com`，并增加重试逻辑

### Changed
- `mimo quota` 系列命令 Cookie 解析流程重构：`--cookie` 参数 → 配置文件 → **CDP 自动获取** → 手动输入（fallback）
- Cookie 失效时自动清除配置文件中的 `platform_cookie`，避免下次仍使用无效 Cookie
- 错误处理方式从 `process.exit(1)` 改为 `throw CLIError`（异步安全，不会中断 Promise 链）
- `errors/handler.ts` 返回类型从 `never` 改为 `void`，使用 `process.exitCode` 替代 `process.exit()`
- `build.ts` 中 `external` 数组添加 `playwright`，避免打包进 bundle

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

## [0.1.0] - 2026-06-03

### Fixed
- CLI build (`dist/mimo.mjs`) now includes `#!/usr/bin/env node` shebang, enabling direct execution via `npx` and `npm install -g`.
- `files` field added to `package.json`: only `dist/` is published to npm, avoiding shipping source code and node_modules.
- `prepublishOnly` script added: `bun run build` runs automatically before `npm publish`.
- SDK `exports` updated to point to built `dist/sdk.mjs` instead of source `src/sdk/index.ts`, so consumers do not need Bun.
