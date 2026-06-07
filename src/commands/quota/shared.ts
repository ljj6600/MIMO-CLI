import type { Config } from '../../config/schema';
import { readConfigFile, writeConfigFile } from '../../config/loader';
import { isInteractive } from '../../utils/env';
import { promptLongText } from '../../utils/prompt';
import { t } from '../../i18n';
import { VERSION } from '../../version';

/**
 * 获取有效的 Cookie：优先使用 --cookie 参数，其次配置文件，最后交互式输入。
 * 交互式输入后自动保存到配置文件。
 */
export async function resolveCookie(config: Config, flags: Record<string, unknown>): Promise<string> {
  const cookie = (flags.cookie as string) || config.platformCookie;

  if (cookie) return cookie;

  if (!isInteractive()) {
    process.stderr.write(t('quota.noCookie') + '\n');
    process.exit(1);
  }

  process.stderr.write(t('quota.cookieHint') + '\n');
  const input = await promptLongText(t('quota.cookiePrompt'));
  if (!input) {
    process.stderr.write(t('quota.noCookie') + '\n');
    process.exit(1);
  }

  // 保存到配置文件，下次无需再输入
  const data = { ...(readConfigFile() as Record<string, unknown>) };
  data.platform_cookie = input;
  await writeConfigFile(data);
  config.platformCookie = input;
  process.stderr.write(t('quota.cookieSaved') + '\n');

  return input;
}

/** 构建平台 API 请求头 */
export function platformHeaders(cookie: string): Record<string, string> {
  return {
    Cookie: cookie,
    Accept: 'application/json',
    'User-Agent': `mimo-cli/${VERSION}`,
  };
}

/** 通用平台 API 请求，失败时输出错误并退出 */
export async function fetchPlatformApi<T>(url: string, cookie: string): Promise<T> {
  try {
    const resp = await fetch(url, {
      method: 'GET',
      headers: platformHeaders(cookie),
    });

    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
    }

    return await resp.json() as T;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(t('quota.fetchFailed') + msg + '\n');
    process.exit(1);
  }
}
