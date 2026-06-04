import { formatText } from './text';
import { formatJson } from './json';

export type OutputFormat = 'text' | 'json';

/** formatOutput/detectOutputFormat 接受的配置类型：字符串、带 output 字段的对象、或 undefined */
export type OutputConfig = string | { output?: string } | undefined;

export function detectOutputFormat(config?: OutputConfig): OutputFormat {
  if (config === 'json' || config === 'text') {
    return config;
  }
  if (typeof config === 'object' && config !== null) {
    if (config.output === 'json' || config.output === 'text') {
      return config.output;
    }
  }
  if (!process.stdout.isTTY) {
    return 'json';
  }
  return 'text';
}

export function formatOutput(data: unknown, config?: OutputConfig): string {
  const format = detectOutputFormat(config);
  switch (format) {
    case 'json':
      return formatJson(data);
    case 'text':
      return formatText(data);
  }
}

export function dryRun(config: { dryRun?: boolean; output?: string }, body: unknown): boolean {
  if (!config.dryRun) return false;
  console.log(formatOutput({ request: body }, detectOutputFormat(config.output)));
  return true;
}
