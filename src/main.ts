import { scanCommandPath, parseFlags } from './args';
import { registry } from './registry';
import { GLOBAL_OPTIONS } from './command';
import { handleError } from './errors/handler';
import { loadConfig } from './config/loader';
import type { Config } from './config/schema';
import { ensureAuth } from './auth/setup';
import { VERSION } from './version';
import { initLocale, t } from './i18n';

// Command imports — management commands (created in this agent)
import { authLoginCommand } from './commands/auth/login';
import { authStatusCommand } from './commands/auth/status';
import { authLogoutCommand } from './commands/auth/logout';
import { configShowCommand } from './commands/config/show';
import { configSetCommand } from './commands/config/set';
import { updateCommand } from './commands/update';
import { helpCommand } from './commands/help';
import { languageCommand } from './commands/language';
import { uninstallCommand } from './commands/uninstall';

// Command imports — API commands (created by another agent in parallel, using default exports)
import chatCommand from './commands/chat';
import replCommand from './commands/repl';
import visionCommand from './commands/vision';
import asrCommand from './commands/asr';
import ttsSynthesizeCommand from './commands/tts/synthesize';
import ttsCloneCommand from './commands/tts/clone';
import ttsDesignCommand from './commands/tts/design';
import ttsVoicesCommand from './commands/tts/voices';

// Register all commands
registry.register('chat', chatCommand);
registry.register('repl', replCommand);
registry.register('vision', visionCommand);
registry.register('asr', asrCommand);
registry.register('tts synthesize', ttsSynthesizeCommand);
registry.register('tts generate', ttsSynthesizeCommand); // alias
registry.register('tts clone', ttsCloneCommand);
registry.register('tts design', ttsDesignCommand);
registry.register('tts voices', ttsVoicesCommand);
registry.register('auth login', authLoginCommand);
registry.register('auth status', authStatusCommand);
registry.register('auth logout', authLogoutCommand);
registry.register('config show', configShowCommand);
registry.register('config set', configSetCommand);
registry.register('update', updateCommand);
registry.register('help', helpCommand);
registry.register('language', languageCommand);
registry.register('uninstall', uninstallCommand);

// Commands that don't require authentication
const NO_AUTH_COMMANDS = [
  ['auth', 'login'],
  ['auth', 'status'],
  ['auth', 'logout'],
  ['config', 'show'],
  ['config', 'set'],
  ['update'],
  ['help'],
  ['language'],
  ['uninstall'],
];

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  process.stderr.write(t('main.interrupted') + '\n');
  process.exit(130);
});

// Handle stdout EPIPE gracefully (e.g., piped to `head` that exits early)
process.stdout.on('error', (e: NodeJS.ErrnoException) => {
  if (e.code === 'EPIPE') process.exit(0);
  else throw e;
});

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (err: unknown) => {
  handleError(err);
});

process.on('unhandledRejection', (err: unknown) => {
  handleError(err);
});

export async function main(): Promise<void> {
  let argv: string[];
  try {
    argv = process.argv.slice(2);
  } catch (err) {
    // 极端情况：process.argv 不可用
    process.stderr.write(t('main.fatalArgv'));
    process.exit(1);
  }

  // 1. --version / -v → print version and exit
  if (argv.includes('--version') || argv.includes('-v')) {
    console.log(`mimo ${VERSION}`);
    process.exit(0);
  }

  // 2. scanCommandPath to extract command path
  const commandPath = scanCommandPath(argv, GLOBAL_OPTIONS);

  // 3. --help / -h → print help and exit (before needing config)
  if (argv.includes('--help') || argv.includes('-h')) {
    const config = loadConfig({});
    initLocale((config as any).language);
    registry.printHelp(commandPath);
    process.exit(0);
  }

  // 4. No command → print help + show login prompt if not authenticated
  if (commandPath.length === 0) {
    const config = loadConfig({});
    initLocale((config as any).language);
    registry.printHelp([]);

    const hasKey = !!(config.apiKey || config.fileApiKey || config.fileSkApiKey || process.env.MIMO_API_KEY);
    if (!hasKey) {
      process.stderr.write(t('main.notLoggedIn') + '\n');
      process.stderr.write(t('main.loginHint1') + '\n');
      process.stderr.write(t('main.loginHint2') + '\n\n');
    }
    process.exit(0);
  }

  // 5. registry.resolve(commandPath) → get command
  const { command, extra } = registry.resolve(commandPath);

  // 6. parseFlags with global + command options
  const flags = parseFlags(argv, [...GLOBAL_OPTIONS, ...(command.options ?? [])]);

  // Pass positional args
  if (extra.length > 0) {
    (flags as Record<string, unknown>)._positional = extra;
  }

  // 7. loadConfig — 在 parseFlags 之后调用，这样 --api-key 等 flag 能传入 config
  let config: Config;
  try {
    config = loadConfig(flags as any);
  } catch (err) {
    // 配置加载失败时给出明确提示
    handleError(err);
    process.exit(1);
  }

  // 初始化界面语言
  initLocale((config as any).language);

  // 8. ensureAuth — skip for auth/config/update/help commands
  const needsAuth = !NO_AUTH_COMMANDS.some(
    (cmd) => cmd.every((c, i) => commandPath[i] === c),
  );
  if (needsAuth) {
    await ensureAuth(config);
  }

  // 9. Execute the command
  await command.execute(config, flags);
}

if (import.meta.main) {
  main().catch(handleError);
}
