const CYAN = '\x1b[36m';
const RESET = '\x1b[39m';

export interface Annotation {
  title?: string;
  url?: string;
  summary?: string;
}

export function formatAnnotations(annotations: Annotation[]): string {
  if (!annotations || annotations.length === 0) return '';

  const lines: string[] = [];

  for (let i = 0; i < annotations.length; i++) {
    const ann = annotations[i]!;
    const num = `[${i + 1}]`;
    const parts: string[] = [num];

    if (ann.title) {
      parts.push(ann.title);
    }

    if (ann.url) {
      parts.push(`${CYAN}${ann.url}${RESET}`);
    }

    if (ann.summary) {
      parts.push(`— ${ann.summary}`);
    }

    lines.push(parts.join(' '));
  }

  return lines.join('\n');
}
