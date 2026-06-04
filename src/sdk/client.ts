import { MiMoClient, wrapApiError } from '../client/index';
import type { Config } from '../config/schema';
import { resolveCredential, inferBaseUrlFromKey } from '../auth/resolver';

export interface MiMoSDKClientOptions {
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
}

export class MiMoSDKClient {
  readonly mimo: MiMoClient;
  readonly options: MiMoSDKClientOptions;

  constructor(options: MiMoSDKClientOptions) {
    this.options = options;
    // 如果未指定 baseUrl，根据 apiKey 前缀自动推断
    const resolvedBaseUrl = options.baseUrl || inferBaseUrlFromKey(options.apiKey ?? '') || undefined;
    this.mimo = new MiMoClient({
      apiKey: options.apiKey ?? '',
      baseURL: resolvedBaseUrl,
      timeout: options.timeout,
    });
  }

  /** Create a MiMoSDKClient from CLI Config, resolving credentials automatically. */
  static async fromConfig(config: Config): Promise<MiMoSDKClient> {
    const cred = resolveCredential(config);
    return new MiMoSDKClient({
      apiKey: cred.token,
      baseUrl: config.baseUrl,
      timeout: config.timeout,
    });
  }

  /** Wrap API errors into CLIError. */
  handleError(error: unknown): never {
    throw wrapApiError(error);
  }
}
