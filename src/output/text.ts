export function formatText(data: unknown, _config?: Record<string, unknown>): string {
  if (data === null || data === undefined) return '';
  if (typeof data === 'string') return data;
  if (typeof data === 'number' || typeof data === 'boolean') return String(data);

  if (Array.isArray(data)) {
    if (data.length === 0) return '(empty)';
    if (typeof data[0] === 'object' && data[0] !== null) {
      return formatTable(
        Object.keys(data[0] as Record<string, unknown>),
        data.map(row =>
          Object.values(row as Record<string, unknown>).map(v => String(v ?? '')),
        ),
      );
    }
    return data.map(String).join('\n');
  }

  if (typeof data === 'object') {
    return formatKeyValue(data as Record<string, unknown>);
  }

  return String(data);
}

export function formatKeyValue(obj: Record<string, unknown>, indent: number = 0): string {
  const prefix = ' '.repeat(indent);
  const lines: string[] = [];

  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) continue;
    if (Array.isArray(value)) {
      lines.push(`${prefix}${key}:`);
      for (const item of value) {
        if (typeof item === 'object' && item !== null) {
          lines.push(`${prefix}  - ${formatKeyValue(item as Record<string, unknown>, indent + 4).trimStart()}`);
        } else {
          lines.push(`${prefix}  - ${String(item)}`);
        }
      }
    } else if (typeof value === 'object') {
      lines.push(`${prefix}${key}:`);
      lines.push(formatKeyValue(value as Record<string, unknown>, indent + 2));
    } else {
      lines.push(`${prefix}${key}: ${String(value)}`);
    }
  }

  return lines.join('\n');
}

/** 计算字符串在终端中的视觉宽度（中文字符占2列） */
function visualWidth(str: string): number {
  let w = 0;
  for (const ch of str) {
    const c = ch.codePointAt(0)!;
    if (
      (c >= 0x4E00 && c <= 0x9FFF) ||   // CJK Unified Ideographs
      (c >= 0x3000 && c <= 0x303F) ||   // CJK Symbols and Punctuation
      (c >= 0x3040 && c <= 0x309F) ||   // Hiragana
      (c >= 0x30A0 && c <= 0x30FF) ||   // Katakana
      (c >= 0xFF01 && c <= 0xFF60) ||   // Fullwidth Forms
      (c >= 0xAC00 && c <= 0xD7AF) ||   // Hangul Syllables
      (c >= 0xF900 && c <= 0xFAFF) ||   // CJK Compatibility Ideographs
      (c >= 0xFE30 && c <= 0xFE6F) ||   // CJK Compatibility Forms
      (c >= 0x2E80 && c <= 0x2EFF) ||   // CJK Radicals Supplement
      (c >= 0x3400 && c <= 0x4DBF) ||   // CJK Extension A
      (c >= 0x20000 && c <= 0x2A6DF) || // CJK Extension B
      (c >= 0x2A700 && c <= 0x2CEAF)    // CJK Extension C-E
    ) {
      w += 2;
    } else if (c > 0x001F && c < 0x007F) {
      w += 1;
    } else if (c >= 0x0080) {
      w += 1;
    }
  }
  return w;
}

/** 按视觉宽度右填充 */
function padEndVisual(str: string, targetWidth: number): string {
  return str + ' '.repeat(Math.max(0, targetWidth - visualWidth(str)));
}

/** 按视觉宽度左填充 */
function padStartVisual(str: string, targetWidth: number): string {
  return ' '.repeat(Math.max(0, targetWidth - visualWidth(str))) + str;
}

export function formatTable(headers: string[], rows: string[][]): string {
  if (rows.length === 0) return '(empty)';

  const widths = headers.map((h, i) =>
    Math.max(visualWidth(h), ...rows.map(r => visualWidth(r[i] ?? ''))),
  );

  // 检测哪些列是数字列（含数字、小数点、百分号、负号）
  const isNumeric = headers.map((_, i) =>
    rows.every(r => /^[\d.,%\-\s]*$/.test(r[i] ?? '')),
  );

  const headerLine = headers.map((h, i) => padEndVisual(h.toUpperCase(), widths[i]!)).join('  ');
  const separator = widths.map(w => '-'.repeat(w)).join('  ');
  const bodyLines = rows.map(r =>
    r.map((cell, i) => {
      const s = cell ?? '';
      return isNumeric[i] ? padStartVisual(s, widths[i]!) : padEndVisual(s, widths[i]!);
    }).join('  '),
  );

  return [headerLine, separator, ...bodyLines].join('\n');
}
