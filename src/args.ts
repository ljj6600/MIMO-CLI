import type { OptionDef } from './command';

function kebabToCamel(str: string): string {
  return str.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
}

/** Extract camelCase flag name from an OptionDef.flag string, e.g. '--max-tokens <n>' → 'maxTokens' */
function flagKey(def: OptionDef): string | null {
  const m = def.flag.match(/^--([a-z][a-z0-9-]*)/i);
  return m ? kebabToCamel(m[1]!) : null;
}

/** Boolean when no value placeholder and type is not number/array */
function isBooleanDef(def: OptionDef): boolean {
  if (def.type === 'number' || def.type === 'array') return false;
  return !def.flag.includes('<') && !def.flag.includes('[');
}

/** Build short flag → long flag mapping from OptionDef array */
function buildShortMap(options: OptionDef[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const opt of options) {
    // Look for short flag pattern like "-m" in flag string
    // Convention: if flag starts with single dash and is one char, it's a short flag
    // We also support defining short flags as part of the flag string: "-m, --model <value>"
    const parts = opt.flag.split(',').map((s) => s.trim());
    if (parts.length >= 2) {
      const shortPart = parts[0]!.trim();
      const longPart = parts[1]!.trim();
      const shortMatch = shortPart.match(/^(-[a-zA-Z])$/);
      const longMatch = longPart.match(/^(--[a-z][a-z0-9-]*)/i);
      if (shortMatch && longMatch) {
        map.set(shortMatch[1], longMatch[1]);
      }
    }
  }
  return map;
}

interface FlagSchema {
  booleans: Set<string>;
  numbers: Set<string>;
  arrays: Set<string>;
}

function buildSchema(options: OptionDef[]): FlagSchema {
  const booleans = new Set<string>();
  const numbers = new Set<string>();
  const arrays = new Set<string>();
  for (const opt of options) {
    const key = flagKey(opt);
    if (!key) continue;
    if (isBooleanDef(opt)) booleans.add(key);
    else if (opt.type === 'number') numbers.add(key);
    else if (opt.type === 'array') arrays.add(key);
  }
  return { booleans, numbers, arrays };
}

/**
 * Quick scan: collect positional (non-dash) args to determine the command path.
 * Skips global flags and their values so that e.g. `--output json chat`
 * correctly produces ['chat'] instead of ['json', 'chat'].
 */
export function scanCommandPath(argv: string[], globalOptions: OptionDef[] = []): string[] {
  const globalSchema = buildSchema(globalOptions);
  const shortMap = buildShortMap(globalOptions);
  const path: string[] = [];
  let i = 0;
  while (i < argv.length) {
    const arg = argv[i]!;
    if (arg === '--') break;

    if (arg.startsWith('--')) {
      const eqIdx = arg.indexOf('=');
      const key = eqIdx !== -1 ? arg.slice(2, eqIdx) : arg.slice(2);
      const camelKey = kebabToCamel(key);

      if (!globalSchema.booleans.has(camelKey) && eqIdx === -1) {
        // This flag takes a value, skip the next arg too
        i += 2;
      } else {
        i += 1;
      }
      continue;
    }

    if (arg.startsWith('-') && arg.length >= 2 && arg[1] !== '-') {
      // Short flag: check if it maps to a known long flag
      const expandedLong = shortMap.get(arg);
      if (expandedLong) {
        const camelKey = kebabToCamel(expandedLong.slice(2));
        if (!globalSchema.booleans.has(camelKey)) {
          i += 2; // short flag with value
        } else {
          i += 1;
        }
      } else {
        i += 1; // unknown short flag, skip
      }
      continue;
    }

    path.push(arg);
    i++;
  }
  return path;
}

/**
 * Full flag parse. Types are derived entirely from the provided OptionDef schema:
 *   - boolean: no <value> placeholder in flag string
 *   - number:  type: 'number'
 *   - array:   type: 'array'  (repeatable via multiple --flag occurrences)
 *   - default: string
 *
 * Supports:
 *   - Short flags via "-m, --model <value>" syntax in OptionDef
 *   - --flag=value syntax
 */
// CLI 参数解析返回通用对象，值类型在命令层通过 flags 接口具体化
export function parseFlags(argv: string[], options: OptionDef[]): Record<string, unknown> {
  const schema = buildSchema(options);
  const shortMap = buildShortMap(options);
  const flags: Record<string, unknown> = {};

  // Apply defaults
  for (const opt of options) {
    if (opt.default !== undefined) {
      const key = flagKey(opt);
      if (key) flags[key] = opt.default;
    }
  }

  let i = 0;
  while (i < argv.length) {
    const arg = argv[i]!;

    if (arg === '--help' || arg === '-h') { flags.help = true; i++; continue; }
    if (arg === '--') { break; }

    if (arg.startsWith('--')) {
      const eqIdx = arg.indexOf('=');
      let key: string;
      let value: string | undefined;

      if (eqIdx !== -1) {
        key = arg.slice(2, eqIdx);
        value = arg.slice(eqIdx + 1);
      } else {
        key = arg.slice(2);
      }

      const camelKey = kebabToCamel(key);

      // 支持 --no-xxx 前缀来否定布尔 flag（如 --no-stream → noStream = true）
      if (key.startsWith('no-')) {
        const baseKey = kebabToCamel(key.slice(3));
        if (schema.booleans.has(baseKey)) {
          flags[baseKey] = false;
          flags[`no${baseKey.charAt(0).toUpperCase()}${baseKey.slice(1)}`] = true;
          i++;
          continue;
        }
      }

      if (schema.booleans.has(camelKey)) {
        flags[camelKey] = true;
        i++;
        continue;
      }

      if (value === undefined) {
        i++;
        value = argv[i];
      }

      if (value === undefined) throw new Error(`Flag --${key} requires a value.`);

      if (schema.arrays.has(camelKey)) {
        const existing = flags[camelKey];
        if (Array.isArray(existing)) { existing.push(value); }
        else flags[camelKey] = [value];
      } else if (schema.numbers.has(camelKey)) {
        const numericValue = Number(value);
        if (value.trim() === '' || !Number.isFinite(numericValue)) {
          throw new Error(`Flag --${key} requires a numeric value, got "${value}".`);
        }
        flags[camelKey] = numericValue;
      } else {
        flags[camelKey] = value;
      }

      i++;
      continue;
    }

    if (arg.startsWith('-') && arg.length >= 2 && arg[1] !== '-') {
      // Short flag
      const expandedLong = shortMap.get(arg);
      if (expandedLong) {
        const camelKey = kebabToCamel(expandedLong.slice(2));

        if (schema.booleans.has(camelKey)) {
          flags[camelKey] = true;
          i++;
          continue;
        }

        i++;
        const value = argv[i];
        if (value === undefined) throw new Error(`Flag ${arg} requires a value.`);

        if (schema.arrays.has(camelKey)) {
          const existing = flags[camelKey];
          if (Array.isArray(existing)) { existing.push(value); }
          else flags[camelKey] = [value];
        } else if (schema.numbers.has(camelKey)) {
          const numericValue = Number(value);
          if (value.trim() === '' || !Number.isFinite(numericValue)) {
            throw new Error(`Flag ${arg} requires a numeric value, got "${value}".`);
          }
          flags[camelKey] = numericValue;
        } else {
          flags[camelKey] = value;
        }
      }
      // Unknown short flags are silently skipped
      i++;
      continue;
    }

    // Positional arg — skip
    i++;
  }

  return flags;
}
