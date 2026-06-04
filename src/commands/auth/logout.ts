import { defineCommand } from '../../command';
import type { Config } from '../../config/schema';
import { readConfigFile, writeConfigFile } from '../../config/loader';
import { t } from '../../i18n';

export const authLogoutCommand = defineCommand({
  name: 'auth logout',
  description: 'cmd.authLogout.desc',
  usage: 'mimo auth logout',
  async run(config: Config, _flags: Record<string, unknown>): Promise<void> {
    const data = readConfigFile() as Record<string, unknown>;

    if (!data.api_key && !data.sk_api_key) {
      process.stderr.write(t('auth.logoutNoKey') + '\n');
      return;
    }

    delete data.api_key;
    delete data.sk_api_key;
    delete data.active_key;
    await writeConfigFile(data);
    config.fileApiKey = undefined;
    config.fileSkApiKey = undefined;
    config.activeKey = undefined;
    process.stderr.write(t('auth.logoutDone') + '\n');
  },
});
