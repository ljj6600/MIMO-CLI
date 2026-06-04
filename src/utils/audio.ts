import { readFile, stat } from 'node:fs/promises';
import { extname } from 'node:path';

const AUDIO_MIME_MAP: Record<string, string> = {
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
};

const SUPPORTED_AUDIO_EXTS = Object.keys(AUDIO_MIME_MAP);

export async function audioFileToBase64DataUri(filePath: string): Promise<string> {
  const ext = extname(filePath).toLowerCase();
  const mime = AUDIO_MIME_MAP[ext];
  if (!mime) {
    throw new Error(
      `Unsupported audio format: "${ext}". Supported formats: ${SUPPORTED_AUDIO_EXTS.join(', ')}`,
    );
  }
  const buffer = await readFile(filePath);
  const base64 = buffer.toString('base64');
  return `data:${mime};base64,${base64}`;
}

export async function validateAudioFile(filePath: string, maxSizeMB: number = 10): Promise<void> {
  const ext = extname(filePath).toLowerCase();
  if (!AUDIO_MIME_MAP[ext]) {
    throw new Error(
      `Unsupported audio format: "${ext}". Supported formats: ${SUPPORTED_AUDIO_EXTS.join(', ')}`,
    );
  }

  const stats = await stat(filePath);

  // 边界条件：空文件检查
  if (stats.size === 0) {
    throw new Error(`Audio file is empty: "${filePath}"`);
  }

  const sizeMB = stats.size / (1024 * 1024);
  if (sizeMB > maxSizeMB) {
    throw new Error(
      `Audio file too large: ${sizeMB.toFixed(2)}MB exceeds the ${maxSizeMB}MB limit.`,
    );
  }
}
