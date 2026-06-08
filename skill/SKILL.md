---
name: mimo-cli
description: Use mimo to chat, understand images/audio/video, recognize speech, synthesize voice (including voice cloning and custom voice design), and query plan quota, account balance, usage details, and monthly bills via the MiMo AI platform. Use when the user wants to have conversations, analyze media content, perform speech recognition, generate speech, or check their plan usage, account balance, or billing from the terminal.
---

## Prerequisites

```bash
npm install -g mimo-cli
mimo auth login --api-key sk-xxxxx    # Pay-as-you-go Key
mimo auth login --api-key tp-xxxxx    # TokenPlan Key
mimo auth status
```

Base URL auto-detected from key prefix: `sk-` → `https://api.xiaomimimo.com/v1`, `tp-` → `https://token-plan-cn.xiaomimimo.com/v1`.

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
mimo chat --message "What is MiMo?" --output json --quiet
mimo chat -m "Explain quantum computing" --thinking --no-stream
mimo chat -m "Latest AI news" --search --output json
mimo chat -m "武汉明天天气" --search --user-city 武汉
```

---

### repl

Interactive multi-turn conversation. `/exit` to quit, `/clear` to reset.

```bash
mimo repl [--model <model>] [--thinking] [--search] [-s, --system <text>]
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
| `--stream` / `--no-stream` | boolean | Streaming output (default: on) |
| `--fps <n>` | number | Video frame rate (default: 2) |
| `--media-resolution <value>` | string | Video resolution: `default` or `max` |

Video limits: URL mode ≤ 300 MB, Base64 mode raw ≤ 37.5 MB (encoded ≤ 50 MB).

```bash
mimo vision --image photo.jpg -p "Describe this image" --output json
mimo vision --audio recording.mp3 -p "Transcribe this audio"
mimo vision --video clip.mp4 -p "Summarize this video" --fps 1
mimo vision --image a.jpg --audio b.mp3 -p "Compare the image and audio"
```

---

### asr

Speech recognition. Default model: `mimo-v2.5-asr`.

```bash
mimo asr <audio-file> [--language <auto|zh|en>] [--stream]
```

```bash
mimo asr recording.wav --output json --quiet
mimo asr audio.mp3 --language zh
```

---

### tts synthesize

Text-to-speech with pre-set voices. Default model: `mimo-v2.5-tts`. Max 5000 chars. Alias: `mimo tts generate`.

```bash
mimo tts synthesize --text <text> [flags]
```

| Flag | Type | Description |
|---|---|---|
| `-t, --text <text>` | string, **required** | Text to synthesize |
| `--voice <id>` | string | Voice ID (default: `mimo_default`) |
| `--style <desc>` | string | Natural language style instruction |
| `--format <fmt>` | string | `wav`, `mp3`, `pcm` (default: `wav`) |
| `-o, --out <path>` | string | Save audio to file |

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

---

### tts clone

Voice clone TTS. Model: `mimo-v2.5-tts-voiceclone`.

```bash
mimo tts clone --sample <audio> --text <text> [--format <wav|mp3|pcm>] [-o, --out <path>]
```

```bash
mimo tts clone --sample voice.mp3 --text "你好" --out clone.wav --quiet
```

---

### tts design

Custom voice design TTS. Model: `mimo-v2.5-tts-voicedesign`.

```bash
mimo tts design --prompt <description> [-t, --text <text>] [--optimize-text] [--format <wav|mp3|pcm>] [-o, --out <path>]
```

```bash
mimo tts design --prompt "温柔的女声，语速较慢" --text "你好" --out design.wav --quiet
mimo tts design -p "低沉男声，播音腔" --optimize-text --out preview.wav
```

---

### tts voices

```bash
mimo tts voices [--output json]
```

---

### quota

Query plan quota or account balance. Cookie-based auth (not API key). Auto-selects query by key type:
- **TokenPlan key (`tp-`)** → plan usage (套餐积分, 补偿积分)
- **Pay-as-you-go key (`sk-`)** → account balance (总余额, 现金余额, 赠送余额, etc.)

```bash
mimo quota [--cookie <cookie>] [--output json] [--quiet]
```

Cookie is auto-fetched via CDP from Edge browser (launches Edge with debugging port, waits for `platform.xiaomimimo.com` page, extracts cookies). Saved to `~/.mimo/config.json` for reuse. Requires Microsoft Edge installed. If auto-fetch fails, set manually:

```bash
mimo auth cookie                           # Interactive input
mimo auth cookie --cookie "serviceToken=...; userId=..."   # Direct input
```

Expired cookies are auto-cleared; re-run `mimo quota` to re-fetch.

---

### quota usage / bill / recharge

```bash
mimo quota usage   [--cookie <cookie>] [--output json] [--quiet]
mimo quota bill    [--cookie <cookie>] [--output json] [--quiet]
mimo quota recharge [--cookie <cookie>] [--output json] [--quiet]
```

All require a valid platform cookie (auto-fetched or set via `mimo auth cookie`).

---

### auth login / status / logout

```bash
mimo auth login --api-key <key>
mimo auth status
mimo auth logout
```

---

### auth cookie

```bash
mimo auth cookie [--cookie <value>]
```

---

### config show / set

```bash
mimo config show
mimo config set --key <key> --value <value>
```

Valid keys: `api_key`, `sk_api_key`, `active_key`, `base_url`, `output`, `timeout`, `default_model`, `language`, `platform_cookie`.

---

### language

```bash
mimo language <zh|en>
```

---

### update

```bash
mimo update
```

---

## Configuration Precedence

CLI flags → environment variables → `~/.mimo/config.json` → defaults.

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
mimo chat -m "Hello" --output json --quiet | jq '.choices[0].message.content'
mimo tts synthesize -t "Hello" --out hello.wav 2>/dev/null
TEXT=$(mimo asr recording.wav --quiet)
mimo chat -m "Summarize: $TEXT" --quiet
mimo vision --image photo.jpg -p "Describe" --output json --quiet | jq '.choices[0].message.content'
mimo quota --output json --quiet | jq '.[0].剩余'
```

---

## SDK Usage

```typescript
import { MiMoSDK } from 'mimo-cli/sdk';

const sdk = new MiMoSDK({ apiKey: 'sk-xxx' });

const result = await sdk.chat.chat({
  messages: [{ role: 'user', content: 'Hello' }],
  stream: false,
});

const vision = await sdk.vision.describe({
  image: 'https://example.com/photo.jpg',
  prompt: 'Describe this image',
});
```
