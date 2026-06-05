<p align="center">
  <a href="https://www.npmjs.com/package/mimo-cli">
    <img src="https://img.shields.io/npm/v/mimo-cli.svg" alt="npm version">
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/github/license/ljj6600/MIMO-CLI" alt="License">
  </a>
  <a href="https://nodejs.org/">
    <img src="https://img.shields.io/badge/node-%3E%3D18-brightgreen" alt="Node >= 18">
  </a>
</p>

<h1 align="center">MiMo CLI</h1>
<p align="center"><b>不用写一行代码，帮助你的 Agent 拥有 MiMo 的全部能力。</b></p>
<p align="center">MiMo AI Platform 命令行工具 — 对话、多模态理解、语音识别与合成，一键接入小米大模型。</p>

<p align="center">
  <a href="#安装">安装</a> ·
  <a href="#快速开始">快速开始</a> ·
  <a href="#命令参考">命令参考</a> ·
  <a href="#agent-集成">Agent 集成</a> ·
  <a href="#sdk-编程接口">SDK 编程接口</a> ·
  <a href="#默认模型">默认模型</a> ·
  <a href="#配置">配置</a> ·
  <a href="#安全">安全</a>
</p>

---

## 安装和配置 CLI

### 通过 Agent 安装

请将以下提示词复制给你的 AI Agent（OpenClaw、Claude Code、Cursor、MaxClaw、AutoClaw、KimiClaw、TRAE、OpenCode 等），它会引导你完成安装、登录与 SKILL 接入（请将 `sk-xxxxx` 替换为你的实际密钥）：

```
请帮我接入 MiMo CLI（`https://github.com/ljj6600/MIMO-CLI`），按以下三步完成安装与配置：

1. 全局安装 CLI：执行 `npm install -g mimo-cli`，完成后用 `mimo --version` 验证
2. 登录并配置 API Key：执行 `mimo auth login --api-key sk-xxxxx`
3. 安装官方 SKILL：执行 `npx skills add ljj6600/MIMO-CLI -y -g`
```

### 手动安装

#### 1. 安装 MiMo-CLI

在终端运行以下命令完成全局安装：

```bash
npm install -g mimo-cli
```

> 需要 [Node.js](https://nodejs.org/) 18+。

#### 2. 登录 API Key

使用 API Key 完成鉴权（请将 `sk-xxxxx` 替换为你的 Key）：

```bash
mimo auth login --api-key sk-xxxxx
```

支持两种 Key 类型，前往 [MiMo 平台](https://platform.xiaomimimo.com) 获取：
- **TokenPlan Key**（`tp-` 前缀）→ [申请地址](https://platform.xiaomimimo.com/console/plan-manage)，自动配置 `https://token-plan-cn.xiaomimimo.com/v1`
- **按量计费 Key**（`sk-` 前缀）→ [申请地址](https://platform.xiaomimimo.com/console/api-keys)，自动配置 `https://api.xiaomimimo.com/v1`

最新版 mimo-cli 会根据 Key 前缀自动检测并配置对应的 Base URL。

#### 3. 安装 SKILL（可选，推荐 Agent 用户）

若你要在 Claude Code、OpenClaw、Cursor 等 AI Agent 中调用 mimo，建议加装官方 SKILL.md，Agent 调用时决策更准、无需临时翻 `--help`：

```bash
npx skills add ljj6600/MIMO-CLI -y -g
```

SKILL 会自动 symlink 到 `~/.claude/skills/`、`~/.openclaw/skills/` 等目录，各 Agent 下次启动即可识别。仅在终端直接使用 mimo 命令的用户可以跳过此步。

## 新用户福利

如果您是 **3 天内** 注册 Xiaomi MiMo 开放平台的新用户，可享受专属福利：

> 🎁 通过邀请码注册，即得 **¥10 API 体验金**（40 天有效）

**三步快速领取：**

1. 点击注册链接：[https://platform.xiaomimimo.com?ref=6MEWY6](https://platform.xiaomimimo.com?ref=6MEWY6)
2. 完成账号注册
3. 登录后，在控制台左下方「邀请码」入口处填入：`6MEWY6`

体验金可用于 MiMo 全部模型能力，包括对话、多模态理解、语音识别与合成等。

---

## 快速开始

### 开箱即用

```bash
# 对话
mimo chat -m "你好，介绍一下你自己"

# 交互式多轮对话
mimo repl

# 思维链推理
mimo chat -m "分析一下量子计算的前景" --thinking

# 联网搜索
mimo chat -m "今天北京天气怎么样" --search

# 图片理解
mimo vision --image photo.jpg -p "描述这张图片"

# 视频理解（URL 模式，支持最大 300MB）
mimo vision --video https://example.com/video.mp4 -p "描述这个视频"

# 语音识别
mimo asr recording.wav

# 语音合成
mimo tts synthesize -t "你好世界" --voice 茉莉 --format mp3

# 声音克隆
mimo tts clone --sample voice.wav -t "这是克隆语音"

# 音色设计
mimo tts design --prompt "温柔的女声，语速较慢" -t "你好世界"

# 切换界面语言
mimo language en
mimo language zh
```

## 功能特性

- **对话补全** — 单轮/多轮对话，支持思维链、联网搜索（含地理位置）
- **多模态理解** — 图片、音频、视频内容理解（URL 模式最大 300MB）
- **语音识别 (ASR)** — wav/mp3 音频转文字，支持流式输出
- **语音合成 (TTS)** — 预设音色合成 / 声音克隆 / 自定义音色设计
- **深度思考** — `--thinking` 参数启用推理过程展示
- **联网搜索** — `--search` 参数，支持位置感知和关键词控制
- **流式输出** — 实时逐 token 输出，所见即所得
- **双 Key 管理** — 按量计费与 TokenPlan Key 一键切换
- **中英文界面** — `mimo language en` 一键切换
- **安全第一** — API Key 本地加密、输出自动脱敏、路径遍历防护

## 命令参考

### `mimo chat`

单轮对话补全，支持深度思考和联网搜索。

```bash
mimo chat -m "你好"                                 # 基础对话
mimo chat -m "分析量子计算" --thinking                # 深度思考
mimo chat -m "今天天气" --search --user-city 武汉      # 联网搜索
mimo chat -m "返回 JSON" --json --no-stream           # 结构化输出
mimo chat -m "写代码" --system "你是 Go 专家"          # 系统提示词
```

### `mimo repl`

交互式多轮对话，维护对话历史。

```bash
mimo repl                                           # 启动交互对话
mimo repl --thinking --system "你是编程助手"          # 带系统提示词
mimo repl --search                                  # 联网搜索模式
```

### `mimo vision`

多模态理解 — 图片、音频、视频。

```bash
mimo vision --image photo.jpg -p "描述这张图片"                # 图片理解
mimo vision --audio speech.mp3 -p "转述这段音频"               # 音频理解
mimo vision --video clip.mp4 -p "总结视频内容" --fps 1         # 视频理解（本地文件）
mimo vision --video https://example.com/v.mp4 -p "描述"       # 视频理解（URL 模式）
mimo vision --image a.jpg --audio b.mp3 -p "比较两者"         # 多模态组合
```

### `mimo asr`

语音识别 — 音频转文字。

```bash
mimo asr recording.wav                                # 基础语音识别
mimo asr audio.mp3 --language zh                      # 指定语言
mimo asr --file recording.wav --language en            # 使用 --file 参数
mimo asr speech.wav --stream                          # 流式输出
```

### `mimo tts`

语音合成 — 生成自然语音。

```bash
mimo tts synthesize -t "你好世界"                                 # 基础合成
mimo tts synthesize -t "Hello" --voice Mia --format mp3           # 指定音色和格式
mimo tts synthesize -t "温柔地说" --style "温柔、缓慢" --voice 茉莉 # 风格控制
mimo tts synthesize -t "文本" --out output.mp3                    # 指定输出路径
mimo tts voices                                                    # 列出可用音色
mimo tts clone --sample reference.wav -t "克隆语音"                # 声音克隆
mimo tts design --prompt "温柔的女声" -t "你好世界"                # 音色设计
```

### `mimo auth` · `mimo config`

```bash
mimo auth login                    # 登录（保存 API Key）
mimo auth login --api-key sk-xxx   # 非交互式登录
mimo auth status                   # 查看认证状态
mimo auth logout                   # 登出

mimo config show                   # 查看当前配置
mimo config set --key timeout --value 600  # 设置超时
mimo config set --key active_key --value sk # 切换 Key
```

### `mimo language` · `mimo update`

```bash
mimo language zh                   # 切换为中文界面
mimo language en                   # 切换为英文界面
mimo update                        # 检查并更新到最新版本
```

## SDK 编程接口

如果你需要将 MiMo 能力集成到自己的 TypeScript/JavaScript 项目中，`mimo-cli` 也提供了完整的编程 SDK。

```typescript
import { MiMoSDK } from 'mimo-cli/sdk';

const sdk = new MiMoSDK({ apiKey: 'sk-xxx' });

// 对话
const result = await sdk.chat.chat({
  messages: [{ role: 'user', content: 'Hello' }],
  stream: false,
});

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
```

SDK 与 CLI 共享同一底层 API 客户端，调用方式一致，能力完全对齐。

## 默认模型

| 能力 | 模型 | 说明 |
|------|------|------|
| 对话 | `mimo-v2.5-pro` | 常规对话、复杂推理、深度分析、长文档处理 |
| 多模态 | `mimo-v2.5` | 图片/音频/视频内容理解 |
| 语音识别 | `mimo-v2.5-asr` | 语音转文字 |
| 语音合成 | `mimo-v2.5-tts` | 文字转语音 |
| 声音克隆 | `mimo-v2.5-tts-voiceclone` | 基于参考音频克隆声音 |
| 音色设计 | `mimo-v2.5-tts-voicedesign` | 自然语言描述生成音色 |

## 配置

配置文件位于 `~/.mimo/config.json`：

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

**配置优先级**：命令行标志 > 环境变量 > 配置文件 > 内置默认值

### 环境变量

| 变量 | 说明 |
|------|------|
| `MIMO_API_KEY` | API 密钥 |
| `MIMO_BASE_URL` | API 基础 URL |
| `MIMO_CONFIG_DIR` | 配置目录（默认 `~/.mimo`） |
| `MIMO_OUTPUT` | 输出格式 (text/json) |
| `MIMO_TIMEOUT` | 请求超时秒数 |
| `HTTPS_PROXY` | 代理设置 |

## 安全

- API Key 仅存储在本地 `~/.mimo/config.json`，权限 0o600
- 所有输出自动脱敏，防止 API Key 泄露
- 文件路径遍历防护
- 视频文件大小检测（Base64 ≤ 37.5MB / URL ≤ 300MB）

## 开发

```bash
# 安装依赖
bun install

# 开发运行（不构建，直接执行 TypeScript）
bun run dev

# 构建（输出到 dist/）
bun run build

# 类型检查
bun run typecheck

# 代码检查
bun run lint
```

## 架构

mimo-cli 采用四层架构设计：

```
CLI 层 (Commands)         ← 你执行的 mimo xxx 命令
SDK 层 (编程接口)          ← 你也可以用 TypeScript 调用
API 客户端层 (Client)      ← OpenAI 兼容协议，一键切换
MiMo AI Platform API      ← 小米大模型能力
```

## License

[MIT](LICENSE)
