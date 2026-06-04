// ============================================================
// MiMo 扩展类型定义
// ============================================================

// Chat
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | ContentPart[];
  reasoning_content?: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

export type ContentPart = TextPart | ImageUrlPart | InputAudioPart | VideoUrlPart;

export interface TextPart {
  type: 'text';
  text: string;
}

export interface ImageUrlPart {
  type: 'image_url';
  image_url: { url: string };
}

export interface InputAudioPart {
  type: 'input_audio';
  input_audio: { data: string };
}

export interface VideoUrlPart {
  type: 'video_url';
  video_url: { url: string };
  fps?: number;
  media_resolution?: 'default' | 'max';
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  max_completion_tokens?: number;
  temperature?: number;
  top_p?: number;
  stream?: boolean;
  stop?: string | string[];
  frequency_penalty?: number;
  presence_penalty?: number;
  thinking?: { type: 'enabled' | 'disabled' };
  tools?: ToolDef[];
  tool_choice?: string;
  response_format?: { type: 'text' | 'json_object' };
  audio?: AudioOutputConfig;
  asr_options?: { language: 'auto' | 'zh' | 'en' };
}

export interface ToolDef {
  type: 'function' | 'web_search';
  // 使用 Record<string, unknown> 替代 any，表示任意 JSON Schema 对象
  function?: { name: string; description?: string; parameters?: Record<string, unknown>; strict?: boolean };
  max_keyword?: number;
  force_search?: boolean;
  limit?: number;
  user_location?: { type: string; country?: string; region?: string; city?: string };
}

export interface AudioOutputConfig {
  format?: 'wav' | 'mp3' | 'pcm' | 'pcm16';
  voice?: string;
  optimize_text_preview?: boolean;
}

export interface ChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: ChatChoice[];
  usage?: Usage;
}

export interface ChatChoice {
  index: number;
  message: ChatMessage & { audio?: AudioData; annotations?: Annotation[] };
  finish_reason: string;
}

// 流式响应 delta 类型，替代原来的 any
export interface ChatStreamDelta {
  role?: string;
  content?: string;
  reasoning_content?: string;
  annotations?: Annotation[];
}

export interface ChatStreamChunk {
  id: string;
  object: 'chat.completion.chunk';
  created: number;
  model: string;
  choices: { index: number; delta: ChatStreamDelta; finish_reason: string | null }[];
  usage?: Usage;
}

export interface AudioData {
  id: string;
  data: string;
  expires_at: number | null;
  transcript: string | null;
}

export interface Annotation {
  type: string;
  url: string;
  title: string;
  summary: string;
  site_name: string;
  publish_time: string;
  logo_url: string;
}

export interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  completion_tokens_details?: { reasoning_tokens: number };
  prompt_tokens_details?: {
    cached_tokens: number;
    audio_tokens: number;
    image_tokens: number;
    video_tokens: number;
  };
  web_search_usage?: { tool_usage: number; page_usage: number };
  seconds?: number;
}

// TTS voices
export interface TTSVoice {
  name: string;
  voiceId: string;
  language: string;
  gender: string;
}

// ============================================================
// MiMo 扩展的 ChatCompletion 消息类型
// ============================================================

export interface MiMoChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | MiMoContentPart[];
  reasoning_content?: string; // MiMo 推理过程
}

export interface MiMoContentPart {
  type: 'text' | 'image_url' | 'input_audio' | 'video_url';
  text?: string;
  image_url?: { url: string };
  input_audio?: { data: string; format?: string };
  video_url?: { url: string };
}

// MiMo 扩展的 ChatCompletion 参数
export interface MiMoChatCompletionParams {
  model: string;
  messages: MiMoChatMessage[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  // MiMo 特有参数
  search?: boolean;
  reasoning_effort?: 'low' | 'medium' | 'high';
}

// MiMo TTS 参数
export interface MiMoTTSParams {
  model: string;
  input: string;
  voice: string;
  response_format?: string;
  speed?: number;
  // 声音克隆参数
  reference_audio?: string;
  reference_text?: string;
  // 音色设计参数
  voice_design_prompt?: string;
}

// MiMo ASR 参数
export interface MiMoASRParams {
  model: string;
  file: string; // base64 encoded audio
  response_format?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';
  language?: string;
}

// MiMo ChatCompletion 响应扩展
export interface MiMoChatCompletion {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string | null;
      reasoning_content?: string;
      audio?: AudioData;
      annotations?: Annotation[];
    };
    finish_reason: string;
  }>;
  usage?: Usage;
}

// MiMo 流式响应 chunk 扩展
export interface MiMoChatCompletionChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: ChatStreamDelta;
    finish_reason: string | null;
  }>;
}

// ============================================================
// 类型安全辅助函数 — 替代 as unknown as 模式
// ============================================================

/**
 * 从 OpenAI SDK 的 delta 对象中安全提取 MiMo 扩展字段。
 * OpenAI SDK 的 Delta 类型不包含 reasoning_content 和 annotations，
 * 但 MiMo API 会在运行时返回这些字段。
 */
export function extractDelta(delta: Record<string, unknown>): ChatStreamDelta {
  return {
    role: typeof delta.role === 'string' ? delta.role : undefined,
    content: typeof delta.content === 'string' ? delta.content : undefined,
    reasoning_content: typeof delta.reasoning_content === 'string' ? delta.reasoning_content : undefined,
    annotations: Array.isArray(delta.annotations) ? delta.annotations as Annotation[] : undefined,
  };
}

/**
 * 从 OpenAI SDK 的 chunk 对象中安全提取 usage 字段。
 * OpenAI SDK 的 ChatCompletionChunk.usage 类型与 MiMo 的 Usage 不完全一致。
 */
export function extractChunkUsage(chunk: Record<string, unknown>): Usage | undefined {
  const usage = chunk.usage;
  if (typeof usage === 'object' && usage !== null) {
    return usage as Usage;
  }
  return undefined;
}

/**
 * 安全中止 OpenAI SDK 的 Stream 对象。
 * Stream 内部有 controller 属性但不在公开类型定义中。
 */
export function abortStream(stream: object): void {
  if ('controller' in stream) {
    const ctrl = (stream as Record<string, unknown>).controller;
    if (ctrl && typeof ctrl === 'object' && ctrl !== null && 'abort' in ctrl) {
      (ctrl as { abort(): void }).abort();
    }
  }
}

/**
 * 从 OpenAI APIError 中安全提取 url 字段。
 * url 属性在运行时存在但不在 OpenAI SDK 类型定义中。
 */
export function extractErrorUrl(err: object): string {
  if ('url' in err) {
    const url = (err as Record<string, unknown>).url;
    return typeof url === 'string' ? url : '';
  }
  return '';
}
