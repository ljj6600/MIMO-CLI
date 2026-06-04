import { defineCommand } from '../command';
import { t } from '../i18n';

export const updateCommand = defineCommand({
  name: 'update',
  description: 'cmd.update.desc',
  usage: 'mimo update',
  async run(): Promise<void> {
    process.stderr.write(t('update.notImplemented'));
  },
});
