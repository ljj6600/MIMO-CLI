# MiMo CLI — Code Wiki

## 1. 项目概述

**MiMo CLI** 是 MiMo AI 平台的命令行工具，提供对话补全、多模态理解（图像/音频/视频）、语音识别（ASR）、语音合成（TTS）等 AI 能力的终端访问接口。同时，项目以 SDK 形式导出 API，支持在 Node.js / Bun 应用中编程调用。

- **版本**: 0.1.0
- **运行时**: Bun / Node.js
- **语言**: TypeScript (ESNext, ESM)
- **API 协议**: OpenAI 兼容 REST API
- **国际化**: 支持中文（zh）/ 英文（en）界面

---

## 2. 项目架构

```
mimo-cli/
├── bin/mimo                  # CLI 入口脚本（#!/usr/bin/env bun）
├── build.ts                  # Bun 构建脚本（CLI + SDK 双产物）
├── dist/                     # 构建输出
│   ├── mimo.mjs              # CLI 打包产物（minify，external undici）
│   └── sdk.mjs               # SDK 打包产物（未压缩，external undici + openai）
├── src/
│   ├── main.ts               # 主入口：命令注册 + 启动流程
│   ├── command.ts             # 命令定义基础设施（Command/OptionDef/defineCommand）
│   ├── registry.ts            # 命令注册表（树形路由 + 帮助输出）
│   ├── args.ts                # 命令行参数解析（scanCommandPath/parseFlags）
│   ├── version.ts             # 版本号常量（支持 CLI_VERSION 环境变量覆盖）
│   ├── client/                # API 客户端层
│   │   ├── index.ts           # MiMoClient（OpenAI SDK 封装）
│   │   └── errors.ts          # wrapApiError / createClient 工厂
│   ├── sdk/                   # SDK 编程接口层
│   │   ├── index.ts           # MiMoSDK 顶层入口
│   │   ├── client.ts          # MiMoSDKClient（SDK 客户端封装）
│   │   ├── chat.ts            # ChatSDK
│   │   ├── vision.ts          # VisionSDK
│   │   ├── asr.ts             # ASRSDK
│   │   └── tts.ts             # TTSSDK
│   ├── commands/              # 命令实现
│   │   ├── chat.ts            # 单轮对话
│   │   ├── repl.ts            # 交互式多轮对话
│   │   ├── vision.ts          # 多模态理解
│   │   ├── asr.ts             # 语音识别
│   │   ├── language.ts        # 切换界面语言
│   │   ├── help.ts            # 帮助命令
│   │   ├── update.ts          # 自更新（未实现）
│   │   ├── auth/              # 认证命令组
│   │   │   ├── login.ts       # 登录
│   │   │   ├── status.ts      # 认证状态
│   │   │   └── logout.ts      # 登出
│   │   ├── config/            # 配置命令组
│   │   │   ├── show.ts        # 显示配置
│   │   │   └── set.ts         # 设置配置项
│   │   └── tts/               # TTS 命令组
│   │       ├── synthesize.ts  # 预设音色合成
│   │       ├── clone.ts       # 语音克隆
│   │       ├── design.ts      # 语音设计
│   │       └── voices.ts      # 音色列表
│   ├── auth/                  # 认证与凭证管理
│   │   ├── resolver.ts        # 凭证解析 + Base URL 推断
│   │   └── setup.ts           # ensureAuth / persistApiKey / promptApiKey
│   ├── config/                # 配置文件管理
│   │   ├── loader.ts          # 读写配置 + loadConfig 合并优先级
│   │   ├── paths.ts           # 配置路径常量
│   │   └── schema.ts          # ConfigFile / Config 接口定义
│   ├── errors/                # 错误体系
│   │   ├── base.ts            # CLIError 自定义错误类
│   │   ├── codes.ts           # ExitCode 退出码枚举
│   │   ├── api.ts             # mapApiError（HTTP 状态码映射）
│   │   └── handler.ts         # handleError 全局错误处理器
│   ├── output/                # 输出格式化
│   │   ├── formatter.ts       # 输出格式检测 + formatOutput + dryRun
│   │   ├── text.ts            # 文本格式化（键值对/表格）
│   │   ├── json.ts            # JSON 格式化
│   │   ├── progress.ts        # Spinner + ProgressBar
│   │   ├── reasoning.ts       # 思维链格式化
│   │   └── annotations.ts     # 网页搜索引用标注格式化
│   ├── i18n/                  # 国际化
│   │   └── index.ts           # 翻译字典 + t() 翻译函数
│   ├── types/                 # TypeScript 类型定义
│   │   ├── api.ts             # API 请求/响应类型 + MiMo 扩展类型
│   │   ├── flags.ts           # 命令行标志类型
│   │   └── commands.ts        # 从 flags.ts 重新导出（向后兼容）
│   └── utils/                 # 工具函数
│       ├── audio.ts           # 音频文件处理
│       ├── image.ts           # 图片文件处理
│       ├── video.ts           # 视频文件处理
│       ├── fs.ts              # 文件/stdin 读取
│       ├── env.ts             # 环境检测（isInteractive/isCI）
│       ├── prompt.ts          # 交互式输入（基于 @clack/prompts）
│       ├── sanitize.ts        # 路径安全 + API Key 脱敏
│       └── token.ts           # Token 遮蔽显示
└── package.json
```

### 架构分层

```
┌──────────────────────────────────────────────────┐
│                  CLI 入口层                       │
│  bin/mimo → src/main.ts (命令注册 + 启动调度)     │
├──────────────────────────────────────────────────┤
│                  命令层                           │
│  src/commands/ (chat/repl/vision/asr/tts/auth/…) │
├──────────────────────────────────────────────────┤
│                  SDK 层                           │
│  src/sdk/ (ChatSDK/VisionSDK/ASRSDK/TTSSDK)      │
├──────────────────────────────────────────────────┤
│                  客户端层                         │
│  src/client/ (MiMoClient → OpenAI SDK 封装)       │
├──────────────────────────────────────────────────┤
│                  基础设施层                       │
│  config / auth / errors / output / i18n / types / utils │
└──────────────────────────────────────────────────┘
```

---

## 3. 核心模块详解

### 3.1 入口与命令调度 (`src/main.ts`)

**职责**: 程序主入口，负责注册所有命令、解析参数、加载配置、鉴权检查、执行命令。

**启动流程**:

1. 检查 `--version` / `-v` → 打印版本退出
2. `scanCommandPath()` 提取命令路径
3. `--help` / `-h` → 初始化语言 → 打印帮助退出
4. 无命令 → 初始化语言 → 打印帮助 + 登录提示
5. `registry.resolve()` 解析命令
6. `parseFlags()` 解析标志位
7. `loadConfig()` 合并配置（flags → 环境变量 → 配置文件 → 默认值）
8. `initLocale()` 初始化界面语言
9. `ensureAuth()` 鉴权（auth/config/update/help/language 命令跳过）
10. `command.execute()` 执行命令

**关键常量**:
- `NO_AUTH_COMMANDS`: 不需要认证的命令列表（auth login/status/logout、config show/set、update、help、language）

**信号处理**:
- `SIGINT` (Ctrl+C): 优雅退出，输出中断提示
- `EPIPE`: 管道断裂时静默退出
- `uncaughtException` / `unhandledRejection`: 全局错误兜底

### 3.2 命令定义 (`src/command.ts`)

**核心接口**:

| 接口 | 说明 |
|------|------|
| `OptionDef` | 选项定义：flag、description、default、required、type |
| `Command` | 命令定义：name、description、usage、options、examples、apiDocs、execute |
| `CommandSpec` | 命令规格：与 Command 相同但用 `run` 替代 `execute` |

**核心函数**:
- `defineCommand(spec: CommandSpec): Command` — 命令定义工厂，将 `run` 映射为 `execute`

**全局选项** (`GLOBAL_OPTIONS`):

| 标志 | 说明 | 默认值 |
|------|------|--------|
| `--api-key <value>` | 覆盖配置中的 API Key | - |
| `--base-url <value>` | 覆盖 API 基础 URL | - |
| `--output <value>` | 输出格式 (text/json) | text |
| `--timeout <seconds>` | 请求超时秒数 | 300 |
| `--quiet` | 抑制非必要输出 | - |
| `--verbose` | 详细日志 | - |
| `--no-color` | 禁用彩色输出 | - |
| `--dry-run` | 仅打印请求体不执行 | - |
| `--non-interactive` | 非交互模式 | - |
| `--help` | 显示帮助 | - |
| `--version` | 显示版本 | - |

### 3.3 命令注册表 (`src/registry.ts`)

**类**: `CommandRegistry`（单例实例 `registry`）

**内部结构**: 基于 `Map` 的树形节点（`CommandNode`），支持多级命令路由。

**核心方法**:

| 方法 | 说明 |
|------|------|
| `register(path, command)` | 注册命令，路径用空格分隔（如 `"tts synthesize"`） |
| `resolve(commandPath)` | 解析命令路径，返回 `{ command, extra }`；支持单子节点自动转发和别名组自动转发 |
| `getAllCommands()` | 遍历返回所有已注册命令 |
| `printHelp(commandPath, out?)` | 打印帮助信息（根级 Logo + 资源列表 / 子命令列表 / 单命令详情） |

**命令解析策略**:
1. 精确匹配路径
2. 单子节点自动转发（如 `mimo asr` → 自动匹配子命令）
3. 别名组自动转发（所有子节点指向同一命令时自动匹配）
4. 匹配部分路径但无命令 → 显示该组子命令列表
5. 完全无法匹配 → 显示根级帮助

**品牌输出**: 根级帮助输出 MiMo ASCII Logo，使用小米品牌渐变色（亮橙 → 科技红）。

**命令注册清单**:

| 命令路径 | 别名 | 说明 |
|----------|------|------|
| `chat` | - | 单轮对话补全 |
| `repl` | - | 交互式多轮对话 |
| `vision` | - | 多模态理解 |
| `asr` | - | 语音识别 |
| `tts synthesize` | `tts generate` | 预设语音合成 |
| `tts clone` | - | 语音克隆合成 |
| `tts design` | - | 语音设计合成 |
| `tts voices` | - | 列出可用 TTS 音色 |
| `auth login` | - | 登录（保存 API Key） |
| `auth status` | - | 查看认证状态 |
| `auth logout` | - | 登出（清除 API Key） |
| `config show` | - | 显示当前配置 |
| `config set` | - | 设置配置项 |
| `update` | - | 自更新（未实现） |
| `help` | - | 显示帮助 |
| `language` | - | 切换界面语言 (zh/en) |

### 3.4 参数解析 (`src/args.ts`)

**核心函数**:

| 函数 | 说明 |
|------|------|
| `scanCommandPath(argv, globalOptions)` | 快速扫描位置参数确定命令路径，跳过全局标志及其值 |
| `parseFlags(argv, options)` | 完整标志解析，支持短标志、`--flag=value`、类型推导（boolean/number/array/string） |

**类型推导规则**:
- 无 `<value>` 占位符 → boolean
- `type: 'number'` → number
- `type: 'array'` → string[]（可重复）
- 其他 → string

**特殊处理**:
- `--no-xxx` 前缀：否定布尔 flag（如 `--no-stream` → `noStream = true`，同时 `stream = false`）
- `--` 分隔符：停止解析后续参数
- 短标志：通过 `OptionDef.flag` 中的 `"-m, --model <value>"` 语法定义映射

**辅助函数**:
- `kebabToCamel()`: kebab-case → camelCase
- `flagKey()`: 从 `--flag-name <value>` 提取 camelCase 键名
- `buildShortMap()`: 构建短标志 → 长标志映射
- `buildSchema()`: 构建标志类型 schema（booleans/numbers/arrays）

### 3.5 API 客户端 (`src/client/`)

#### `index.ts` — `MiMoClient`

基于 OpenAI SDK 封装的 MiMo API 客户端。MiMo API 兼容 OpenAI 协议。

**构造参数** (`MiMoClientConfig`):
- `apiKey`: API 密钥
- `baseURL?`: 基础 URL（默认 `https://api.xiaomimimo.com/v1`）
- `timeout?`: 超时秒数（默认 300）

**核心方法**:

| 方法 | 说明 |
|------|------|
| `chatCompletion(params)` | 非流式对话补全，返回 `MiMoChatCompletion` |
| `chatCompletionStream(params)` | 流式对话补全，返回 `Stream<ChatCompletionChunk>` |
| `chat(params)` | 便捷方法，根据 `stream` 参数自动选择流式/非流式 |
| `raw` (getter) | 获取底层 OpenAI 实例 |

**MiMo 扩展字段透传**: `thinking`、`asr_options`、`audio`、`tools`（含 web_search）— 通过 `buildRequestParams()` 方法构建请求参数，MiMo 特有字段直接放入请求体。

**类型安全**: 使用 `MiMoChatCompletion` 类型替代 OpenAI SDK 的 `ChatCompletion`，以包含 `reasoning_content`、`annotations` 等扩展字段。

#### `errors.ts` — 错误包装与客户端工厂

| 导出 | 说明 |
|------|------|
| `wrapApiError(err)` | 将 OpenAI SDK 错误转换为 `CLIError`（连接错误/限流/认证/400/通用） |
| `createClient(config?)` | 工厂函数，从配置/环境变量解析凭证并创建 `MiMoClient` |

**凭证解析优先级**: 显式 config → `MIMO_API_KEY` / `MIMO_API_TOKEN` 环境变量 → 抛出错误

**Base URL 解析优先级**: 显式 config.baseURL → config.baseUrl → `MIMO_BASE_URL` 环境变量 → 根据 API Key 前缀自动推断 → `undefined`（使用默认值）

### 3.6 SDK 层 (`src/sdk/`)

SDK 层提供编程接口，同时作为 CLI 命令的底层实现。

#### `index.ts` — `MiMoSDK`

顶层 SDK 入口，组合所有子模块。

```typescript
const sdk = new MiMoSDK({ apiKey: 'sk-xxx' });
sdk.chat      // ChatSDK
sdk.vision    // VisionSDK
sdk.asr       // ASRSDK
sdk.tts       // TTSSDK
sdk.client    // MiMoSDKClient
```

**构造参数** (`MiMoSDKOptions`): `apiKey?`, `baseUrl?`, `timeout?`

静态方法 `MiMoSDK.fromConfig(config)` 可从 CLI Config 自动解析凭证创建实例。

#### `client.ts` — `MiMoSDKClient`

SDK 客户端封装，持有 `MiMoClient` 实例，提供 `handleError()` 统一错误处理和 `fromConfig()` 工厂方法。

构造时自动根据 `apiKey` 前缀推断 base URL（`tp-` → TokenPlan 端点）。

#### `chat.ts` — `ChatSDK`

| 方法 | 说明 |
|------|------|
| `chat(options)` | 非流式对话，默认模型 `MiMo-7B-RL` |
| `chatStream(options)` | 流式对话，返回 `AsyncGenerator<ChatStreamChunk>` |

**ChatOptions**: model, messages, maxCompletionTokens, temperature, topP, stream, stop, frequencyPenalty, presencePenalty, thinking, responseFormat

**ChatResult**: id, content, reasoningContent, model, usage, finishReason

**流式处理**: 使用 `extractDelta()` 安全提取 MiMo 扩展字段（reasoning_content、annotations），使用 `extractChunkUsage()` 提取 usage。

#### `vision.ts` — `VisionSDK`

| 方法 | 说明 |
|------|------|
| `describe(options)` | 多模态理解，默认模型 `mimo-v2.5` |

**VisionOptions**: model, image, audio, video, prompt, fps, mediaResolution

**VisionResult**: id, content, model, usage

支持图像 URL、音频 data URI、视频 URL 等多模态输入，自动构建 `ContentPart[]`。

#### `asr.ts` — `ASRSDK`

| 方法 | 说明 |
|------|------|
| `transcribe(options)` | 语音识别，默认模型 `mimo-v2.5-asr` |

**ASROptions**: model, file (base64 data URI), language (auto/zh/en)

**ASRResult**: id, text, model, usage

通过 `asr_options` 字段传递语言设置。

#### `tts.ts` — `TTSSDK`

| 方法 | 说明 |
|------|------|
| `synthesize(options)` | 预设音色合成，默认模型 `mimo-v2.5-tts` |
| `clone(options)` | 语音克隆合成，默认模型 `mimo-v2.5-tts` |
| `design(options)` | 语音设计合成，默认模型 `mimo-v2.5-tts` |
| `voices()` | 获取可用音色列表 |

TTS 模块直接使用 `fetch` 调用 REST API（非 OpenAI SDK），端点为 `{baseUrl}/tts/synthesize`、`/tts/clone`、`/tts/design`、`/tts/voices`。

**TTSResult**: id, audio (Buffer), model

**TTSVoicesResult**: voices (TTSVoice[])

### 3.7 认证模块 (`src/auth/`)

#### `resolver.ts`

| 函数 | 说明 |
|------|------|
| `resolveCredential(config)` | 按优先级解析凭证：`--api-key` 标志 → `MIMO_API_KEY` 环境变量 → config.json 文件 |
| `inferBaseUrlFromKey(apiKey)` | 根据 API Key 前缀推断 base URL：`tp-` → TokenPlan 端点，其他 → `undefined`（使用默认） |

返回 `ResolvedCredential`: `{ token, method: 'api-key', source: 'flag'|'config.json'|'env' }`

**Base URL 自动推断规则**:
- `tp-` 前缀 → `https://token-plan-cn.xiaomimimo.com/v1`
- 其他前缀（`sk-` 等）→ 使用默认 `https://api.xiaomimimo.com/v1`

#### `setup.ts`

| 函数 | 说明 |
|------|------|
| `ensureAuth(config)` | 确保已认证，未认证时在交互模式下提示登录，非交互模式下抛出错误 |
| `persistApiKey(config, key)` | 将 API Key 持久化到 config.json，同时根据 Key 类型自动设置 base URL |
| `promptApiKey()` | 交互式输入 API Key（提示区分按量计费/TokenPlan 两种 Key 类型） |

**persistApiKey 行为**:
- TokenPlan Key (`tp-` 前缀): 自动设置 `base_url` 为 TokenPlan 端点
- 按量计费 Key: 自动设置 `base_url` 为标准 API 端点
- 输出时使用脱敏格式，显示 Key 类型和自动配置的 base URL

### 3.8 配置模块 (`src/config/`)

#### `paths.ts`

| 函数 | 说明 |
|------|------|
| `getConfigDir()` | 返回配置目录（`MIMO_CONFIG_DIR` 环境变量 或 `~/.mimo`） |
| `getConfigPath()` | 返回配置文件路径（`~/.mimo/config.json`） |
| `ensureConfigDir()` | 确保配置目录存在（权限 0o700） |

#### `schema.ts`

**ConfigFile 接口**（磁盘格式）:
- `api_key?`: API 密钥
- `base_url?`: 基础 URL
- `output?`: 输出格式 (text/json)
- `timeout?`: 超时秒数
- `default_model?`: 默认模型名
- `language?`: 界面语言 (zh/en)

**Config 接口**（运行时格式）:
- 继承 ConfigFile 字段，增加 `apiKey`、`fileApiKey`、`configPath`、`baseUrl`、`verbose`、`quiet`、`noColor`、`dryRun`、`nonInteractive`、`language`

`parseConfigFile(raw)`: 安全解析配置文件，忽略无效字段。

#### `loader.ts`

| 函数 | 说明 |
|------|------|
| `readConfigFile()` | 读取并解析配置文件，解析失败时输出警告并返回空对象 |
| `writeConfigFile(data)` | 原子写入配置文件（先写 .tmp 再 rename，权限 0o600） |
| `loadConfig(flags)` | 合并配置优先级：flags → 环境变量 → 配置文件 → 默认值 |

**loadConfig 特殊逻辑**:
- 当 `--api-key` flag 传入时，根据 key 前缀自动推断 base URL
- `--api-key` 推断优先于配置文件中的 `base_url`
- `NO_COLOR` 环境变量或非 TTY 环境自动禁用彩色输出

**默认 Base URL**: `https://api.xiaomimimo.com/v1`

### 3.9 错误体系 (`src/errors/`)

#### `base.ts` — `CLIError`

自定义错误类，包含 `exitCode` 和 `hint` 属性，支持 `toJSON()` 序列化。

#### `codes.ts` — `ExitCode`

| 退出码 | 值 | 说明 |
|--------|-----|------|
| SUCCESS | 0 | 成功 |
| GENERAL | 1 | 通用错误 |
| USAGE | 2 | 用法错误 |
| AUTH | 3 | 认证错误 |
| QUOTA | 4 | 配额不足 |
| TIMEOUT | 5 | 请求超时 |
| NETWORK | 6 | 网络错误 |
| CONTENT_FILTER | 10 | 内容过滤 |
| INVALID_INPUT | 11 | 无效输入（路径遍历等） |

#### `api.ts` — `mapApiError()`

将 HTTP 状态码映射为 `CLIError`，所有错误消息经过 `redactApiKeysInText()` 脱敏处理：
- 400 → USAGE, 401 → AUTH, 402 → QUOTA, 403 → AUTH, 404 → USAGE
- 421 → CONTENT_FILTER, 429 → QUOTA, 500/503 → NETWORK

#### `handler.ts` — `handleError()`

全局错误处理器，处理 `CLIError`、网络错误、文件系统错误、超时错误等，根据输出格式输出 JSON 或文本。所有输出均经过 API Key 脱敏处理。

**错误识别策略**:
- `AbortError` / `TimeoutError` → 超时错误
- `fetch failed` / `ECONNREFUSED` / `ENOTFOUND` 等 → 网络错误
- `proxy` 关键词 → 代理错误（特殊提示）
- `ENOENT` / `EACCES` / `ENOSPC` 等 → 文件系统错误
- `MIMO_VERBOSE=1` 时输出完整堆栈

### 3.10 输出模块 (`src/output/`)

#### `formatter.ts`

| 函数 | 说明 |
|------|------|
| `detectOutputFormat(config?)` | 检测输出格式：显式配置 → 非TTY默认json → 默认text |
| `formatOutput(data, config?)` | 格式化输出（根据格式选择 text/json） |
| `dryRun(config, body)` | dry-run 模式打印请求体 |

**OutputConfig 类型**: `string | { output?: string } | undefined`

#### `text.ts`

| 函数 | 说明 |
|------|------|
| `formatText(data)` | 文本格式化（支持字符串/对象/数组/表格） |
| `formatKeyValue(obj)` | 键值对格式化（支持嵌套对象和数组） |
| `formatTable(headers, rows)` | ASCII 表格格式化（自动列宽） |

#### `json.ts`

| 函数 | 说明 |
|------|------|
| `formatJson(data)` | JSON 格式化（2 空格缩进） |
| `formatErrorJson(error)` | 错误 JSON 格式化 |

#### `progress.ts`

| 函数/接口 | 说明 |
|-----------|------|
| `createSpinner(message)` | 创建旋转加载指示器（基于 @clack/prompts），返回 `Spinner` 接口 |
| `createProgressBar(total, message)` | 创建进度条（仅 TTY 环境输出），返回 `ProgressBar` 接口 |

**Spinner 接口**: `start()`, `stop(message?)`, `update(message)`

**ProgressBar 接口**: `update(current)`, `done()`

#### `reasoning.ts`

`formatReasoning(reasoning, content)`: 将思维链内容以灰色暗淡样式输出，正文正常输出。

#### `annotations.ts`

`formatAnnotations(annotations)`: 格式化网页搜索引用标注，输出编号 + 标题 + URL（青色）+ 摘要。

### 3.11 国际化模块 (`src/i18n/index.ts`)

**语言管理**:
- `getLocale()` / `setLocale(locale)`: 获取/设置当前语言
- `initLocale(configLang?)`: 从配置值或环境变量初始化语言，默认中文

**翻译函数**:
- `t(key, vars?)`: 获取翻译文本，支持模板变量替换（如 `{size}`, `{limit}`）

**翻译字典**: 包含约 80+ 个翻译键，覆盖以下分类：
- 主界面（用法/资源/全局参数/帮助提示）
- 命令帮助（用法/选项/示例/API 参考）
- 错误处理（通用/超时/网络/代理/文件系统）
- API 错误（400/401/402/403/404/421/429/500/503）
- 认证（登录/登出/Key 提示）
- 命令描述（所有命令的中英文描述）
- 视频理解错误（文件过大/Base64 超限/缺少媒体）
- Chat 错误（缺少消息/空消息/超长/流式失败）
- ASR 错误（缺少文件/请求失败）
- TTS 错误（缺少文本/超长/缺少样本/缺少描述/无效音色）
- Config 错误（无效键/类型验证）
- REPL 界面（提示/退出/清空）
- Spinner 状态（合成中/读取样本/克隆中/设计中）
- Language 命令（当前语言/切换/无效）

### 3.12 类型定义 (`src/types/`)

#### `api.ts` — API 请求/响应类型

| 类型 | 说明 |
|------|------|
| `ChatMessage` | 对话消息（role + content + reasoning_content + tool_calls + tool_call_id） |
| `ContentPart` | 多模态内容部分（TextPart / ImageUrlPart / InputAudioPart / VideoUrlPart） |
| `VideoUrlPart` | 视频内容部分（支持 fps 和 media_resolution 参数） |
| `ToolCall` | 工具调用（id + type + function） |
| `ChatRequest` | 对话请求参数（含 thinking/tools/audio/asr_options 等扩展） |
| `ToolDef` | 工具定义（function / web_search，含 max_keyword/force_search/limit/user_location） |
| `AudioOutputConfig` | 音频输出配置（format/voice/optimize_text_preview） |
| `ChatResponse` | 对话响应 |
| `ChatStreamDelta` | 流式响应 delta（含 reasoning_content/annotations） |
| `ChatStreamChunk` | 流式响应块 |
| `AudioData` | 音频响应数据（id + data + expires_at + transcript） |
| `Annotation` | 网页搜索引用标注（type + url + title + summary + site_name + publish_time + logo_url） |
| `Usage` | Token 用量统计（含 completion_tokens_details/prompt_tokens_details/web_search_usage/seconds） |
| `TTSVoice` | TTS 音色信息（name + voiceId + language + gender） |
| `MiMoChatCompletion` | MiMo 扩展的 ChatCompletion 响应（含 reasoning_content/audio/annotations） |
| `MiMoChatCompletionChunk` | MiMo 扩展的流式响应 chunk |

**类型安全辅助函数**:

| 函数 | 说明 |
|------|------|
| `extractDelta(delta)` | 从 OpenAI SDK delta 安全提取 MiMo 扩展字段 |
| `extractChunkUsage(chunk)` | 从 OpenAI SDK chunk 安全提取 usage 字段 |
| `abortStream(stream)` | 安全中止 OpenAI SDK Stream 对象 |
| `extractErrorUrl(err)` | 从 OpenAI APIError 安全提取 url 字段 |

#### `flags.ts` — 命令行标志类型

| 接口 | 说明 |
|------|------|
| `GlobalFlags` | 全局标志（apiKey/baseUrl/output/timeout/quiet/verbose/noColor/dryRun/nonInteractive/help/version） |
| `ChatFlags` | Chat 命令标志（含 search/forceSearch/maxKeyword/searchLimit/userCountry/userRegion/userCity） |
| `ReplFlags` | REPL 命令标志 |
| `VisionFlags` | Vision 命令标志 |
| `ASRFlags` | ASR 命令标志 |
| `TTSSynthesizeFlags` | TTS 合成标志 |
| `TTSCloneFlags` | TTS 克隆标志 |
| `TTSDesignFlags` | TTS 设计标志 |
| `TTSVoicesFlags` | TTS 音色列表标志（无特有 flags） |

#### `commands.ts` — 从 flags.ts 重新导出

保持向后兼容的重新导出模块。

### 3.13 工具函数 (`src/utils/`)

| 文件 | 函数 | 说明 |
|------|------|------|
| `audio.ts` | `audioFileToBase64DataUri(path)` | 音频文件转 Base64 Data URI（支持 wav/mp3） |
| `audio.ts` | `validateAudioFile(path, maxSizeMB?)` | 验证音频文件格式和大小（默认 10MB，含空文件检查） |
| `image.ts` | `localFileToDataUri(path)` | 图片文件转 Data URI（支持 jpg/jpeg/png/gif/webp/bmp，含空文件检查） |
| `image.ts` | `resolveImageInput(input)` | 解析图片输入（URL → 原样返回 / Data URI → 原样返回 / 本地文件 → 转 Data URI） |
| `video.ts` | `videoFileToBase64DataUri(path)` | 视频文件转 Base64 Data URI（支持 mp4/mov/avi/wmv） |
| `video.ts` | `validateVideoFile(path, maxSizeMB?)` | 验证视频文件格式和大小（默认 37.5MB） |
| `fs.ts` | `readTextFromPathOrStdin(path)` | 从文件或 stdin 读取文本（`-` 表示 stdin，含路径遍历防护） |
| `env.ts` | `isInteractive()` | 检测是否交互式终端（stdout.isTTY） |
| `env.ts` | `isCI()` | 检测是否 CI 环境（检查 14 种 CI 环境变量） |
| `prompt.ts` | `promptText(message, options?)` | 交互式文本输入（基于 @clack/prompts，含空输入检查） |
| `prompt.ts` | `promptConfirm(message)` | 交互式确认 |
| `prompt.ts` | `promptOrFail(message, config)` | 非交互模式下抛错，交互模式下提示输入 |
| `sanitize.ts` | `sanitizePath(inputPath, baseDir?)` | 路径遍历防护，验证路径不逃逸到基准目录外 |
| `sanitize.ts` | `maskApiKey(key)` | API Key 脱敏（前4位 + **** + 后4位） |
| `sanitize.ts` | `redactApiKeysInText(text)` | 文本中扫描并替换泄露的 API Key（匹配 sk-/tp- 开头 ≥20 字符） |
| `token.ts` | `maskToken(token)` | Token 遮蔽显示（短 token: 前2+...+后2，长 token: 前4+...+后4） |

**视频文件大小限制**:
- Base64 模式：原始文件 ≤ 37.5 MB（Base64 编码后 ≤ 50 MB），含二次校验
- URL 模式：API 侧限制 300 MB

---

## 4. 命令详解

### 4.1 `mimo chat`

单轮对话补全，支持流式输出、思维链、网页搜索（含位置信息）、JSON 模式。

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `-m, --message <text>` | 消息文本（必填，上限 100000 字符） | - |
| `--model <model>` | 模型名称 | mimo-v2.5-pro |
| `-s, --system <text>` | 系统提示词 | - |
| `--thinking` | 启用思维链 | - |
| `--search` | 启用网页搜索 | - |
| `--force-search` | 强制网页搜索 | - |
| `--max-keyword <n>` | 一轮搜索最大关键词数量 | - |
| `--search-limit <n>` | 搜索结果数量限制 | - |
| `--user-country <country>` | 用户位置：国家 | - |
| `--user-region <region>` | 用户位置：地区 | - |
| `--user-city <city>` | 用户位置：城市 | - |
| `--stream` | 流式输出 | true |
| `--no-stream` | 禁用流式输出 | - |
| `--json` | JSON 结构化输出 | - |
| `--max-tokens <n>` | 最大补全 Token 数 | - |
| `--temperature <n>` | 采样温度 | - |

**输入验证**: 空消息/纯空白消息 → USAGE 错误；超长消息（>100000 字符）→ USAGE 错误。

**流式输出**: 思维链内容以灰色暗淡样式实时输出，正文正常输出，搜索引用标注在末尾输出。

### 4.2 `mimo repl`

交互式多轮对话，支持 `/exit`、`/quit`、`/clear` 命令。

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `--model <model>` | 模型名称 | mimo-v2.5-pro |
| `--thinking` | 启用思维链 | - |
| `--search` | 启用网页搜索 | - |
| `-s, --system <text>` | 系统提示词 | - |

**对话历史**: 助手回复包含 `reasoning_content` 以避免后续请求 400 错误。请求失败时移除最后一条用户消息，允许对话继续。

### 4.3 `mimo vision`

多模态理解（图像/音频/视频），至少指定一种媒体输入。

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `--image <path\|url>` | 图片文件路径或 URL | - |
| `--audio <path\|url>` | 音频文件路径或 URL | - |
| `--video <path\|url>` | 视频文件路径或 URL | - |
| `-p, --prompt <text>` | 提问文本（必填） | - |
| `--model <model>` | 模型名称 | mimo-v2.5 |
| `--stream` | 流式输出 | true |
| `--no-stream` | 禁用流式输出 | - |
| `--fps <n>` | 视频帧率 | - |
| `--media-resolution <value>` | 视频分辨率 (default/max) | - |

**视频输入模式**:
- URL 模式：直接传入，API 侧限制 300 MB
- 本地文件模式：Base64 编码，原始文件 ≤ 37.5 MB（编码后 ≤ 50 MB），超限时友好提示改用 URL 模式

### 4.4 `mimo asr`

语音识别，支持 wav/mp3 音频文件。

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `<audio-file>` | 音频文件路径（位置参数） | - |
| `--language <lang>` | 语言 (auto/zh/en) | auto |
| `--stream` | 流式输出 | - |
| `--file <path>` | 音频文件路径（替代位置参数） | - |

**文件验证**: 格式检查（仅 wav/mp3）+ 大小检查（默认 10MB）+ 空文件检查。

### 4.5 `mimo tts synthesize`

预设音色语音合成。

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `-t, --text <text>` | 合成文本（必填，上限 5000 字符） | - |
| `--voice <id>` | 音色 ID | mimo_default |
| `--style <desc>` | 自然语言风格指令 | - |
| `--format <fmt>` | 音频格式 (wav/mp3/pcm) | wav |
| `-o, --out <path>` | 输出文件路径 | 自动生成（tts_output_YYYY-MM-DD-HH-mm-ss.ext） |

**可用音色**: mimo_default, 冰糖, 茉莉, 苏打, 白桦, Mia, Chloe, Milo, Dean

**输入验证**: 空文本/纯空白 → USAGE 错误；超长文本（>5000 字符）→ USAGE 错误；无效音色 → USAGE 错误。

**实现**: 通过 `chat/completions` 端点 + `audio` 参数实现，非独立 TTS 端点。

### 4.6 `mimo tts clone`

语音克隆合成，需提供参考音频样本。

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `--sample <path>` | 参考音频文件（必填，wav/mp3，≤10MB） | - |
| `-t, --text <text>` | 合成文本（必填） | - |
| `--format <fmt>` | 音频格式 | wav |
| `-o, --out <path>` | 输出文件路径 | 自动生成 |

**实现**: 使用 `mimo-v2.5-tts-voiceclone` 模型，参考音频作为 `audio.voice` 参数传入。

### 4.7 `mimo tts design`

语音设计合成，通过自然语言描述生成音色。

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `-p, --prompt <desc>` | 音色描述（必填） | - |
| `-t, --text <text>` | 合成文本（与 --optimize-text 二选一） | - |
| `--optimize-text` | 智能文本预览优化 | - |
| `--format <fmt>` | 音频格式 | wav |
| `-o, --out <path>` | 输出文件路径 | 自动生成 |

**实现**: 使用 `mimo-v2.5-tts-voicedesign` 模型，描述作为 user 消息传入。

### 4.8 管理命令

| 命令 | 说明 |
|------|------|
| `mimo auth login [--api-key <key>]` | 登录保存 API Key（自动识别按量计费/TokenPlan 并配置 base URL） |
| `mimo auth status` | 查看认证状态（含 Key 类型、base URL、凭证来源） |
| `mimo auth logout` | 登出清除 API Key |
| `mimo config show` | 显示当前配置（敏感字段脱敏） |
| `mimo config set --key <k> --value <v>` | 设置配置项（支持 api_key/base_url/output/timeout/default_model/language） |
| `mimo language <zh\|en>` | 切换界面语言（持久保存到配置文件） |
| `mimo update` | 自更新（未实现，提示从 GitHub 重新安装） |
| `mimo help [command]` | 显示帮助 |

---

## 5. 依赖关系

### 5.1 运行时依赖

| 依赖 | 版本 | 用途 |
|------|------|------|
| `openai` | ^4.95.0 | OpenAI SDK，用于 MiMo API 调用（兼容协议） |
| `@clack/prompts` | ^0.7.0 | 交互式终端 UI（spinner、text input、confirm） |
| `es-toolkit` | ^1.46.1 | 实用工具函数库 |
| `undici` | ^6.21.1 | HTTP 客户端（构建时 external） |

### 5.2 开发依赖

| 依赖 | 版本 | 用途 |
|------|------|------|
| `typescript` | ^5.8.3 | TypeScript 编译器 |
| `@types/bun` | latest | Bun 类型定义 |
| `bun-plugin-dts` | ^0.4.0 | DTS 声明文件生成插件 |
| `eslint` | ^9.24.0 | 代码检查 |
| `@eslint/js` | ^9.0.0 | ESLint JS 配置 |
| `typescript-eslint` | ^8.58.0 | TypeScript ESLint 插件 |

### 5.3 模块间依赖关系

```
main.ts
  ├── command.ts (Command, OptionDef, defineCommand, GLOBAL_OPTIONS)
  ├── registry.ts (CommandRegistry)
  ├── args.ts (scanCommandPath, parseFlags)
  ├── config/loader.ts (loadConfig)
  ├── auth/setup.ts (ensureAuth)
  ├── errors/handler.ts (handleError)
  ├── i18n/index.ts (initLocale, t)
  └── commands/* (各命令实现)
        ├── client/index.ts (MiMoClient, createClient)
        │     └── client/errors.ts (wrapApiError)
        ├── sdk/* (ChatSDK, VisionSDK, ASRSDK, TTSSDK)
        │     └── sdk/client.ts (MiMoSDKClient)
        ├── output/* (formatter, text, json, progress, reasoning, annotations)
        ├── utils/* (audio, image, video, fs, env, prompt, sanitize, token)
        ├── auth/* (resolver, setup)
        ├── config/* (loader, schema, paths)
        ├── errors/* (base, codes, api, handler)
        ├── i18n/index.ts (t)
        └── types/* (api, flags, commands)
```

---

## 6. 环境变量

| 变量 | 说明 |
|------|------|
| `MIMO_API_KEY` | API 密钥 |
| `MIMO_API_TOKEN` | API Token（备用） |
| `MIMO_BASE_URL` | API 基础 URL |
| `MIMO_CONFIG_DIR` | 配置目录路径（默认 `~/.mimo`） |
| `MIMO_OUTPUT` | 输出格式 (text/json) |
| `MIMO_TIMEOUT` | 请求超时秒数 |
| `MIMO_VERBOSE` | 详细日志模式（设为 `1` 启用） |
| `NO_COLOR` | 禁用彩色输出 |
| `HTTPS_PROXY` / `HTTP_PROXY` | 代理设置 |
| `CLI_VERSION` | 覆盖版本号 |
| `LANG` / `LC_ALL` / `LC_MESSAGES` | 系统语言检测（用于 i18n 初始化） |

---

## 7. 项目运行方式

### 7.1 开发模式

```bash
# 安装依赖
bun install

# 开发运行
bun run dev

# 类型检查
bun run typecheck

# 代码检查
bun run lint

# 运行测试
bun test
```

### 7.2 构建

```bash
# 生产构建
bun run build

# 开发构建（未压缩）
bun run build:dev
```

构建产出两个文件：
- `dist/mimo.mjs` — CLI 打包产物（minify，external undici，自动添加 `#!/usr/bin/env node` shebang）
- `dist/sdk.mjs` — SDK 打包产物（未压缩，external undici + openai）

**构建配置** (`build.ts`):
- target: `node`
- format: `esm`
- sourcemap: `true`
- CLI 产物: minify（生产模式）
- SDK 产物: 不压缩，openai 作为 external 依赖
- 版本号: 从 `npm_package_version` 环境变量注入，回退到 `0.1.0`

### 7.3 全局安装使用

```bash
# npm 全局链接（开发推荐）
npm link

# 或直接安装
npm install -g .

# 使用
mimo chat -m "Hello"
mimo repl
mimo vision --image photo.jpg -p "描述这张图片"
mimo asr recording.wav
mimo tts synthesize -t "你好世界"
mimo language en
```

### 7.4 SDK 编程使用

```typescript
import { MiMoSDK } from 'mimo-cli/sdk';

const sdk = new MiMoSDK({ apiKey: 'sk-xxx' });

// 对话
const result = await sdk.chat.chat({
  messages: [{ role: 'user', content: 'Hello' }],
  stream: false,
});

// 流式对话
for await (const chunk of sdk.chat.chatStream({
  messages: [{ role: 'user', content: 'Hello' }],
})) {
  process.stdout.write(chunk.choices[0]?.delta?.content ?? '');
}

// 多模态理解
const vision = await sdk.vision.describe({
  image: 'https://example.com/photo.jpg',
  prompt: '描述这张图片',
});

// 语音识别
const asr = await sdk.asr.transcribe({
  file: 'data:audio/wav;base64,...',
  language: 'zh',
});

// 语音合成
const tts = await sdk.tts.synthesize({
  text: '你好世界',
  voice: '茉莉',
  format: 'mp3',
});

// 语音克隆
const clone = await sdk.tts.clone({
  sample: 'data:audio/wav;base64,...',
  text: '你好世界',
  format: 'wav',
});

// 语音设计
const design = await sdk.tts.design({
  prompt: '温柔的女声，语速较慢',
  text: '你好世界',
  format: 'mp3',
});

// 获取可用音色
const voices = await sdk.tts.voices();
```

---

## 8. 配置文件

配置文件位于 `~/.mimo/config.json`，格式如下：

```json
{
  "api_key": "sk-xxxxxxxx",
  "base_url": "https://api.xiaomimimo.com/v1",
  "output": "text",
  "timeout": 300,
  "default_model": "mimo-v2.5-pro",
  "language": "zh"
}
```

**配置优先级**（从高到低）：
1. 命令行标志（`--api-key`、`--base-url` 等）
2. 环境变量（`MIMO_API_KEY`、`MIMO_BASE_URL` 等）
3. 配置文件（`~/.mimo/config.json`）
4. 内置默认值

**特殊行为**:
- `--api-key` flag 传入时，根据 key 前缀自动推断 base URL（覆盖配置文件中的 URL）
- `mimo auth login` 保存 API Key 时，自动根据 key 类型设置对应的 base URL
- 配置文件写入采用原子操作（先写 .tmp 再 rename），权限 0o600

---

## 9. API 端点

| 端点 | 方法 | 说明 | 使用方式 |
|------|------|------|----------|
| `/chat/completions` | POST | 对话补全（OpenAI 兼容） | MiMoClient / CLI chat/repl/vision/asr/tts synthesize/clone/design |
| `/tts/synthesize` | POST | TTS 预设音色合成 | TTSSDK.synthesize (fetch) |
| `/tts/clone` | POST | TTS 语音克隆合成 | TTSSDK.clone (fetch) |
| `/tts/design` | POST | TTS 语音设计合成 | TTSSDK.design (fetch) |
| `/tts/voices` | GET | 获取可用 TTS 音色列表 | TTSSDK.voices (fetch) |

**默认 Base URL**: `https://api.xiaomimimo.com/v1`（按量计费 Key，`sk-` 前缀）/ `https://token-plan-cn.xiaomimimo.com/v1`（TokenPlan Key，`tp-` 前缀）

**注意**: CLI 的 `tts synthesize`/`tts clone`/`tts design` 命令通过 `/chat/completions` 端点 + `audio` 参数实现（使用 MiMoClient），而 SDK 的 TTSSDK 使用独立的 `/tts/*` REST 端点（使用 fetch）。

---

## 10. 默认模型

| 能力 | 模型名 | 使用场景 |
|------|--------|----------|
| 对话 | `mimo-v2.5-pro` | chat / repl 命令默认 |
| 多模态 | `mimo-v2.5` | vision 命令默认 |
| 语音识别 | `mimo-v2.5-asr` | asr 命令默认 |
| TTS 合成 | `mimo-v2.5-tts` | tts synthesize 命令默认 |
| TTS 克隆 | `mimo-v2.5-tts-voiceclone` | tts clone 命令默认 |
| TTS 设计 | `mimo-v2.5-tts-voicedesign` | tts design 命令默认 |
| SDK 对话 | `MiMo-7B-RL` | ChatSDK 默认 |
| SDK 多模态 | `mimo-v2.5` | VisionSDK 默认 |
| SDK ASR | `mimo-v2.5-asr` | ASRSDK 默认 |
| SDK TTS | `mimo-v2.5-tts` | TTSSDK 默认 |

---

## 11. 安全设计

### 11.1 API Key 脱敏

- `maskApiKey()`: 输出时脱敏（前4位 + **** + 后4位）
- `redactApiKeysInText()`: 自动扫描文本中的 API Key 并替换
- `maskToken()`: Token 显示遮蔽
- 所有错误输出均经过脱敏处理，防止 API Key 泄露

### 11.2 路径安全

- `sanitizePath()`: 路径遍历防护，验证文件路径不逃逸到基准目录外
- `readTextFromPathOrStdin()`: 使用 `sanitizePath()` 验证输入路径

### 11.3 配置文件安全

- 写入权限: 0o600（仅所有者可读写）
- 配置目录权限: 0o700（仅所有者可访问）
- 原子写入: 先写 .tmp 再 rename，防止写入中断导致配置损坏

### 11.4 输入验证

- Chat 消息: 空消息/纯空白 → 拒绝；超长消息（>100000 字符）→ 拒绝
- TTS 文本: 空文本/纯空白 → 拒绝；超长文本（>5000 字符）→ 拒绝
- TTS 音色: 无效音色 ID → 拒绝
- Config key: 仅允许字母/数字/下划线；仅允许白名单内的 key
- 音频/视频文件: 格式检查 + 大小检查 + 空文件检查
