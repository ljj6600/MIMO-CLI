import type { Config } from '../config/schema';
import { CLIError } from '../errors/base';
import { ExitCode } from '../errors/codes';
import { maskApiKey } from '../utils/sanitize';

export interface ResolvedCredential {
  token: string;
  method: 'api-key';
  source: 'flag' | 'config.json' | 'env';
}

/**
 * 根据 API Key 前缀推断 base URL：
 * - tp- 开头：TokenPlan Key → https://token-plan-cn.xiaomimimo.com/v1
 * - 其他：按量计费 Key → https://api.xiaomimimo.com/v1
 */
export function inferBaseUrlFromKey(apiKey: string): string | undefined {
  if (apiKey.startsWith('tp-')) {
    return 'https://token-plan-cn.xiaomimimo.com/v1';
  }
  // 按量计费 Key 不需要返回，使用默认 base URL 即可
  return undefined;
}

export function resolveCredential(config: Config): ResolvedCredential {
  // 1. --api-key flag
  if (config.apiKey) {
    return { token: config.apiKey, method: 'api-key', source: 'flag' };
  }

  // 2. MIMO_API_KEY env var
  const envKey = process.env.MIMO_API_KEY;
  if (envKey) {
    return { token: envKey, method: 'api-key', source: 'env' };
  }

  // 3. API key from config file
  if (config.fileApiKey) {
    return { token: config.fileApiKey, method: 'api-key', source: 'config.json' };
  }

  // 错误提示中使用脱敏示例，不泄露真实 key
  throw new CLIError(
    'No credentials found.',
    ExitCode.AUTH,
    'Log in:        mimo auth login\nPass directly:  --api-key <key>\nSet env var:    MIMO_API_KEY=<key>',
  );
}
