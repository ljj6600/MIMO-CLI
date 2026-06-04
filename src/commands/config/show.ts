import { defineCommand } from '../../command';
import type { Config } from '../../config/schema';
import { readConfigFile } from '../../config/loader';
import { maskApiKey } from '../../utils/sanitize';
import { formatOutput } from '../../output/formatter';
import { t } from '../../i18n';

// 需要脱敏的敏感配置字段
const SENSITIVE_KEYS = new Set(['api_key', 'apiKey', 'api-key']);

export const configShowCommand = defineCommand({
  name: 'config show',
  description: 'cmd.configShow.desc',
  usage: 'mimo config show',
  async run(config: Config, _flags: Record<string, unknown>): Promise<void> {
    const file = readConfigFile();
    const data: Record<string, unknown> = {
      baseUrl: config.baseUrl,
      output: config.output,
      timeout: config.timeout,
      defaultModel: config.defaultModel ?? t('general.notSet'),
      configPath: config.configPath,
    };

    if (file.api_key) {
      data.apiKey = maskApiKey(file.api_key);
    } else {
      data.apiKey = t('general.notSet');
    }

    if (file.base_url) {
      data.fileBaseUrl = file.base_url;
    }

    // 对文件中的其他字段也做敏感信息脱敏
    for (const [k, v] of Object.entries(file)) {
      if (k !== 'api_key' && k !== 'base_url' && SENSITIVE_KEYS.has(k) && typeof v === 'string') {
        data[k] = maskApiKey(v);
      }
    }

    console.log(formatOutput(data, config));
  },
});
