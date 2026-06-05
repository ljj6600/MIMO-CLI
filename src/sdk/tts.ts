import { MiMoSDKClient } from './client';
import { wrapApiError } from '../client/index';
import type { TTSVoice } from '../types/api';

export interface TTSSynthesizeOptions {
  model?: string;
  text: string;
  voice?: string;
  style?: string;
  format?: 'wav' | 'mp3' | 'pcm';
}

export interface TTSCloneOptions {
  model?: string;
  sample: string; // base64 data URI of reference audio
  text: string;
  format?: 'wav' | 'mp3' | 'pcm';
}

export interface TTSDesignOptions {
  model?: string;
  prompt: string;
  text: string;
  optimizeText?: boolean;
  format?: 'wav' | 'mp3' | 'pcm';
}

export interface TTSResult {
  id: string;
  audio: Buffer;
  model: string;
}

export interface TTSVoicesResult {
  voices: TTSVoice[];
}

export class TTSSDK {
  private client: MiMoSDKClient;

  constructor(client: MiMoSDKClient) {
    this.client = client;
  }

  async synthesize(options: TTSSynthesizeOptions): Promise<TTSResult> {
    try {
      const response = await fetch(`${this.client.options.baseUrl}/tts/synthesize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.client.options.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: options.model ?? 'mimo-v2.5-tts',
          text: options.text,
          voice: options.voice,
          style: options.style,
          format: options.format ?? 'mp3',
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw wrapApiError({ status: response.status, error: body, url: response.url });
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      return {
        id: response.headers.get('x-request-id') ?? '',
        audio: buffer,
        model: options.model ?? 'mimo-v2.5-tts',
      };
    } catch (error) {
      throw wrapApiError(error);
    }
  }

  async clone(options: TTSCloneOptions): Promise<TTSResult> {
    try {
      const response = await fetch(`${this.client.options.baseUrl}/tts/clone`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.client.options.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: options.model ?? 'mimo-v2.5-tts',
          sample: options.sample,
          text: options.text,
          format: options.format ?? 'mp3',
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw wrapApiError({ status: response.status, error: body, url: response.url });
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      return {
        id: response.headers.get('x-request-id') ?? '',
        audio: buffer,
        model: options.model ?? 'mimo-v2.5-tts',
      };
    } catch (error) {
      throw wrapApiError(error);
    }
  }

  async design(options: TTSDesignOptions): Promise<TTSResult> {
    try {
      const response = await fetch(`${this.client.options.baseUrl}/tts/design`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.client.options.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: options.model ?? 'mimo-v2.5-tts-voicedesign',
          prompt: options.prompt,
          text: options.text,
          optimize_text_preview: options.optimizeText ?? false,
          format: options.format ?? 'mp3',
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw wrapApiError({ status: response.status, error: body, url: response.url });
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      return {
        id: response.headers.get('x-request-id') ?? '',
        audio: buffer,
        model: options.model ?? 'mimo-v2.5-tts-voicedesign',
      };
    } catch (error) {
      throw wrapApiError(error);
    }
  }

  async voices(): Promise<TTSVoicesResult> {
    try {
      const response = await fetch(`${this.client.options.baseUrl}/tts/voices`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.client.options.apiKey}`,
        },
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw wrapApiError({ status: response.status, error: body, url: response.url });
      }

      const data = await response.json() as Record<string, unknown>;
      return {
        voices: (data.voices ?? data.data ?? []) as TTSVoice[],
      };
    } catch (error) {
      throw wrapApiError(error);
    }
  }
}
