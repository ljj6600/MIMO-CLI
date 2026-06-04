import { MiMoSDKClient, type MiMoSDKClientOptions } from './client';
import { ChatSDK, type ChatOptions, type ChatResult } from './chat';
import { VisionSDK, type VisionOptions, type VisionResult } from './vision';
import { ASRSDK, type ASROptions, type ASRResult } from './asr';
import { TTSSDK, type TTSSynthesizeOptions, type TTSCloneOptions, type TTSDesignOptions, type TTSResult, type TTSVoicesResult } from './tts';
import type { Config } from '../config/schema';

export { MiMoSDKClient, type MiMoSDKClientOptions } from './client';
export { ChatSDK, type ChatOptions, type ChatResult } from './chat';
export { VisionSDK, type VisionOptions, type VisionResult } from './vision';
export { ASRSDK, type ASROptions, type ASRResult } from './asr';
export { TTSSDK, type TTSSynthesizeOptions, type TTSCloneOptions, type TTSDesignOptions, type TTSResult, type TTSVoicesResult } from './tts';

export interface MiMoSDKOptions {
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
}

export class MiMoSDK {
  readonly chat: ChatSDK;
  readonly vision: VisionSDK;
  readonly asr: ASRSDK;
  readonly tts: TTSSDK;
  readonly client: MiMoSDKClient;

  constructor(options: MiMoSDKOptions) {
    this.client = new MiMoSDKClient(options);
    this.chat = new ChatSDK(this.client);
    this.vision = new VisionSDK(this.client);
    this.asr = new ASRSDK(this.client);
    this.tts = new TTSSDK(this.client);
  }

  /** Create a MiMoSDK from CLI Config, resolving credentials automatically. */
  static async fromConfig(config: Config): Promise<MiMoSDK> {
    const client = await MiMoSDKClient.fromConfig(config);
    return new MiMoSDK({
      apiKey: client.options.apiKey,
      baseUrl: client.options.baseUrl,
      timeout: client.options.timeout,
    });
  }
}
