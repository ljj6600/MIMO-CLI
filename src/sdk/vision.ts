import { MiMoSDKClient } from './client';
import type { ChatMessage, ContentPart, Usage, ChatRequest, MiMoChatCompletion } from '../types/api';

export interface VisionOptions {
  model?: string;
  image?: string;
  audio?: string;
  video?: string;
  prompt?: string;
  fps?: number;
  mediaResolution?: 'default' | 'max';
}

export interface VisionResult {
  id: string;
  content: string;
  model: string;
  usage?: Usage;
}

export class VisionSDK {
  private client: MiMoSDKClient;

  constructor(client: MiMoSDKClient) {
    this.client = client;
  }

  async describe(options: VisionOptions): Promise<VisionResult> {
    const contentParts: ContentPart[] = [];

    if (options.prompt) {
      contentParts.push({ type: 'text', text: options.prompt });
    }

    if (options.image) {
      contentParts.push({
        type: 'image_url',
        image_url: { url: options.image },
      });
    }

    if (options.audio) {
      contentParts.push({
        type: 'input_audio',
        input_audio: { data: options.audio },
      });
    }

    if (options.video) {
      contentParts.push({
        type: 'video_url',
        video_url: {
          url: options.video,
          ...(options.fps ? { fps: options.fps } : {}),
          ...(options.mediaResolution ? { media_resolution: options.mediaResolution } : {}),
        },
      });
    }

    const messages: ChatMessage[] = [
      {
        role: 'user',
        content: contentParts.length > 0 ? contentParts : (options.prompt ?? 'Describe this.'),
      },
    ];

    try {
      const request: ChatRequest = {
        model: options.model ?? 'mimo-v2.5',
        messages,
        stream: false,
      };
      // chatCompletion 返回 MiMoChatCompletion，可直接访问扩展字段
      const response: MiMoChatCompletion = await this.client.mimo.chatCompletion(request);
      const choice = response.choices[0];
      return {
        id: response.id,
        content: choice?.message?.content ?? '',
        model: response.model,
        usage: response.usage,
      };
    } catch (error) {
      this.client.handleError(error);
    }
  }
}
