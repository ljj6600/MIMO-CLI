<p align="center">
  <a href="https://www.npmjs.com/package/mimo-cli">
    <img src="https://img.shields.io/npm/v/mimo-cli.svg" alt="npm version">
  </a>
  <a href="https://github.com/ljj6600/MIMO-CLI/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License">
  </a>
  <a href="https://nodejs.org/">
    <img src="https://img.shields.io/badge/node-%3E%3D18-brightgreen" alt="Node >= 18">
  </a>
  <a href="https://github.com/ljj6600/MIMO-CLI/releases">
    <img src="https://img.shields.io/badge/platform-windows-blue" alt="Windows exe">
  </a>
</p>

<h1 align="center">MiMo CLI</h1>
<p align="center"><b>Give your Agent the full power of MiMo — without writing a single line of code.</b></p>
<p align="center">Command-line interface for the MiMo AI Platform — chat, multimodal understanding, speech recognition & synthesis.</p>

<p align="center">
  <a href="#installation">Installation</a> ·
  <a href="#quick-start">Quick Start</a> ·
  <a href="#command-reference">Command Reference</a> ·
  <a href="#sdk">SDK</a> ·
  <a href="#default-models">Default Models</a> ·
  <a href="#configuration">Configuration</a>
</p>

---

## Installation

### Option 1: Install via Agent

If you're using AI Agents like Claude Code, OpenClaw, or Cursor, you can have the Agent handle the installation and configuration for you. Copy and send the following prompt to your Agent:

```
Please help me set up MiMo CLI (`https://github.com/ljj6600/MIMO-CLI`) by completing these three steps:

1. Install CLI globally: run `npm install -g mimo-cli`, then verify with `mimo --version`
2. Log in and configure API Key: run `mimo auth login --api-key sk-xxxxx`
3. Install the official SKILL: run `npx skills add ljj6600/MIMO-CLI -y -g`

After completion, please run `mimo chat -m "Hello"` to verify MiMo's response and confirm the setup is working.
```

### Option 2: npm Manual Global Install (Requires Node.js 18+)

**1. Install MiMo CLI**

Run the following command in your terminal to install globally:

```bash
npm install -g mimo-cli
```

**2. Log in with API Key**

Authenticate using your API Key (replace `sk-xxxxx` with your actual key):

```bash
mimo auth login --api-key sk-xxxxx
```

> The latest version of mimo-cli automatically detects the key prefix and configures the corresponding API endpoint — no manual setup required.

Get your key from the [MiMo Platform](https://platform.xiaomimimo.com). Two key types are supported:

- **TokenPlan Key** (`tp-` prefix) → [Apply here](https://platform.xiaomimimo.com/console/plan-manage), auto-configures `https://token-plan-cn.xiaomimimo.com/v1`
- **Pay-as-you-go Key** (`sk-` prefix) → [Apply here](https://platform.xiaomimimo.com/console/api-keys), auto-configures `https://api.xiaomimimo.com/v1`

**3. Install SKILL (Optional, Recommended for Agent Users)**

If you plan to use MiMo inside AI Agents like Claude Code, OpenClaw, or Cursor, we recommend installing the official SKILL for better Agent decision-making — no need to dig through `--help` at runtime:

```bash
npx skills add ljj6600/MIMO-CLI -y -g
```

> The SKILL is automatically symlinked to `~/.claude/skills/` and `~/.openclaw/skills/` — Agents will pick it up on their next launch. You can skip this if you only use `mimo` commands directly in your terminal.

### Option 3: Windows Standalone EXE (Quick Start)

No Node.js required — download and run.

1. Head to the [Releases page](https://github.com/ljj6600/MIMO-CLI/releases) and grab `mimo-windows-x64.exe`
2. **Double-click** to install — it automatically adds itself to your system PATH
3. Open a new cmd or PowerShell window and type `mimo`

> The program is installed to `%LOCALAPPDATA%\mimo\` and does not modify any system files. To uninstall, run `mimo uninstall` in your terminal.

---

## Quick Start

```bash
# Chat
mimo chat -m "Hello, introduce yourself"

# Interactive multi-turn conversation
mimo repl

# Deep thinking
mimo chat -m "Analyze the future of quantum computing" --thinking

# Web search
mimo chat -m "What's the weather in Beijing today?" --search

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

- **Chat Completion** — Single-turn and multi-turn conversations with chain-of-thought reasoning and web search (with geolocation)
- **Multimodal Understanding** — Image, audio, and video understanding (URL mode supports up to 300MB)
- **Speech Recognition (ASR)** — Convert wav/mp3 audio to text, with streaming support
- **Text-to-Speech (TTS)** — Preset voices, voice cloning, and custom voice design
- **Deep Thinking** — Use `--thinking` to display the model's reasoning process
- **Web Search** — `--search` flag with location awareness and keyword control
- **Streaming Output** — Real-time token-by-token output
- **Dual Key Management** — Seamlessly switch between pay-as-you-go and TokenPlan keys
- **Bilingual Interface** — Switch between Chinese and English with `mimo language en`
- **Security by Design** — API keys stored locally only, automatic output sanitization, path traversal protection

## Command Reference

### `mimo chat`

Single-turn chat with deep thinking and web search support.

```bash
mimo chat -m "Hello"                                    # Basic chat
mimo chat -m "Analyze quantum computing" --thinking      # Deep thinking
mimo chat -m "Today's weather" --search --user-city Wuhan # Web search
mimo chat -m "Return JSON" --json --no-stream            # Structured output
mimo chat -m "Write code" --system "You are a Go expert" # System prompt
```

### `mimo repl`

Interactive multi-turn conversation with automatic context management.

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
mimo vision --video clip.mp4 -p "Summarize the video" --fps 1      # Video (local file)
mimo vision --video https://example.com/v.mp4 -p "Describe"        # Video (URL mode)
mimo vision --image a.jpg --audio b.mp3 -p "Compare the two"       # Multimodal combination
```

### `mimo asr`

Speech recognition — convert audio to text.

```bash
mimo asr recording.wav                                  # Basic speech recognition
mimo asr audio.mp3 --language zh                        # Specify language
mimo asr --file recording.wav --language en              # Using --file flag
mimo asr speech.wav --stream                            # Streaming output
```

### `mimo tts`

Text-to-speech — generate natural-sounding speech.

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
mimo config set --key timeout --value 600        # Set timeout
mimo config set --key active_key --value sk      # Switch active key
```

### `mimo language` · `mimo update` · `mimo uninstall`

```bash
mimo language zh                   # Switch to Chinese interface
mimo language en                   # Switch to English interface
mimo update                        # Check for the latest version
mimo uninstall                     # Uninstall the EXE-based installation (not for npm)
```

## SDK

`mimo-cli` also ships with a full TypeScript/JavaScript SDK, so you can integrate MiMo capabilities directly into your own projects.

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

The SDK shares the same underlying API client as the CLI — consistent behavior, full feature parity.

## Agent Integration

If you'd like your AI Agent (Claude Code, Cursor, etc.) to call MiMo directly, hand it the following prompt:

```
Please help me set up MiMo CLI (https://github.com/ljj6600/MIMO-CLI) by completing these three steps:

1. Install the CLI globally: run `npm install -g mimo-cli`, then verify with `mimo --version`
2. Log in and configure your API Key: run `mimo auth login --api-key sk-xxxxx`
3. Install the official SKILL: run `npx skills add ljj6600/MIMO-CLI -y -g`
```

## Default Models

| Capability | Model | Description |
|------------|-------|-------------|
| Chat | `mimo-v2.5-pro` | General conversation, complex reasoning, deep analysis, long documents |
| Multimodal | `mimo-v2.5` | Image/audio/video understanding |
| Speech Recognition | `mimo-v2.5-asr` | Speech to text |
| Text-to-Speech | `mimo-v2.5-tts` | Text to speech |
| Voice Cloning | `mimo-v2.5-tts-voiceclone` | Clone a voice from a reference sample |
| Voice Design | `mimo-v2.5-tts-voicedesign` | Generate a custom voice from a description |

## Configuration

Config file location: `~/.mimo/config.json`

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

**Priority order**: CLI flags > Environment variables > Config file > Built-in defaults

### Environment Variables

| Variable | Description |
|----------|-------------|
| `MIMO_API_KEY` | API key |
| `MIMO_BASE_URL` | API base URL |
| `MIMO_CONFIG_DIR` | Config directory (default: `~/.mimo`) |
| `MIMO_OUTPUT` | Output format (text/json) |
| `MIMO_TIMEOUT` | Request timeout in seconds |
| `HTTPS_PROXY` | Proxy settings |

## Security

- API keys are stored locally in `~/.mimo/config.json` with 0o600 permissions
- All output is automatically sanitized to prevent accidental API key leaks
- File path traversal protection
- Video file size limits enforced (Base64 ≤ 37.5MB / URL ≤ 300MB)

## Development

```bash
# Install dependencies
bun install

# Run in development mode (execute TypeScript directly, no build step)
bun run dev

# Build (output to dist/)
bun run build

# Build Windows standalone executable
bun run build:exe

# Type checking
bun run typecheck

# Linting
bun run lint
```

## Architecture

```
CLI Layer (Commands)         ← The mimo xxx commands you run
SDK Layer (Programmatic)     ← Also callable from TypeScript
API Client Layer (Client)    ← OpenAI-compatible, easy to swap
MiMo AI Platform API         ← Xiaomi's large model capabilities
```

## License

[MIT](LICENSE)
