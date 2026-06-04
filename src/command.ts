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
  { flag: '--api-key <value>', description: 'Override API Key from config' },
  { flag: '--base-url <value>', description: 'Override API base URL' },
  { flag: '--output <value>', description: 'Output format (text/json)', default: 'text' },
  { flag: '--timeout <seconds>', description: 'Request timeout in seconds', default: 300, type: 'number' },
  { flag: '--quiet', description: 'Suppress non-essential output' },
  { flag: '--verbose', description: 'Show verbose logging' },
  { flag: '--no-color', description: 'Disable colored output' },
  { flag: '--dry-run', description: 'Print request body without executing' },
  { flag: '--non-interactive', description: 'Non-interactive mode' },
  { flag: '--help', description: 'Show help' },
  { flag: '--version', description: 'Show version' },
];
