import { readFileSync } from 'node:fs';
import { sanitizePath } from './sanitize';

export async function readTextFromPathOrStdin(path: string): Promise<string> {
  if (path === '-') {
    return readStdin();
  }
  // 路径遍历防护：验证文件路径
  const safePath = sanitizePath(path);
  return readFileSync(safePath, 'utf-8');
}

function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const stdin = process.stdin;

    if (stdin.isTTY) {
      reject(new Error('No input provided on stdin'));
      return;
    }

    stdin.setEncoding('utf-8');

    const onData = (chunk: string) => chunks.push(Buffer.from(chunk));
    const onEnd = () => {
      cleanup();
      resolve(Buffer.concat(chunks).toString('utf-8'));
    };
    const onError = (err: Error) => {
      cleanup();
      reject(err);
    };

    // 确保在完成或出错时移除监听器，避免资源泄漏
    const cleanup = () => {
      stdin.removeListener('data', onData);
      stdin.removeListener('end', onEnd);
      stdin.removeListener('error', onError);
    };

    stdin.on('data', onData);
    stdin.on('end', onEnd);
    stdin.on('error', onError);
  });
}
