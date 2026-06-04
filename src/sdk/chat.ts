import { MiMoSDKClient } from './client';
import type {
  ChatMessage,
  ChatRequest,
  ChatResponse,
  ChatStreamChunk,
  Usage,
} from '../types/api';
import { extractDelta, extractChunkUsage } from '../types/api';

export interface ChatOptions {
  model?: string;
  messages: ChatMessage[];
  maxCompletionTokens?: number;
  temperature?: number;
  topP?: number;
  stream?: boolean;
  stop?: string | string[];
  frequencyPenalty?: number;
  presencePenalty?: number;
  thinking?: boolean;
  responseFormat?: { type: 'text' | 'json_object' };
}

export interface ChatResult {
  id: string;
  content: string;
  reasoningContent?: string;
  model: string;
  usage?: Usage;
  finishReason: string;
}

export class ChatSDK {
  private client: MiMoSDKClient;

  constructor(client: MiMoSDKClient) {
    this.client = client;
  }

  async chat(options: ChatOptions): Promise<ChatResult> {
    const request: ChatRequest = {
      model: options.model ?? 'MiMo-7B-RL',
      messages: options.messages,
      max_completion_tokens: options.maxCompletionTokens,
      temperature: options.temperature,
      top_p: options.topP,
      stream: false,
      stop: options.stop,
      frequency_penalty: options.frequencyPenalty,
      presence_penalty: options.presencePenalty,
      thinking: options.thinking ? { type: 'enabled' } : undefined,
      response_format: options.responseFormat,
    };

    try {
      // chatCompletion 返回 MiMoChatCompletion，可直接访问 MiMo 扩展字段
      const response = await this.client.mimo.chatCompletion(request);
      const choice = response.choices[0];
      return {
        id: response.id,
        content: choice?.message?.content ?? '',
        reasoningContent: choice?.message?.reasoning_content,
        model: response.model,
        usage: response.usage,
        finishReason: choice?.finish_reason ?? 'stop',
      };
    } catch (error) {
      this.client.handleError(error);
    }
  }

  async *chatStream(options: ChatOptions): AsyncGenerator<ChatStreamChunk> {
    const request: ChatRequest = {
      model: options.model ?? 'MiMo-7B-RL',
      messages: options.messages,
      max_completion_tokens: options.maxCompletionTokens,
      temperature: options.temperature,
      top_p: options.topP,
      stream: true,
      stop: options.stop,
      frequency_penalty: options.frequencyPenalty,
      presence_penalty: options.presencePenalty,
      thinking: options.thinking ? { type: 'enabled' } : undefined,
      response_format: options.responseFormat,
    };

    try {
      const stream = await this.client.mimo.chatCompletionStream(request);
      // stream 类型为 Stream<ChatCompletionChunk>，转为 ChatStreamChunk 的异步迭代
      for await (const chunk of stream) {
        // 使用 extractDelta 安全提取 MiMo 扩展字段（reasoning_content、annotations）
        const mapped: ChatStreamChunk = {
          id: chunk.id,
          object: 'chat.completion.chunk',
          created: chunk.created,
          model: chunk.model,
          choices: chunk.choices.map((c) => ({
            index: c.index,
            delta: extractDelta(c.delta as Record<string, unknown>),
            finish_reason: c.finish_reason,
          })),
          usage: extractChunkUsage(chunk as unknown as Record<string, unknown>),
        };
        yield mapped;
      }
    } catch (error) {
      this.client.handleError(error);
    }
  }
}
