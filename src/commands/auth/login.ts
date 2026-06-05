import { defineCommand } from '../../command';
import type { Config } from '../../config/schema';
import { persistApiKey, promptApiKey } from '../../auth/setup';
import { isInteractive } from '../../utils/env';
import { maskApiKey } from '../../utils/sanitize';
import { CLIError } from '../../errors/base';
import { ExitCode } from '../../errors/codes';
import { t } from '../../i18n';

export const authLoginCommand = defineCommand({
  name: 'auth login',
  description: 'cmd.authLogin.desc',
  usage: 'mimo auth login [--api-key <key>]',
  options: [
    { flag: '--api-key <key>', description: 'flag.auth.apiKey' },
  ],
  examples: [
    'mimo auth login',
    'mimo auth login --api-key sk-xxxxx       # 按量计费 Key',
    'mimo auth login --api-key tp-xxxxx       # TokenPlan Key',
  ],
  async run(config: Config, flags: Record<string, unknown>): Promise<void> {
    let apiKey = flags.apiKey as string | undefined;

    if (!apiKey) {
      if (!isInteractive()) {
        throw new CLIError(
          t('auth.noKeyProvided'),
          ExitCode.AUTH,
          t('auth.noKeyHint'),
        );
      }
      apiKey = await promptApiKey();
    }

    if (!apiKey || apiKey.trim().length === 0) {
      throw new CLIError(t('auth.keyEmpty'), ExitCode.AUTH);
    }

    await persistApiKey(config, apiKey.trim());
  },
});
