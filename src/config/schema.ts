export interface ConfigFile {
  api_key?: string;
  base_url?: string;
  output?: 'text' | 'json';
  timeout?: number;
  default_model?: string;
  language?: 'zh' | 'en';
}

const VALID_OUTPUTS = new Set<string>(['text', 'json']);

export function parseConfigFile(raw: unknown): ConfigFile {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const obj = raw as Record<string, unknown>;
  const out: ConfigFile = {};

  if (typeof obj.api_key === 'string') out.api_key = obj.api_key;
  if (typeof obj.base_url === 'string' && obj.base_url.startsWith('http')) out.base_url = obj.base_url;
  if (typeof obj.output === 'string' && VALID_OUTPUTS.has(obj.output)) out.output = obj.output as ConfigFile['output'];
  if (typeof obj.timeout === 'number' && obj.timeout > 0) out.timeout = obj.timeout;
  if (typeof obj.default_model === 'string' && obj.default_model.length > 0) out.default_model = obj.default_model;
  if (typeof obj.language === 'string' && (obj.language === 'zh' || obj.language === 'en')) out.language = obj.language as ConfigFile['language'];

  return out;
}

export interface Config {
  apiKey?: string;
  fileApiKey?: string;
  configPath?: string;
  baseUrl: string;
  output: 'text' | 'json';
  timeout: number;
  defaultModel?: string;
  verbose: boolean;
  quiet: boolean;
  noColor: boolean;
  dryRun: boolean;
  nonInteractive: boolean;
  language?: string;
}
