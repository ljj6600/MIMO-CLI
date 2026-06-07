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

/**
 * 直接从 stdin 读取长文本（如 Cookie）。
 * @clack/prompts 的 text 无法处理超长粘贴内容，会返回 undefined；
 * readline 在 Windows 上会立即触发 close 事件。
 * 因此直接监听 stdin data 事件，逐块拼接直到遇到换行符。
 */
export async function promptLongText(message: string): Promise<string> {
  process.stderr.write(message + '\n> ');

  return new Promise<string>((resolve, reject) => {
    let input = '';
    let settled = false;

    // 确保 stdin 处于正常模式（非 raw mode），以支持行输入
    const isTTY = process.stdin.isTTY;
    if (isTTY && process.stdin.isRaw) {
      process.stdin.setRawMode(false);
    }

    const onData = (chunk: Buffer | string) => {
      if (settled) return;
      input += chunk.toString();
      const newlineIdx = input.search(/[\r\n]/);
      if (newlineIdx !== -1) {
        settled = true;
        cleanup();
        const line = input.substring(0, newlineIdx).trim();
        if (!line) {
          reject(new Error('Input cannot be empty'));
        } else {
          resolve(line);
        }
      }
    };

    const cleanup = () => {
      process.stdin.removeListener('data', onData);
      process.stdin.pause();
    };

    process.stdin.setEncoding('utf8');
    process.stdin.resume();
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
