import { defineCommand } from '../command';
import { registry } from '../registry';

export const helpCommand = defineCommand({
  name: 'help',
  description: 'cmd.help.desc',
  usage: 'mimo help [command]',
  options: [
    { flag: '--command <path>', description: 'Command path to get help for (e.g. "auth login")' },
  ],
  async run(_config: unknown, flags: Record<string, unknown>): Promise<void> {
    const commandPath = typeof flags.command === 'string'
      ? flags.command.split(' ')
      : [];
    registry.printHelp(commandPath);
  },
});
