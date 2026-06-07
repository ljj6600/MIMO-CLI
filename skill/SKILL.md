---
name: mimo-cli
description: Use mimo to chat, understand images/audio/video, recognize speech, synthesize voice, and query quota/balance/usage/bills via the MiMo AI platform. Use when the user wants to have conversations, analyze media content, perform speech recognition, generate speech, or check their plan usage, account balance, or billing from the terminal.
---

# MiMo CLI — Agent Skill Guide

Use `mimo` to chat, understand multimodal content, recognize speech, synthesize voice, and query quota/balance/usage/bills via the MiMo AI platform.

## Prerequisites

```bash
# Install
npm install -g mimo-cli

# Auth (persists to ~/.mimo/config.json)
mimo auth login --api-key sk-xxxxx    # Pay-as-you-go Key
mimo auth login --api-key tp-xxxxx    # TokenPlan Key

# Verify active auth source
mimo auth status

# Or pass per-call
mimo chat --api-key sk-xxxxx --message "Hello"
```

Base URL is auto-detected from key prefix:
- `sk-` prefix → `https://api.xiaomimimo.com/v1`
- `tp-` prefix → `https://token-plan-cn.xiaomimimo.com/v1`

---

## Agent Flags

Always use these flags in non-interactive (agent/CI) contexts:

| Flag | Purpose |
|---|---|
| `--non-interactive` | Fail fast on missing args instead of prompting |
| `--quiet` | Suppress spinners/progress; stdout is pure data |
| `--output json` | Machine-readable JSON output |
| `--dry-run` | Preview the API request without executing |
| `--no-color` | Disable colored output |

---

## Default Models

| Model | Use Case |
|---|---|
| `mimo-v2.5-pro` | General chat, complex reasoning, deep analysis |
| `mimo-v2.5` | Image/audio/video content understanding |
| `mimo-v2.5-asr` | Speech recognition |
| `mimo-v2.5-tts` | Text-to-speech synthesis |
| `mimo-v2.5-tts-voiceclone` | Voice cloning |
| `mimo-v2.5-tts-voicedesign` | Custom voice design |

---

## Commands

### chat

Chat completion. Default model: `mimo-v2.5-pro`.

```bash
mimo chat --message <text> [flags]
```

| Flag | Type | Description |
|---|---|---|
| `-m, --message <text>` | string, **required** | Message text |
| `--model <model>` | string | Model ID (default: `mimo-v2.5-pro`) |
| `-s, --system <text>` | string | System prompt |
| `--thinking` | boolean | Enable deep thinking mode (shows reasoning) |
| `--search` | boolean | Enable web search |
| `--force-search` | boolean | Force web search |
| `--max-keyword <n>` | number | Max keywords per search |
| `--search-limit <n>` | number | Search result limit |
| `--user-country <country>` | string | User location: country |
| `--user-region <region>` | string | User location: region |
| `--user-city <city>` | string | User location: city |
| `--stream` | boolean | Streaming output (default: on) |
| `--no-stream` | boolean | Disable streaming |
| `--json` | boolean | Structured JSON output |
| `--max-tokens <n>` | number | Max completion tokens |
| `--temperature <n>` | number | Sampling temperature |

```bash
# Single message
mimo chat --message "What is MiMo?" --output json --quiet

# With thinking mode
mimo chat -m "Explain quantum computing" --thinking --no-stream

# With web search
mimo chat -m "Latest AI news" --search --output json

# With location-aware search
mimo chat -m "武汉明天天气" --search --user-city 武汉
```

**stdout**: response text (text mode) or full response object (json mode).

**Note**: In `--thinking` mode, reasoning content is displayed in dim gray before the main response. In `--search` mode, source citations are appended after the response.

---

### repl

Interactive multi-turn conversation. Supports `/exit` to quit and `/clear` to reset.

```bash
mimo repl [flags]
```

| Flag | Type | Description |
|---|---|---|
| `--model <model>` | string | Model ID (default: `mimo-v2.5-pro`) |
| `--thinking` | boolean | Enable deep thinking mode |
| `--search` | boolean | Enable web search |
| `-s, --system <text>` | string | System prompt |

```bash
mimo repl
mimo repl --thinking --system "You are a helpful coding assistant"
mimo repl --search
```

---

### vision

Multi-modal understanding for images, audio, and video. Default model: `mimo-v2.5`.

```bash
mimo vision --prompt <text> [flags]
```

| Flag | Type | Description |
|---|---|---|
| `--image <path\|url>` | string | Image file path or URL |
| `--audio <path\|url>` | string | Audio file path or URL |
| `--video <path\|url>` | string | Video file path or URL |
| `-p, --prompt <text>` | string, **required** | Question about the content |
| `--model <model>` | string | Model ID (default: `mimo-v2.5`) |
| `--stream` | boolean | Streaming output (default: on) |
| `--no-stream` | boolean | Disable streaming |
| `--fps <n>` | number | Video frame rate (default: 2) |
| `--media-resolution <value>` | string | Video resolution: `default` or `max` |

**Video limits:**
- URL mode: single video ≤ 300 MB
- Base64 mode: raw file ≤ 37.5 MB (encoded ≤ 50 MB)

```bash
# Image understanding
mimo vision --image photo.jpg -p "Describe this image" --output json

# Audio understanding
mimo vision --audio recording.mp3 -p "Transcribe this audio"

# Video understanding
mimo vision --video clip.mp4 -p "Summarize this video" --fps 1

# Multi-modal
mimo vision --image a.jpg --audio b.mp3 -p "Compare the image and audio"
```

**stdout**: description text (text mode) or full response (json mode).

---

### asr

Speech recognition (ASR). Default model: `mimo-v2.5-asr`.

```bash
mimo asr <audio-file> [flags]
```

| Flag | Type | Description |
|---|---|---|
| `<audio-file>` | string, positional | Audio file path |
| `--file <path>` | string | Audio file path (alternative to positional) |
| `--language <lang>` | string | Language: `auto`, `zh`, `en` (default: `auto`) |
| `--stream` | boolean | Enable streaming output |

```bash
mimo asr recording.wav --output json --quiet
mimo asr audio.mp3 --language zh
mimo asr --file recording.wav --language en
```

**stdout**: transcribed text.

---

### tts synthesize

Text-to-speech with pre-set voices. Default model: `mimo-v2.5-tts`. Max 5000 chars.

Alias: `mimo tts generate`

```bash
mimo tts synthesize --text <text> [flags]
```

| Flag | Type | Description |
|---|---|---|
| `-t, --text <text>` | string, **required** | Text to synthesize |
| `--voice <id>` | string | Voice ID (default: `mimo_default`) |
| `--style <desc>` | string | Natural language style instruction |
| `--format <fmt>` | string | Audio format: `wav`, `mp3`, `pcm` (default: `wav`) |
| `-o, --out <path>` | string | Save audio to file |

**Available voices:**
| Voice | Language | Gender |
|---|---|---|
| mimo_default | Chinese/English | - |
| 冰糖 | Chinese | Female |
| 茉莉 | Chinese | Female |
| 苏打 | Chinese | Male |
| 白桦 | Chinese | Male |
| Mia | English | Female |
| Chloe | English | Female |
| Milo | English | Male |
| Dean | English | Male |

```bash
mimo tts synthesize --text "你好，世界！" --out hello.wav --quiet
mimo tts synthesize -t "Hello world" --voice Mia --format mp3 --out hello.mp3
mimo tts synthesize -t "温柔地说" --style "温柔、缓慢" --voice 茉莉
```

**stdout**: saved file path (in quiet mode). In non-quiet mode, outputs JSON with `output`, `voice`, and `format` fields.

---

### tts clone

Voice clone text-to-speech. Model: `mimo-v2.5-tts-voiceclone`.

```bash
mimo tts clone --sample <audio> --text <text> [flags]
```

| Flag | Type | Description |
|---|---|---|
| `--sample <path>` | string, **required** | Reference audio file for voice cloning |
| `-t, --text <text>` | string, **required** | Text to synthesize |
| `--format <fmt>` | string | Audio format: `wav`, `mp3`, `pcm` (default: `wav`) |
| `-o, --out <path>` | string | Save audio to file |

```bash
mimo tts clone --sample voice.mp3 --text "你好，世界！" --out clone.wav --quiet
mimo tts clone --sample my_voice.wav -t "Hello world" --format mp3 --out clone.mp3
```

**stdout**: saved file path (in quiet mode). In non-quiet mode, outputs JSON with `output` and `format` fields.

---

### tts design

Custom voice design text-to-speech. Model: `mimo-v2.5-tts-voicedesign`.

```bash
mimo tts design --prompt <description> [flags]
```

| Flag | Type | Description |
|---|---|---|
| `-p, --prompt <desc>` | string, **required** | Voice description (e.g., "温柔的女声，语速较慢") |
| `-t, --text <text>` | string | Text to synthesize |
| `--optimize-text` | boolean | Auto-generate preview text (cannot use with `--text`) |
| `--format <fmt>` | string | Audio format: `wav`, `mp3`, `pcm` (default: `wav`) |
| `-o, --out <path>` | string | Save audio to file |

```bash
mimo tts design --prompt "温柔的女声，语速较慢" --text "你好" --out design.wav --quiet
mimo tts design -p "低沉男声，播音腔" --optimize-text --out preview.wav
mimo tts design --prompt "活泼的少女音" -t "今天天气真好" --format mp3
```

**stdout**: saved file path (in quiet mode). In non-quiet mode, outputs JSON with `output` and `format` fields.

---

### tts voices

List available TTS voices.

```bash
mimo tts voices [--output json]
```

---

### quota

Query plan quota or account balance. Requires a platform cookie (not an API key). Automatically selects the right query based on active key type:
- **TokenPlan key (`tp-`)** → shows plan usage (套餐积分, 补偿积分)
- **Pay-as-you-go key (`sk-`)** → shows account balance (总余额, 现金余额, 赠送余额, etc.)

```bash
mimo quota [--cookie <cookie>] [--output json] [--quiet]
```

| Flag | Type | Description |
|---|---|---|
| `--cookie <value>` | string | Platform cookie (overrides config file value) |

**How to get the cookie:**
1. Log in to `platform.xiaomimimo.com` in your browser
2. Open Developer Tools → Network tab
3. Find any request to the platform API and copy the `Cookie` header value

**Save cookie for reuse:**
```bash
mimo config set --key platform_cookie --value "serviceToken=...; userId=..."
```

```bash
# Query with cookie directly
mimo quota --cookie "serviceToken=...; userId=..." --output json --quiet

# After saving cookie to config, just run:
mimo quota --output json --quiet
```

**stdout**: table showing plan/balance details. In JSON mode, returns an array of objects.

**Important:**
- This command uses cookie-based authentication (not API key), so it does not require `mimo auth login`
- Cookie values expire; if queries fail, re-obtain the cookie from the browser

---

### quota usage

Query detailed usage: token consumption, cost, plugin requests, and rate limits. Works with any key type (only requires a valid cookie).

```bash
mimo quota usage [--cookie <cookie>] [--output json] [--quiet]
```

```bash
mimo quota usage --output json --quiet
mimo quota usage --cookie "serviceToken=...; userId=..."
```

**stdout**: table showing input/output/cache/total tokens, cumulative & monthly cost, plugin & search request counts, TPM/RPM/concurrency limits.

---

### quota bill

Query monthly bills. Works with any key type (only requires a valid cookie).

```bash
mimo quota bill [--cookie <cookie>] [--output json] [--quiet]
```

```bash
mimo quota bill --output json --quiet
mimo quota bill --cookie "serviceToken=...; userId=..."
```

**stdout**: table showing each month's total, cash, and gift consumption amounts.

---

### quota recharge

Query accumulated recharge amount. Works with any key type (only requires a valid cookie).

```bash
mimo quota recharge [--cookie <cookie>] [--output json] [--quiet]
```

```bash
mimo quota recharge --output json --quiet
mimo quota recharge --cookie "serviceToken=...; userId=..."
```

**stdout**: table showing accumulated recharge amount and currency.

---

### auth login

Log in with a MiMo API key.

```bash
mimo auth login [--api-key <key>]
```

```bash
mimo auth login --api-key sk-xxxxx    # Pay-as-you-go Key
mimo auth login --api-key tp-xxxxx    # TokenPlan Key
```

---

### auth status

Show current authentication status.

```bash
mimo auth status
```

---

### auth logout

Clear saved API key.

```bash
mimo auth logout
```

---

### config show

Display current configuration.

```bash
mimo config show
```

---

### config set

Set a configuration value.

```bash
mimo config set --key <key> --value <value>
```

**Valid keys:** `api_key`, `sk_api_key`, `active_key`, `base_url`, `output`, `timeout`, `default_model`, `language`, `platform_cookie`

```bash
mimo config set --key output --value json
mimo config set --key timeout --value 60
mimo config set --key default_model --value mimo-v2.5-pro
mimo config set --key platform_cookie --value "serviceToken=...; userId=..."
```

---

### language

Switch interface language.

```bash
mimo language <zh|en>
```

```bash
mimo language zh    # Switch to Chinese
mimo language en    # Switch to English
```

---

### update

Self-update the MiMo CLI. Checks npm registry for latest version and updates if needed.

```bash
mimo update
```

**Behavior:**
- Checks current version against latest on npm registry
- If update available, runs `npm install -g mimo-cli@latest`
- Outputs progress to stderr

---

## Configuration Precedence

CLI flags → environment variables → `~/.mimo/config.json` → defaults.

```bash
# Persistent config
mimo config set --key base_url --value https://api.xiaomimimo.com/v1
mimo config show

# Environment
export MIMO_API_KEY=sk-xxxxx
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `MIMO_API_KEY` | API key |
| `MIMO_API_TOKEN` | API token (fallback, lower priority than MIMO_API_KEY) |
| `MIMO_BASE_URL` | API base URL |
| `MIMO_CONFIG_DIR` | Config directory (default: `~/.mimo`) |
| `MIMO_OUTPUT` | Output format (text/json) |
| `MIMO_TIMEOUT` | Request timeout in seconds |
| `MIMO_VERBOSE` | Verbose mode (set to `1` to enable) |
| `NO_COLOR` | Disable colored output |
| `HTTPS_PROXY` / `HTTP_PROXY` | Proxy settings |

---

## Exit Codes

| Code | Meaning |
|---|---|
| 0 | Success |
| 1 | General error |
| 2 | Usage error (bad flags, missing args) |
| 3 | Authentication error |
| 4 | Quota exceeded |
| 5 | Timeout |
| 6 | Network error |
| 10 | Content filtered |
| 11 | Invalid input |

---

## Piping Patterns

```bash
# stdout is always clean data — safe to pipe
mimo chat -m "Hello" --output json --quiet | jq '.choices[0].message.content'

# stderr has progress/spinners — discard if needed
mimo tts synthesize -t "Hello" --out hello.wav 2>/dev/null

# Chain: transcribe audio → chat about it
TEXT=$(mimo asr recording.wav --quiet)
mimo chat -m "Summarize: $TEXT" --quiet

# Vision pipeline
mimo vision --image photo.jpg -p "Describe" --output json --quiet | jq '.choices[0].message.content'

# Check quota and extract remaining amount
mimo quota --cookie "..." --output json --quiet | jq '.[0].剩余'

# Check balance (sk key)
mimo quota --output json --quiet | jq '.[0].剩余'

# Check usage details
mimo quota usage --output json --quiet | jq '.[] | select(.套餐类型 == "累计消费")'

# Check monthly bills
mimo quota bill --output json --quiet | jq '.[0]'
```

---

## SDK Usage

MiMo CLI also exports a programmatic SDK for Node.js/Bun applications:

```typescript
import { MiMoSDK } from 'mimo-cli/sdk';

const sdk = new MiMoSDK({ apiKey: 'sk-xxx' });

// Chat
const result = await sdk.chat.chat({
  messages: [{ role: 'user', content: 'Hello' }],
  stream: false,
});

// Stream chat
for await (const chunk of sdk.chat.chatStream({
  messages: [{ role: 'user', content: 'Hello' }],
})) {
  process.stdout.write(chunk.choices[0]?.delta?.content ?? '');
}

// Vision
const vision = await sdk.vision.describe({
  image: 'https://example.com/photo.jpg',
  prompt: 'Describe this image',
});

// ASR
const asr = await sdk.asr.transcribe({
  file: 'data:audio/wav;base64,...',
  language: 'zh',
});

// TTS
const tts = await sdk.tts.synthesize({
  text: 'Hello world',
  voice: 'Mia',
  format: 'mp3',
});
```
