import type { Config } from '../../config/schema';
import { readConfigFile, writeConfigFile } from '../../config/loader';
import { isInteractive } from '../../utils/env';
import { promptLongText } from '../../utils/prompt';
import { CLIError } from '../../errors/base';
import { ExitCode } from '../../errors/codes';
import { t } from '../../i18n';
import { VERSION } from '../../version';
import { autoFetchCookie } from './cookie-fetcher';

function clearSavedCookie(): void {
  try {
    const data = { ...(readConfigFile() as Record<string, unknown>) };
    delete data.platform_cookie;
    writeConfigFile(data);
  } catch {
  }
}

export async function resolveCookie(config: Config, flags: Record<string, unknown>): Promise<string> {
  if (flags.cookie) return flags.cookie as string;

  if (config.platformCookie) return config.platformCookie;

  const autoCookie = await autoFetchCookie();
  if (autoCookie) {
    const data = { ...(readConfigFile() as Record<string, unknown>) };
    data.platform_cookie = autoCookie;
    await writeConfigFile(data);
    config.platformCookie = autoCookie;
    return autoCookie;
  }

  if (!isInteractive()) {
    throw new CLIError(t('quota.noCookie'), ExitCode.GENERAL);
  }

  process.stderr.write('\n' + t('quota.autoFetchFailed') + '\n');
  process.stderr.write(t('quota.cookieHint') + '\n\n');

  const input = await promptLongText(t('quota.cookiePrompt'));
  if (!input) {
    throw new CLIError(t('quota.noCookie'), ExitCode.GENERAL);
  }

  const data = { ...(readConfigFile() as Record<string, unknown>) };
  data.platform_cookie = input;
  await writeConfigFile(data);
  config.platformCookie = input;
  process.stderr.write(t('quota.cookieSaved') + '\n');

  return input;
}

export function platformHeaders(cookie: string): Record<string, string> {
  return {
    Cookie: cookie,
    Accept: 'application/json',
    'User-Agent': `mimo-cli/${VERSION}`,
  };
}

export function checkCookieAuth(response: { code?: number }): void {
  const code = response?.code;
  if (code === 401 || code === 403 || code === -401 || code === -403) {
    clearSavedCookie();
    throw new CLIError(t('quota.cookieInvalid'), ExitCode.GENERAL, t('quota.cookieInvalidHint'));
  }
}

export async function fetchPlatformApi<T>(url: string, cookie: string): Promise<T> {
  try {
    const resp = await fetch(url, {
      method: 'GET',
      headers: platformHeaders(cookie),
    });

    if (resp.status === 401 || resp.status === 403) {
      clearSavedCookie();
      throw new CLIError(t('quota.cookieInvalid'), ExitCode.GENERAL, t('quota.cookieInvalidHint'));
    }

    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
    }

    const text = await resp.text();
    try {
      return JSON.parse(text) as T;
    } catch {
      clearSavedCookie();
      throw new CLIError(t('quota.cookieInvalid'), ExitCode.GENERAL, t('quota.cookieInvalidHint'));
    }
  } catch (err) {
    if (err instanceof CLIError) throw err;
    clearSavedCookie();
    const msg = err instanceof Error ? err.message : String(err);
    throw new CLIError(t('quota.fetchFailed') + msg, ExitCode.GENERAL);
  }
}
