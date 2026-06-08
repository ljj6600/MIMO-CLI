import { defineCommand } from '../../command';
import type { Config } from '../../config/schema';
import { readConfigFile, writeConfigFile } from '../../config/loader';
import { isInteractive } from '../../utils/env';
import { promptLongText } from '../../utils/prompt';
import { CLIError } from '../../errors/base';
import { ExitCode } from '../../errors/codes';
import { t } from '../../i18n';

export const authCookieCommand = defineCommand({
  name: 'auth cookie',
  description: 'cmd.authCookie.desc',
  usage: 'mimo auth cookie [--cookie <value>]',
  options: [
    { flag: '--cookie <value>', description: 'flag.authCookie.cookie' },
  ],
  examples: [
    'mimo auth cookie                           # 交互式输入',
    'mimo auth cookie --cookie "serviceToken=xxx; userId=yyy"',
  ],
  async run(config: Config, flags: Record<string, unknown>): Promise<void> {
    let cookie = flags.cookie as string | undefined;

    if (!cookie) {
      if (!isInteractive()) {
        throw new CLIError(
          t('cookie.noCookieProvided'),
          ExitCode.AUTH,
          t('cookie.nonInteractiveHint'),
        );
      }

      process.stderr.write('\n' + t('cookie.instructions') + '\n\n');

      cookie = await promptLongText(t('cookie.prompt'));
    }

    if (!cookie || cookie.trim().length === 0) {
      throw new CLIError(t('cookie.empty'), ExitCode.AUTH);
    }

    const data = { ...(readConfigFile() as Record<string, unknown>) };
    data.platform_cookie = cookie.trim();
    await writeConfigFile(data);
    config.platformCookie = cookie.trim();

    process.stderr.write('\n' + t('cookie.saved') + '\n');
  },
});
