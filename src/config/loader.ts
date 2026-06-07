import { readFileSync, writeFileSync, renameSync, existsSync } from 'fs';
import { parseConfigFile, type Config, type ConfigFile } from './schema';
import { ensureConfigDir, getConfigPath } from './paths';
import { detectOutputFormat, type OutputFormat } from '../output/formatter';
import { inferBaseUrlFromKey } from '../auth/resolver';
import type { GlobalFlags } from '../types/flags';
import { t } from '../i18n';

const DEFAULT_BASE_URL = 'https://api.xiaomimimo.com/v1';

export function readConfigFile(): ConfigFile {
  const path = getConfigPath();
  if (!existsSync(path)) return {};
  try {
    return parseConfigFile(JSON.parse(readFileSync(path, 'utf-8')));
  } catch (err) {
    // 配置文件解析失败，记录具体错误以便排查
    const detail = err instanceof Error ? err.message : String(err);
    process.stderr.write(t('config.corrupted') + detail + t('config.corruptedHint'));
    return {};
  }
}

export async function writeConfigFile(data: Record<string, unknown>): Promise<void> {
  ensureConfigDir();
  const path = getConfigPath();
  const tmp = path + '.tmp';
  try {
    writeFileSync(tmp, JSON.stringify(data, null, 2) + '\n', { mode: 0o600 });
    renameSync(tmp, path);
  } catch (err) {
    // 写入配置文件失败时给出明确提示
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to write config file: ${detail}. Check file permissions for ${path}`);
  }
}

export function loadConfig(flags: GlobalFlags): Config {
  const file = readConfigFile();

  const apiKey = flags.apiKey || undefined;
  const fileApiKey = file.api_key;
  const fileSkApiKey = file.sk_api_key;
  const activeKey = file.active_key || 'tp'; // 默认使用 tp Key

  // 当 --api-key flag 传入时，根据 key 前缀自动推断 base URL
  let baseUrl: string;
  if (flags.baseUrl) {
    baseUrl = flags.baseUrl;
  } else if (process.env.MIMO_BASE_URL) {
    baseUrl = process.env.MIMO_BASE_URL;
  } else if (apiKey) {
    // flag 传入的 key 优先推断
    const inferred = inferBaseUrlFromKey(apiKey);
    baseUrl = inferred || file.base_url || DEFAULT_BASE_URL;
  } else {
    // 根据 active_key 选择对应的 base URL
    if (activeKey === 'sk' && fileSkApiKey) {
      const inferred = inferBaseUrlFromKey(fileSkApiKey);
      baseUrl = inferred || file.base_url || DEFAULT_BASE_URL;
    } else {
      baseUrl = file.base_url || DEFAULT_BASE_URL;
    }
  }

  const output: OutputFormat = detectOutputFormat(
    flags.output || process.env.MIMO_OUTPUT || file.output,
  );

  const envTimeout = process.env.MIMO_TIMEOUT ? Number(process.env.MIMO_TIMEOUT) : undefined;
  const validEnvTimeout = envTimeout !== undefined && Number.isFinite(envTimeout) && envTimeout > 0
    ? envTimeout : undefined;
  const timeout = flags.timeout ?? validEnvTimeout ?? file.timeout ?? 300;

  return {
    apiKey,
    fileApiKey,
    fileSkApiKey,
    activeKey,
    configPath: getConfigPath(),
    baseUrl,
    output,
    timeout,
    defaultModel: file.default_model,
    language: (file.language as string | undefined) || undefined,
    verbose: flags.verbose || process.env.MIMO_VERBOSE === '1',
    quiet: flags.quiet || false,
    noColor: flags.noColor || process.env.NO_COLOR !== undefined || !process.stdout.isTTY,
    dryRun: flags.dryRun || false,
    nonInteractive: flags.nonInteractive || false,
    platformCookie: file.platform_cookie,
  };
}
