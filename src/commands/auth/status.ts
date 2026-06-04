import { defineCommand } from '../../command';
import type { Config } from '../../config/schema';
import { resolveCredential, inferBaseUrlFromKey } from '../../auth/resolver';
import { maskApiKey } from '../../utils/sanitize';
import { formatOutput } from '../../output/formatter';

export const authStatusCommand = defineCommand({
  name: 'auth status',
  description: 'cmd.authStatus.desc',
  usage: 'mimo auth status',
  async run(config: Config, _flags: Record<string, unknown>): Promise<void> {
    try {
      const cred = resolveCredential(config);
      const keyType = cred.token.startsWith('tp-') ? 'TokenPlan' : '按量计费';
      const inferredBaseUrl = inferBaseUrlFromKey(cred.token);
      const data: Record<string, unknown> = {
        authenticated: true,
        method: cred.method,
        activeKey: config.activeKey ?? 'tp',
        apiKey: maskApiKey(cred.token),
        keyType,
        baseUrl: config.baseUrl || inferredBaseUrl || 'https://api.xiaomimimo.com/v1',
        source: cred.source,
        configPath: config.configPath,
      };

      // 显示另一个 Key 的状态
      if (config.activeKey === 'tp' && config.fileSkApiKey) {
        data.standbyKey = maskApiKey(config.fileSkApiKey) + ' (按量计费)';
      } else if (config.activeKey === 'sk' && config.fileApiKey) {
        data.standbyKey = maskApiKey(config.fileApiKey) + ' (TokenPlan)';
      }

      console.log(formatOutput(data, config));
    } catch (err) {
      // 凭证解析失败时记录原因，帮助用户排查认证问题
      if (config.verbose) {
        process.stderr.write(`Debug: credential resolution failed — ${err instanceof Error ? err.message : String(err)}\n`);
      }
      const data = {
        authenticated: false,
        method: null,
        activeKey: config.activeKey ?? 'tp',
        apiKey: null,
        keyType: null,
        baseUrl: config.baseUrl || 'https://api.xiaomimimo.com/v1',
        source: null,
        configPath: config.configPath,
      };
      console.log(formatOutput(data, config));
    }
  },
});
