import type { Config } from './config/schema';

export interface OptionDef {
  flag: string; // e.g., "--model <value>", "--stream"
  description: string;
  default?: unknown;
  required?: boolean;
  type?: 'number' | 'array';
}

// 命令接口，使用 Config 和 Record<string, unknown> 替代 any
export interface Command {
  name: string;
  description: string;
  usage?: string;
  options?: OptionDef[];
  examples?: string[];
  apiDocs?: string;
  execute(config: Config, flags: Record<string, unknown>): Promise<void>;
}

// 命令规格接口，使用 Config 和 Record<string, unknown> 替代 any
export interface CommandSpec {
  name: string;
  description: string;
  usage?: string;
  options?: OptionDef[];
  examples?: string[];
  apiDocs?: string;
  run(config: Config, flags: Record<string, unknown>): Promise<void>;
}

export function defineCommand(spec: CommandSpec): Command {
  return {
    name: spec.name,
    description: spec.description,
    usage: spec.usage,
    options: spec.options,
    examples: spec.examples,
    apiDocs: spec.apiDocs,
    execute: spec.run,
  };
}

/** Global flags shared by all commands — drives the parser's type resolution. */
export const GLOBAL_OPTIONS: OptionDef[] = [
  { flag: '--api-key <value>', description: 'flag.apiKey' },
  { flag: '--base-url <value>', description: 'flag.baseUrl' },
  { flag: '--output <value>', description: 'flag.output', default: 'text' },
  { flag: '--timeout <seconds>', description: 'flag.timeout', default: 300, type: 'number' },
  { flag: '--quiet', description: 'flag.quiet' },
  { flag: '--verbose', description: 'flag.verbose' },
  { flag: '--no-color', description: 'flag.noColor' },
  { flag: '--dry-run', description: 'flag.dryRun' },
  { flag: '--non-interactive', description: 'flag.nonInteractive' },
  { flag: '--help', description: 'flag.help' },
  { flag: '--version', description: 'flag.version' },
];
