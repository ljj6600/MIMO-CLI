import type { Config } from '../config/schema';
import { readConfigFile, writeConfigFile } from '../config/loader';
import { promptText } from '../utils/prompt';
import { isInteractive } from '../utils/env';
import { maskApiKey } from '../utils/sanitize';
import { inferBaseUrlFromKey } from '../auth/resolver';
import { CLIError } from '../errors/base';
import { ExitCode } from '../errors/codes';
import { t } from '../i18n';

export async function ensureAuth(config: Config): Promise<void> {
  if (config.apiKey || config.fileApiKey || config.fileSkApiKey) return;

  const envKey = process.env.MIMO_API_KEY;
  if (envKey) return;

  if (!isInteractive()) {
    throw new CLIError(
      t('auth.noCreds'),
      ExitCode.AUTH,
      t('auth.noCredsHint'),
    );
  }

  process.stderr.write('\n  Not logged in.\n');
  process.stderr.write('  mimo auth login              Log in with an API key\n');
  process.stderr.write('  mimo auth login --api-key    Save an API key directly\n\n');
  process.exit(ExitCode.AUTH);
}

export async function persistApiKey(config: Config, key: string): Promise<void> {
  const data: Record<string, unknown> = { ...(readConfigFile() as Record<string, unknown>) };

  // 根据 Key 前缀决定存储到哪个字段
  if (key.startsWith('tp-')) {
    data.api_key = key;
    data.active_key = 'tp';
  } else {
    data.sk_api_key = key;
    data.active_key = 'sk';
  }

  // 根据 API Key 前缀自动设置对应的 base URL（切换 Key 类型时始终更新）
  const inferredBaseUrl = inferBaseUrlFromKey(key);
  if (inferredBaseUrl) {
    // TokenPlan Key：自动设置对应的 base URL
    data.base_url = inferredBaseUrl;
  } else {
    // 按量计费 Key：始终设置为标准 API URL
    data.base_url = 'https://api.xiaomimimo.com/v1';
  }

  await writeConfigFile(data);
  config.fileApiKey = data.api_key as string | undefined;
  config.fileSkApiKey = data.sk_api_key as string | undefined;
  config.activeKey = data.active_key as 'tp' | 'sk';

  // 输出时使用脱敏格式，避免泄露完整 API Key
  const keyType = key.startsWith('tp-') ? 'TokenPlan' : '按量计费';
  process.stderr.write(`${t('auth.keySaved')} ${config.configPath ?? '~/.mimo/config.json'} (${maskApiKey(key)}, ${keyType})\n`);
  if (inferredBaseUrl) {
    process.stderr.write(`${t('auth.baseUrlAuto')}${inferredBaseUrl}\n`);
  }
}

export async function promptApiKey(): Promise<string> {
  process.stderr.write('\n  ' + t('auth.promptTitle') + '\n');
  process.stderr.write('  ' + t('auth.promptPayKey') + '\n');
  process.stderr.write('  ' + t('auth.promptTpKey') + '\n\n');
  const input = await promptText(t('auth.promptLabel'));
  if (!input) throw new CLIError(t('auth.keyRequired'), ExitCode.AUTH);
  return input;
}
