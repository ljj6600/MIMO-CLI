import { readFile, stat } from 'node:fs/promises';
import { extname } from 'node:path';

const IMAGE_MIME_MAP: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp',
};

export async function localFileToDataUri(filePath: string): Promise<string> {
  const ext = extname(filePath).toLowerCase();
  const mime = IMAGE_MIME_MAP[ext];
  if (!mime) {
    throw new Error(
      `Unsupported image format: "${ext}". Supported formats: ${Object.keys(IMAGE_MIME_MAP).join(', ')}`,
    );
  }

  // 边界条件：空文件检查
  const fileStat = await stat(filePath);
  if (fileStat.size === 0) {
    throw new Error(`Image file is empty: "${filePath}"`);
  }

  const buffer = await readFile(filePath);
  const base64 = buffer.toString('base64');
  return `data:${mime};base64,${base64}`;
}

export async function resolveImageInput(input: string): Promise<string> {
  if (input.startsWith('http://') || input.startsWith('https://')) {
    return input;
  }
  if (input.startsWith('data:')) {
    return input;
  }
  return localFileToDataUri(input);
}
