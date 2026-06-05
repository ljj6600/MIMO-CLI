import { defineCommand } from '../command';
import { registry } from '../registry';

export const helpCommand = defineCommand({
  name: 'help',
  description: 'cmd.help.desc',
  usage: 'mimo help [command]',
  options: [
    { flag: '--command <path>', description: 'flag.help.command' },
  ],
  async run(_config: unknown, flags: Record<string, unknown>): Promise<void> {
    const commandPath = typeof flags.command === 'string'
      ? flags.command.split(' ')
      : [];
    registry.printHelp(commandPath);
  },
});
