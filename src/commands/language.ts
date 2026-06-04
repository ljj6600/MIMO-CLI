import { defineCommand } from '../command';
import type { Config } from '../config/schema';
import { readConfigFile, writeConfigFile } from '../config/loader';
import { setLocale, getLocale, t } from '../i18n';

export const languageCommand = defineCommand({
  name: 'language',
  description: 'cmd.language.desc',
  usage: 'mimo language <zh|en>',
  options: [],
  examples: [
    'mimo language zh',
    'mimo language en',
  ],
  async run(config: Config, flags: Record<string, unknown>): Promise<void> {
    const positionalArgs = flags._positional as string[] | undefined;
    const lang = positionalArgs?.[0];

    if (!lang) {
      // 显示当前语言
      process.stderr.write(t('language.current') + getLocale() + '\n');
      return;
    }

    if (lang !== 'zh' && lang !== 'en') {
      process.stderr.write(t('language.invalid') + '\n');
      process.stderr.write(t('language.hint') + '\n');
      process.exit(2);
    }

    // 保存到配置文件
    const data = readConfigFile() as Record<string, unknown>;
    data.language = lang;
    await writeConfigFile(data);

    // 立即切换当前会话语言
    setLocale(lang as 'zh' | 'en');

    process.stderr.write(t('language.changed') + '\n');
  },
});
