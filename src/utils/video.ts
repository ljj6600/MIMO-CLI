import { readFile, stat } from 'node:fs/promises';
import { extname } from 'node:path';
import { t } from '../i18n';

const VIDEO_MIME_MAP: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.avi': 'video/x-msvideo',
  '.wmv': 'video/x-ms-wmv',
};

const SUPPORTED_VIDEO_EXTS = Object.keys(VIDEO_MIME_MAP);

// Base64 编码后大小约为原始文件的 4/3，API 限制 Base64 字符串 ≤ 50 MB
const BASE64_MAX_SIZE_MB = 50;
const RAW_FILE_MAX_SIZE_MB = BASE64_MAX_SIZE_MB * 0.75; // ≈ 37.5 MB

export async function videoFileToBase64DataUri(filePath: string): Promise<string> {
  const ext = extname(filePath).toLowerCase();
  const mime = VIDEO_MIME_MAP[ext];
  if (!mime) {
    throw new Error(
      `Unsupported video format: "${ext}". Supported formats: ${SUPPORTED_VIDEO_EXTS.join(', ')}`,
    );
  }

  // 先检查原始文件大小，避免读取超大文件浪费内存
  const stats = await stat(filePath);
  if (stats.size === 0) {
    throw new Error(`Video file is empty: "${filePath}"`);
  }
  const rawSizeMB = stats.size / (1024 * 1024);
  if (rawSizeMB > RAW_FILE_MAX_SIZE_MB) {
    throw new Error(
      t('vision.videoTooLarge', { size: rawSizeMB.toFixed(2), limit: String(BASE64_MAX_SIZE_MB) }) + ' ' +
      t('vision.videoTooLargeHint', { max: RAW_FILE_MAX_SIZE_MB.toFixed(1) }),
    );
  }

  const buffer = await readFile(filePath);
  const base64 = buffer.toString('base64');

  // 二次校验：Base64 编码后实际大小
  const base64SizeMB = Buffer.byteLength(base64, 'utf-8') / (1024 * 1024);
  if (base64SizeMB > BASE64_MAX_SIZE_MB) {
    throw new Error(
      t('vision.videoBase64TooLarge', { size: base64SizeMB.toFixed(2), limit: String(BASE64_MAX_SIZE_MB) }) + ' ' +
      t('vision.videoBase64TooLargeHint'),
    );
  }

  return `data:${mime};base64,${base64}`;
}

export async function validateVideoFile(filePath: string, maxSizeMB: number = RAW_FILE_MAX_SIZE_MB): Promise<void> {
  const ext = extname(filePath).toLowerCase();
  if (!VIDEO_MIME_MAP[ext]) {
    throw new Error(
      `Unsupported video format: "${ext}". Supported formats: ${SUPPORTED_VIDEO_EXTS.join(', ')}`,
    );
  }

  const stats = await stat(filePath);

  // 边界条件：空文件检查
  if (stats.size === 0) {
    throw new Error(`Video file is empty: "${filePath}"`);
  }

  const sizeMB = stats.size / (1024 * 1024);
  if (sizeMB > maxSizeMB) {
    throw new Error(
      `Video file too large: ${sizeMB.toFixed(2)}MB exceeds the ${maxSizeMB}MB limit.`,
    );
  }
}
