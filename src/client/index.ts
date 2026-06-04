import OpenAI from 'openai';
import type {
  ChatCompletion,
  ChatCompletionChunk,
} from 'openai/resources/chat/completions';
import type { Stream } from 'openai/streaming';
import type { ChatRequest, MiMoChatCompletion, MiMoChatCompletionChunk, ToolDef } from '../types/api';
import { VERSION } from '../version';
import { wrapApiError } from './errors';

const DEFAULT_BASE_URL = 'https://api.xiaomimimo.com/v1';
const DEFAULT_TIMEOUT_SEC = 300;

export interface MiMoClientConfig {
  apiKey: string;
  baseURL?: string;
  timeout?: number;
}

/**
 * MiMo API client that wraps the OpenAI SDK.
 * MiMo API is OpenAI-compatible, so we reuse the SDK's chat.completions endpoint.
 */
export class MiMoClient {
  private openai: OpenAI;

  constructor(config: MiMoClientConfig) {
    this.openai = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL || DEFAULT_BASE_URL,
      timeout: (config.timeout ?? DEFAULT_TIMEOUT_SEC) * 1000,
      defaultHeaders: {
        'User-Agent': `mimo-cli/${VERSION}`,
      },
    });
  }

  /**
   * 构建 OpenAI SDK 兼容的请求参数，将 MiMo 特有字段提取到 extraBody 中。
   * OpenAI SDK 会将 extraBody 中的字段透传到请求体，无需 as any。
   *
   * 注意：OpenAI SDK 的 tools 参数只接受 type: 'function' 的工具定义，
   * MiMo 的 web_search 工具需要通过额外请求体透传。
   */
  private buildRequestParams(params: ChatRequest, stream: boolean): Record<string, unknown> {
    const { thinking, asr_options, audio, tools, ...openaiParams } = params;

    const result: Record<string, unknown> = {
      ...openaiParams,
      stream,
      thinking,
      asr_options,
      audio,
    };

    // MiMo API 的 tools 参数同时支持 function 和 web_search 类型，
    // 但 OpenAI SDK 只接受 function 类型，因此需要直接透传原始 tools 数组
    if (tools && tools.length > 0) {
      result.tools = tools;
    }

    return result;
  }

  /**
   * Non-streaming chat completion.
   * 返回 MiMoChatCompletion 类型。由于 OpenAI SDK 的 ChatCompletion 类型
   * 不包含 MiMo 扩展字段（reasoning_content 等），需要类型转换。
   * 运行时 MiMo API 返回的数据结构是兼容的，因此此转换是安全的。
   */
  async chatCompletion(
    params: ChatRequest,
  ): Promise<MiMoChatCompletion> {
    try {
      const requestParams = this.buildRequestParams(params, false);
      // 请求参数类型转换：MiMo 特有字段通过 OpenAI SDK 透传
      const response = await this.openai.chat.completions.create(
        requestParams as unknown as Parameters<typeof this.openai.chat.completions.create>[0],
      );
      // 响应类型转换：OpenAI ChatCompletion → MiMoChatCompletion（运行时结构兼容）
      return response as unknown as MiMoChatCompletion;
    } catch (err) {
      throw wrapApiError(err);
    }
  }

  /**
   * Streaming chat completion.
   * 返回 Stream<ChatCompletionChunk>，MiMo 扩展字段在 delta 中通过运行时透传。
   * 使用 extractDelta() 辅助函数可安全提取 MiMo 扩展字段。
   */
  async chatCompletionStream(
    params: ChatRequest,
  ): Promise<Stream<ChatCompletionChunk>> {
    try {
      const requestParams = this.buildRequestParams(params, true);
      // 请求参数类型转换同 chatCompletion
      return await this.openai.chat.completions.create(
        requestParams as unknown as Parameters<typeof this.openai.chat.completions.create>[0],
      ) as Stream<ChatCompletionChunk>;
    } catch (err) {
      throw wrapApiError(err);
    }
  }

  /**
   * Convenience method: detect the `stream` parameter and call the
   * appropriate method. MiMo-specific fields (thinking, asr_options, audio)
   * are passed through the request body.
   *
   * Returns either a MiMoChatCompletion (non-streaming) or a Stream<ChatCompletionChunk> (streaming).
   */
  async chat(
    params: ChatRequest,
  ): Promise<MiMoChatCompletion | Stream<ChatCompletionChunk>> {
    const isStreaming = params.stream === true;

    if (isStreaming) {
      return this.chatCompletionStream(params);
    }

    return this.chatCompletion(params);
  }

  /**
   * Access the underlying OpenAI instance for advanced usage.
   */
  get raw(): OpenAI {
    return this.openai;
  }
}

export { wrapApiError } from './errors';
export { createClient } from './errors';
