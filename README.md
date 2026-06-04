# MiMo CLI

MiMo AI 平台命令行工具 — 对话、多模态理解、语音识别与合成，一键接入小米大模型。

[![npm version](https://img.shields.io/npm/v/mimo-cli.svg)](https://www.npmjs.com/package/mimo-cli)
[![License](https://img.shields.io/github/license/ljj6600/MIMO-CLI)](https://github.com/ljj6600/MIMO-CLI/blob/main/LICENSE)

## 特性

- **对话补全** — 单轮对话 / 交互式多轮对话，支持思维链、联网搜索
- **多模态理解** — 图片、音频、视频内容理解
- **语音识别 (ASR)** — wav/mp3 音频转文字
- **语音合成 (TTS)** — 预设音色合成 / 声音克隆 / 自定义音色设计
- **中英文界面** — 默认中文，`mimo language en` 一键切换
- **API Key 自动识别** — 按量计费 (`sk-`) / TokenPlan (`tp-`) 自动推断 Base URL
- **双 Key 管理** — 同时配置按量计费和 TokenPlan Key，一键切换
- **自动更新** — `mimo update` 检查并更新到最新版本
- **安全脱敏** — API Key 本地加密存储、输出脱敏、路径遍历防护

## 快速开始

### 安装

```bash
npm install -g mimo-cli
```

### 登录

```bash
mimo auth login --api-key <your-api-key>
```

支持两种 API Key：
- **按量计费 Key**（`sk-` 前缀）→ 自动配置 `https://api.xiaomimimo.com/v1`
- **TokenPlan Key**（`tp-` 前缀）→ 自动配置 `https://token-plan-cn.xiaomimimo.com/v1`

### 使用

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

## 命令一览

| 命令 | 说明 |
|------|------|
| `mimo chat` | 单轮对话补全 |
| `mimo repl` | 交互式多轮对话 |
| `mimo vision` | 多模态理解（图片/音频/视频） |
| `mimo asr` | 语音识别 |
| `mimo tts synthesize` | 预设音色语音合成 |
| `mimo tts clone` | 声音克隆 |
| `mimo tts design` | 音色设计 |
| `mimo tts voices` | 列出可用音色 |
| `mimo auth login` | 登录（保存 API Key） |
| `mimo auth status` | 查看认证状态 |
| `mimo auth logout` | 登出 |
| `mimo config show` | 显示当前配置 |
| `mimo config set` | 设置配置项 |
| `mimo language` | 切换界面语言 (zh/en) |

## 默认模型

| 能力 | 模型 | 说明 |
|------|------|------|
| 对话 | `mimo-v2.5-pro` | 常规对话、复杂推理、深度分析 |
| 多模态 | `mimo-v2.5` | 图片/音频/视频内容理解 |
| 语音识别 | `mimo-v2.5-asr` | 语音转文字 |
| 语音合成 | `mimo-v2.5-tts` | 文字转语音 |
| 声音克隆 | `mimo-v2.5-tts-voiceclone` | 基于参考音频克隆声音 |
| 音色设计 | `mimo-v2.5-tts-voicedesign` | 自然语言描述生成音色 |

## SDK 编程接口

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

## 开发

```bash
# 安装依赖
bun install

# 开发运行
bun run dev

# 构建
bun run build

# 类型检查
bun run typecheck

# 代码检查
bun run lint
```

## 安全

- API Key 仅存储在本地 `~/.mimo/config.json`，权限 0o600
- 所有输出自动脱敏，防止 API Key 泄露
- 文件路径遍历防护
- 视频文件大小检测（Base64 ≤ 37.5MB / URL ≤ 300MB）

## License

[MIT](LICENSE)
