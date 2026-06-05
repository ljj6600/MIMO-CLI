import { defineCommand } from '../../command';
import type { Config } from '../../config/schema';
import { readConfigFile, writeConfigFile } from '../../config/loader';
import { maskApiKey } from '../../utils/sanitize';
import { CLIError } from '../../errors/base';
import { ExitCode } from '../../errors/codes';
import { t } from '../../i18n';

const ALLOWED_KEYS = new Set([
  'api_key',
  'sk_api_key',
  'active_key',
  'base_url',
  'output',
  'timeout',
  'default_model',
  'language',
]);

// 允许的 key 格式：只包含字母、数字、下划线
const KEY_PATTERN = /^[a-zA-Z0-9_]+$/;

export const configSetCommand = defineCommand({
  name: 'config set',
  description: 'cmd.configSet.desc',
  usage: 'mimo config set --key <key> --value <value>',
  options: [
    { flag: '--key <key>', description: 'flag.config.key', required: true },
    { flag: '--value <value>', description: 'flag.config.value', required: true },
  ],
  examples: [
    'mimo config set --key base_url --value https://api.xiaomimimo.com/v1',
    'mimo config set --key output --value json',
    'mimo config set --key timeout --value 60',
    'mimo config set --key default_model --value MiMo-7B-RL',
  ],
  async run(_config: Config, flags: Record<string, unknown>): Promise<void> {
    const key = flags.key as string | undefined;
    const value = flags.value as string | undefined;

    if (!key) {
      throw new CLIError(t('config.keyRequired'), ExitCode.USAGE);
    }

    // 输入验证：拒绝包含特殊字符的 key
    if (!KEY_PATTERN.test(key)) {
      throw new CLIError(
        t('config.invalidKey') + '"' + key + '"',
        ExitCode.INVALID_INPUT,
        t('config.invalidKeyChars'),
      );
    }

    if (!ALLOWED_KEYS.has(key)) {
      throw new CLIError(
        t('config.invalidKey') + '"' + key + '"',
        ExitCode.USAGE,
        t('config.validKeys') + Array.from(ALLOWED_KEYS).join(', '),
      );
    }

    if (value === undefined || value === '') {
      throw new CLIError(t('config.valueRequired'), ExitCode.USAGE);
    }

    const data = readConfigFile() as Record<string, unknown>;

    // Type coercion for known keys
    if (key === 'timeout') {
      const num = Number(value);
      if (!Number.isFinite(num) || num <= 0) {
        throw new CLIError(t('config.setTimeout'), ExitCode.USAGE);
      }
      data[key] = num;
    } else if (key === 'output' && value !== 'text' && value !== 'json') {
      throw new CLIError(t('config.setOutput'), ExitCode.USAGE);
    } else if (key === 'active_key' && value !== 'tp' && value !== 'sk') {
      throw new CLIError(t('config.invalidActiveKey'), ExitCode.USAGE);
    } else {
      data[key] = value;
    }

    // 当切换 active_key 时，同步更新 base_url
    if (key === 'active_key') {
      const targetKey = value === 'sk' ? data.sk_api_key : data.api_key;
      if (typeof targetKey === 'string') {
        const inferred = targetKey.startsWith('tp-')
          ? 'https://token-plan-cn.xiaomimimo.com/v1'
          : 'https://api.xiaomimimo.com/v1';
        data.base_url = inferred;
      }
    }

    await writeConfigFile(data);
    // 输出时对敏感字段做脱敏处理
    const displayValue = (key === 'api_key' || key === 'sk_api_key') ? maskApiKey(String(value)) : value;
    process.stderr.write(t('config.setDone') + ' ' + key + ' = ' + displayValue + '\n');
  },
});
