import * as clack from '@clack/prompts';
import { isInteractive } from './env';

export async function promptText(
  message: string,
  options?: { placeholder?: string },
): Promise<string> {
  const result = await clack.text({
    message,
    placeholder: options?.placeholder,
  });
  if (clack.isCancel(result) || result == null) {
    throw new Error('Operation cancelled');
  }
  const trimmed = (result as string).trim();
  if (!trimmed) {
    throw new Error('Input cannot be empty');
  }
  return trimmed;
}

export async function promptLongText(message: string): Promise<string> {
  process.stderr.write(message + '\n> ');

  return new Promise<string>((resolve, reject) => {
    const isTTY = process.stdin.isTTY;

    if (isTTY) {
      process.stdin.setRawMode(true);
    }
    process.stdin.setEncoding('utf8');
    process.stdin.resume();

    let input = '';

    const onData = (chunk: string) => {
      for (const ch of chunk) {
        if (ch === '\n' || ch === '\r') {
          if (input.length === 0) continue;
          cleanup();
          process.stderr.write('\n');
          const trimmed = input.trim();
          if (!trimmed) {
            reject(new Error('Input cannot be empty'));
          } else {
            resolve(trimmed);
          }
          return;
        }
        if (ch === '\x03') {
          cleanup();
          process.stderr.write('\n');
          reject(new Error('Operation cancelled'));
          return;
        }
        if (ch === '\x7F' || ch === '\b') {
          if (input.length > 0) {
            input = input.slice(0, -1);
            process.stderr.write('\b \b');
          }
        } else {
          input += ch;
          process.stderr.write(ch);
        }
      }
    };

    const cleanup = () => {
      process.stdin.removeListener('data', onData);
      if (isTTY) {
        try { process.stdin.setRawMode(false); } catch { /* ignore */ }
      }
      process.stdin.pause();
    };

    process.stdin.on('data', onData);
  });
}

export async function promptConfirm(message: string): Promise<boolean> {
  const result = await clack.confirm({
    message,
  });
  if (clack.isCancel(result)) {
    throw new Error('Operation cancelled');
  }
  return result;
}

export async function promptOrFail(message: string, _config: Record<string, unknown>): Promise<string> {
  if (!isInteractive()) {
    throw new Error(
      `Non-interactive mode: cannot prompt for "${message}". ` +
        'Please provide the required value via command-line flags or environment variables.',
    );
  }
  return promptText(message);
}
