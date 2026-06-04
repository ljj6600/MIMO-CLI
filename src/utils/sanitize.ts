import { resolve, normalize } from 'node:path';
import { CLIError } from '../errors/base';
import { ExitCode } from '../errors/codes';

/**
 * 规范化并验证用户输入的文件路径，防止路径遍历攻击。
 * 检查规范化后的路径是否在 baseDir 目录下，如果逃逸则抛出 CLIError。
 *
 * @param inputPath - 用户输入的文件路径
 * @param baseDir - 允许的基准目录，默认为 process.cwd()
 * @returns 规范化后的绝对路径
 * @throws CLIError 如果路径逃逸到 baseDir 之外
 */
export function sanitizePath(inputPath: string, baseDir?: string): string {
  const base = resolve(baseDir ?? process.cwd());
  const resolved = resolve(inputPath);

  // 规范化后检查路径是否以 baseDir 开头
  // 确保比较时 baseDir 以路径分隔符结尾，避免 /app 匹配 /application 的情况
  const baseWithSep = base.endsWith('/') || base.endsWith('\\') ? base : base + '/';
  if (resolved !== base && !resolved.startsWith(baseWithSep)) {
    throw new CLIError(
      `路径不允许逃逸到预期目录之外: ${inputPath}`,
      ExitCode.INVALID_INPUT,
      '请确保文件路径在当前工作目录内，不要使用绝对路径或 ../ 等相对路径逃逸。',
    );
  }

  return resolved;
}

/**
 * 对 API Key 做脱敏处理，只显示前4位和后4位，中间用 **** 替代。
 * 格式: sk-****xxxx
 *
 * @param key - 原始 API Key
 * @returns 脱敏后的 API Key
 */
export function maskApiKey(key: string): string {
  if (!key || typeof key !== 'string') return '****';

  // 对于很短的 key，全部脱敏
  if (key.length <= 8) {
    return key.slice(0, 2) + '****';
  }

  return key.slice(0, 4) + '****' + key.slice(-4);
}

/**
 * 在文本中扫描并替换可能泄露的 API Key。
 * 匹配 sk- 或 tp- 开头的长字符串（>=20字符），替换为脱敏格式。
 *
 * @param text - 可能包含 API Key 的文本
 * @returns 脱敏后的文本
 */
export function redactApiKeysInText(text: string): string {
  if (!text || typeof text !== 'string') return text;

  // 匹配 sk- 或 tp- 开头且长度 >= 20 的字符串（典型的 API Key 格式）
  return text.replace(/(?:sk|tp)-[A-Za-z0-9_-]{16,}/g, (match) => {
    return maskApiKey(match);
  });
}
