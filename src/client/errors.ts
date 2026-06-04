import OpenAI from 'openai';
import type { APIError } from 'openai';
import { CLIError } from '../errors/base';
import { ExitCode } from '../errors/codes';
import { mapApiError, type ApiErrorBody } from '../errors/api';
import { MiMoClient } from './index';
import { extractErrorUrl } from '../types/api';
import { resolveCredential, inferBaseUrlFromKey } from '../auth/resolver';
import type { Config } from '../config/schema';

/**
 * Extract the URL from an OpenAI APIError.
 * 使用 extractErrorUrl 辅助函数安全访问运行时属性。
 */
function getErrorUrl(err: APIError): string {
  return extractErrorUrl(err);
}

/**
 * Wrap an unknown error (typically from the OpenAI SDK) into a CLIError.
 */
export function wrapApiError(err: unknown): CLIError {
  if (err instanceof CLIError) {
    return err;
  }

  if (err instanceof OpenAI.APIConnectionError) {
    return new CLIError(
      'Network request failed.',
      ExitCode.NETWORK,
      'Check your network connection.\n' +
        'To use a proxy: set HTTPS_PROXY env var, or run: mimo config set proxy http://HOST:PORT',
    );
  }

  if (err instanceof OpenAI.RateLimitError) {
    const body = (err.error as ApiErrorBody) ?? {};
    return mapApiError(err.status ?? 429, body, getErrorUrl(err));
  }

  if (err instanceof OpenAI.AuthenticationError) {
    const body = (err.error as ApiErrorBody) ?? {};
    return mapApiError(err.status ?? 401, body, getErrorUrl(err));
  }

  if (err instanceof OpenAI.BadRequestError) {
    const body = (err.error as ApiErrorBody) ?? {};
    return mapApiError(err.status ?? 400, body, getErrorUrl(err));
  }

  if (err instanceof OpenAI.APIError) {
    const body = (err.error as ApiErrorBody) ?? {};
    return mapApiError(err.status ?? 0, body, getErrorUrl(err));
  }

  // Generic error fallback
  if (err instanceof Error) {
    if (
      err.name === 'AbortError' ||
      err.name === 'TimeoutError' ||
      err.message.includes('timed out')
    ) {
      return new CLIError(
        'Request timed out.',
        ExitCode.TIMEOUT,
        'Try increasing --timeout (e.g. --timeout 60).',
      );
    }

    return new CLIError(err.message, ExitCode.GENERAL);
  }

  return new CLIError(String(err), ExitCode.GENERAL);
}

export interface ClientConfig {
  apiKey?: string;
  fileApiKey?: string;
  fileSkApiKey?: string;
  activeKey?: 'tp' | 'sk';
  baseURL?: string;
  baseUrl?: string; // Config 类型使用 baseUrl（小写 u）
  timeout?: number;
}

/**
 * Resolve the API key from config, env, or credential store.
 * 使用统一的 resolveCredential 函数，支持 flag / env / config.json 三种来源。
 */
function resolveApiKey(config?: Partial<ClientConfig>): string {
  if (config) {
    // 构造一个最小 Config 对象传给 resolveCredential
    const partialConfig: Partial<Config> = {
      apiKey: config.apiKey,
      fileApiKey: config.fileApiKey,
      fileSkApiKey: config.fileSkApiKey,
      activeKey: config.activeKey,
    };
    try {
      return resolveCredential(partialConfig as Config).token;
    } catch {
      // resolveCredential 抛出异常，继续尝试下面的方式
    }
  }

  // 环境变量兜底
  const envKey = process.env.MIMO_API_KEY ?? process.env.MIMO_API_TOKEN;
  if (envKey) {
    return envKey;
  }

  throw new CLIError(
    'No API key provided.',
    ExitCode.AUTH,
    'Set your API key:\n' +
      '  mimo auth login          — interactive login\n' +
      '  export MIMO_API_KEY=...  — via environment variable\n' +
      '  mimo chat --api-key ...  — via flag',
  );
}

/**
 * Resolve the base URL from config or env.
 * 同时支持 baseURL（ClientConfig）和 baseUrl（Config）两种命名。
 * 如果没有显式配置 base URL，则根据 API Key 前缀自动推断。
 */
function resolveBaseURL(config?: Partial<ClientConfig>): string | undefined {
  if (config?.baseURL) {
    return config.baseURL;
  }
  if (config?.baseUrl) {
    return config.baseUrl;
  }
  if (process.env.MIMO_BASE_URL) {
    return process.env.MIMO_BASE_URL;
  }

  // 根据 API Key 前缀自动推断 base URL
  const activeKey = config?.activeKey;
  const apiKey = activeKey === 'sk'
    ? (config?.fileSkApiKey || config?.apiKey || config?.fileApiKey)
    : (config?.apiKey || config?.fileApiKey || config?.fileSkApiKey);
  if (apiKey) {
    const inferred = inferBaseUrlFromKey(apiKey);
    if (inferred) {
      return inferred;
    }
  }

  return undefined;
}

/**
 * Factory: create a MiMoClient from partial config.
 * Resolves API key and base URL from environment if not provided.
 */
export function createClient(config?: Partial<ClientConfig>): MiMoClient {
  const apiKey = resolveApiKey(config);
  const baseURL = resolveBaseURL(config);

  return new MiMoClient({
    apiKey,
    baseURL,
    timeout: config?.timeout,
  });
}
