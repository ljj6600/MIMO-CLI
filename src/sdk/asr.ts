import { MiMoSDKClient } from './client';
import type { ChatMessage, Usage, ChatRequest, MiMoChatCompletion } from '../types/api';

export interface ASROptions {
  model?: string;
  file: string; // base64 data URI or URL
  language?: 'auto' | 'zh' | 'en';
}

export interface ASRResult {
  id: string;
  text: string;
  model: string;
  usage?: Usage;
}

export class ASRSDK {
  private client: MiMoSDKClient;

  constructor(client: MiMoSDKClient) {
    this.client = client;
  }

  async transcribe(options: ASROptions): Promise<ASRResult> {
    const messages: ChatMessage[] = [
      {
        role: 'user',
        content: [
          { type: 'input_audio' as const, input_audio: { data: options.file } },
        ],
      },
    ];

    try {
      const request: ChatRequest = {
        model: options.model ?? 'mimo-v2.5-asr',
        messages,
        stream: false,
        asr_options: { language: options.language ?? 'auto' },
      };
      // chatCompletion 返回 MiMoChatCompletion，可直接访问扩展字段
      const response: MiMoChatCompletion = await this.client.mimo.chatCompletion(request);
      const choice = response.choices[0];
      return {
        id: response.id,
        text: choice?.message?.content ?? '',
        model: response.model,
        usage: response.usage,
      };
    } catch (error) {
      this.client.handleError(error);
    }
  }
}
