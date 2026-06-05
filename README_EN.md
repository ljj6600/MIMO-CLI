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
<p align="center"><b>Give your Agent the full power of MiMo — without writing a single line of code.</b></p>
<p align="center">The command-line tool for the MiMo AI Platform — chat, multimodal understanding, speech recognition & synthesis, all in one click.</p>

<p align="center">
  <a href="#installation">Installation</a> ·
  <a href="#quick-start">Quick Start</a> ·
  <a href="#command-reference">Command Reference</a> ·
  <a href="#agent-integration">Agent Integration</a> ·
  <a href="#sdk-programmatic-api">SDK Programmatic API</a> ·
  <a href="#default-models">Default Models</a> ·
  <a href="#configuration">Configuration</a> ·
  <a href="#security">Security</a>
</p>

---

## Installation & Setup

### Install via Agent

Copy the following prompt to your AI Agent (OpenClaw, Claude Code, Cursor, MaxClaw, AutoClaw, KimiClaw, TRAE, OpenCode, etc.) and it will guide you through installation, login, and SKILL setup (replace `sk-xxxxx` with your actual key):

```
Please help me set up MiMo CLI (https://github.com/ljj6600/MIMO-CLI) by completing these three steps:

1. Install the CLI globally: run `npm install -g mimo-cli`, then verify with `mimo --version`
2. Log in and configure your API Key: run `mimo auth login --api-key sk-xxxxx`
3. Install the official SKILL: run `npx skills add ljj6600/MIMO-CLI -y -g`
```

### Manual Installation

#### 1. Install MiMo-CLI

Run the following command in your terminal to install globally:

```bash
npm install -g mimo-cli
```

> Requires [Node.js](https://nodejs.org/) 18+.

#### 2. Log in with Your API Key

Authenticate using your API Key (replace `sk-xxxxx` with your actual key):

```bash
mimo auth login --api-key sk-xxxxx
```

Two key types are supported — get yours from the [MiMo Platform](https://platform.xiaomimimo.com):
- **TokenPlan Key** (`tp-` prefix) → [Apply here](https://platform.xiaomimimo.com/console/plan-manage), auto-configures `https://token-plan-cn.xiaomimimo.com/v1`
- **Pay-as-you-go Key** (`sk-` prefix) → [Apply here](https://platform.xiaomimimo.com/console/api-keys), auto-configures `https://api.xiaomimimo.com/v1`

The latest version of mimo-cli automatically detects the key prefix and configures the corresponding Base URL.

#### 3. Install SKILL (Optional, Recommended for Agent Users)

If you plan to use mimo inside AI Agents like Claude Code, OpenClaw, or Cursor, installing the official SKILL.md is recommended — it helps the Agent make better decisions without having to look up `--help` each time:

```bash
npx skills add ljj6600/MIMO-CLI -y -g
```

The SKILL is automatically symlinked to directories like `~/.claude/skills/` and `~/.openclaw/skills/`, so Agents can pick it up on the next launch. You can skip this step if you only use mimo commands directly in the terminal.

## New User Bonus

If you registered on the Xiaomi MiMo Open Platform within the **last 3 days**, you're eligible for an exclusive bonus:

> 🎁 Register with an invitation code and receive **¥10 in API credits** (valid for 40 days)

**Three steps to claim:**

1. Click the registration link: [https://platform.xiaomimimo.com?ref=6MEWY6](https://platform.xiaomimimo.com?ref=6MEWY6)
2. Complete account registration
3. After logging in, enter the invitation code `6MEWY6` in the "Invitation Code" section at the bottom left of the console

The credits can be used across all MiMo model capabilities, including chat, multimodal understanding, speech recognition, and synthesis.

---

## Quick Start

### Out of the Box

```bash
# Chat
mimo chat -m "Hello, introduce yourself"

# Interactive multi-turn conversation
mimo repl

# Chain-of-thought reasoning
mimo chat -m "Analyze the prospects of quantum computing" --thinking

# Web search
mimo chat -m "What's the weather like in Beijing today?" --search

# Image understanding
mimo vision --image photo.jpg -p "Describe this image"

# Video understanding (URL mode, up to 300MB)
mimo vision --video https://example.com/video.mp4 -p "Describe this video"

# Speech recognition
mimo asr recording.wav

# Text-to-speech
mimo tts synthesize -t "Hello world" --voice Jasmine --format mp3

# Voice cloning
mimo tts clone --sample voice.wav -t "This is cloned speech"

# Voice design
mimo tts design --prompt "A gentle female voice, slow pace" -t "Hello world"

# Switch interface language
mimo language en
mimo language zh
```

## Features

- **Chat Completion** — Single-turn and multi-turn conversations with chain-of-thought and web search (with geolocation)
- **Multimodal Understanding** — Image, audio, and video content understanding (URL mode supports up to 300MB)
- **Speech Recognition (ASR)** — wav/mp3 audio to text with streaming output
- **Text-to-Speech (TTS)** — Preset voice synthesis / voice cloning / custom voice design
- **Deep Thinking** — Use `--thinking` to display the reasoning process
- **Web Search** — `--search` flag with location awareness and keyword control
- **Streaming Output** — Real-time token-by-token output
- **Dual Key Management** — Switch between pay-as-you-go and TokenPlan keys with one command
- **Bilingual Interface** — Switch with `mimo language en`
- **Security First** — Local API Key encryption, automatic output sanitization, path traversal protection

## Command Reference

### `mimo chat`

Single-turn chat completion with deep thinking and web search support.

```bash
mimo chat -m "Hello"                                    # Basic chat
mimo chat -m "Analyze quantum computing" --thinking      # Deep thinking
mimo chat -m "Today's weather" --search --user-city Wuhan # Web search
mimo chat -m "Return JSON" --json --no-stream            # Structured output
mimo chat -m "Write code" --system "You are a Go expert" # System prompt
```

### `mimo repl`

Interactive multi-turn conversation with conversation history.

```bash
mimo repl                                               # Start interactive chat
mimo repl --thinking --system "You are a coding assistant" # With system prompt
mimo repl --search                                      # Web search mode
```

### `mimo vision`

Multimodal understanding — images, audio, and video.

```bash
mimo vision --image photo.jpg -p "Describe this image"             # Image understanding
mimo vision --audio speech.mp3 -p "Summarize this audio"           # Audio understanding
mimo vision --video clip.mp4 -p "Summarize the video" --fps 1      # Video understanding (local file)
mimo vision --video https://example.com/v.mp4 -p "Describe"        # Video understanding (URL mode)
mimo vision --image a.jpg --audio b.mp3 -p "Compare the two"       # Multimodal combination
```

### `mimo asr`

Speech recognition — audio to text.

```bash
mimo asr recording.wav                                  # Basic speech recognition
mimo asr audio.mp3 --language zh                        # Specify language
mimo asr --file recording.wav --language en              # Use --file flag
mimo asr speech.wav --stream                            # Streaming output
```

### `mimo tts`

Text-to-speech — generate natural speech.

```bash
mimo tts synthesize -t "Hello world"                               # Basic synthesis
mimo tts synthesize -t "Hello" --voice Mia --format mp3            # Specify voice and format
mimo tts synthesize -t "Speak gently" --style "gentle, slow" --voice Jasmine # Style control
mimo tts synthesize -t "Text" --out output.mp3                     # Specify output path
mimo tts voices                                                     # List available voices
mimo tts clone --sample reference.wav -t "Cloned speech"            # Voice cloning
mimo tts design --prompt "A gentle female voice" -t "Hello world"  # Voice design
```

### `mimo auth` · `mimo config`

```bash
mimo auth login                    # Log in (save API Key)
mimo auth login --api-key sk-xxx   # Non-interactive login
mimo auth status                   # Check auth status
mimo auth logout                   # Log out

mimo config show                   # Show current configuration
mimo config set --key timeout --value 600  # Set timeout
mimo config set --key active_key --value sk # Switch key
```

### `mimo language` · `mimo update`

```bash
mimo language zh                   # Switch to Chinese interface
mimo language en                   # Switch to English interface
mimo update                        # Check and update to the latest version
```

## SDK Programmatic API

If you need to integrate MiMo capabilities into your own TypeScript/JavaScript project, `mimo-cli` also provides a full programmatic SDK.

```typescript
import { MiMoSDK } from 'mimo-cli/sdk';

const sdk = new MiMoSDK({ apiKey: 'sk-xxx' });

// Chat
const result = await sdk.chat.chat({
  messages: [{ role: 'user', content: 'Hello' }],
  stream: false,
});

// Multimodal understanding
const vision = await sdk.vision.describe({
  image: 'https://example.com/photo.jpg',
  prompt: 'Describe this image',
});

// Speech recognition
const asr = await sdk.asr.transcribe({
  file: 'data:audio/wav;base64,...',
  language: 'zh',
});

// Text-to-speech
const tts = await sdk.tts.synthesize({
  text: 'Hello world',
  voice: 'Jasmine',
  format: 'mp3',
});
```

The SDK shares the same underlying API client as the CLI — the calling conventions are consistent and capabilities are fully aligned.

## Default Models

| Capability | Model | Description |
|------------|-------|-------------|
| Chat | `mimo-v2.5-pro` | General conversation, complex reasoning, deep analysis, long document processing |
| Multimodal | `mimo-v2.5` | Image/audio/video content understanding |
| Speech Recognition | `mimo-v2.5-asr` | Speech to text |
| Text-to-Speech | `mimo-v2.5-tts` | Text to speech |
| Voice Cloning | `mimo-v2.5-tts-voiceclone` | Clone a voice from a reference audio sample |
| Voice Design | `mimo-v2.5-tts-voicedesign` | Generate a custom voice from a natural language description |

## Configuration

The configuration file is located at `~/.mimo/config.json`:

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

**Configuration priority**: CLI flags > Environment variables > Config file > Built-in defaults

### Environment Variables

| Variable | Description |
|----------|-------------|
| `MIMO_API_KEY` | API key |
| `MIMO_BASE_URL` | API base URL |
| `MIMO_CONFIG_DIR` | Configuration directory (default: `~/.mimo`) |
| `MIMO_OUTPUT` | Output format (text/json) |
| `MIMO_TIMEOUT` | Request timeout in seconds |
| `HTTPS_PROXY` | Proxy settings |

## Security

- API Keys are stored locally in `~/.mimo/config.json` with 0o600 permissions
- All output is automatically sanitized to prevent API Key leaks
- File path traversal protection
- Video file size validation (Base64 ≤ 37.5MB / URL ≤ 300MB)

## Development

```bash
# Install dependencies
bun install

# Run in development mode (execute TypeScript directly without building)
bun run dev

# Build (output to dist/)
bun run build

# Type checking
bun run typecheck

# Linting
bun run lint
```

## Architecture

mimo-cli uses a four-layer architecture:

```
CLI Layer (Commands)       ← The mimo xxx commands you run
SDK Layer (Programmatic)   ← You can also call it from TypeScript
API Client Layer (Client)  ← OpenAI-compatible protocol, easy to switch
MiMo AI Platform API       ← Xiaomi's large model capabilities
```

## License

[MIT](LICENSE)
