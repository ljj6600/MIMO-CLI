const DIM = '\x1b[2m';
const RESET_DIM = '\x1b[22m';
const GRAY = '\x1b[90m';
const RESET_COLOR = '\x1b[39m';

export function formatReasoning(reasoning: string, content: string): string {
  const parts: string[] = [];

  if (reasoning) {
    parts.push(`${DIM}${GRAY}${reasoning}${RESET_COLOR}${RESET_DIM}`);
  }

  if (content) {
    parts.push(content);
  }

  return parts.join('\n\n');
}
