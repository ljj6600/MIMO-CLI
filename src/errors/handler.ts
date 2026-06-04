import { CLIError } from './base';
import { ExitCode } from './codes';
import { detectOutputFormat } from '../output/formatter';
import { redactApiKeysInText } from '../utils/sanitize';
import { t } from '../i18n';

export function handleError(err: unknown): never {
  if (err instanceof CLIError) {
    const format = detectOutputFormat(process.env.MIMO_OUTPUT);

    if (format === 'json') {
      // JSON 输出时也需要脱敏
      const safeJson = redactApiKeysInText(JSON.stringify(err.toJSON(), null, 2));
      process.stderr.write(safeJson + '\n');
    } else {
      // 对错误信息中可能包含的 API Key 做脱敏处理
      process.stderr.write(`\n${t('error.prefix')} ${redactApiKeysInText(err.message)}\n`);
      if (err.hint) {
        process.stderr.write(`\n  ${redactApiKeysInText(err.hint).split('\n').join('\n  ')}\n`);
      }
      process.stderr.write(`  ${t('error.exitCode', { code: String(err.exitCode) })}\n`);
    }
    process.exit(err.exitCode);
  }

  if (err instanceof Error) {
    if (
      err.name === 'AbortError' ||
      err.name === 'TimeoutError' ||
      err.message.includes('timed out')
    ) {
      const timeout = new CLIError(
        t('error.timeout'),
        ExitCode.TIMEOUT,
        t('error.timeoutHint'),
      );
      return handleError(timeout);
    }

    if (err instanceof TypeError && err.message === 'fetch failed') {
      const networkErr = new CLIError(
        t('error.network'),
        ExitCode.NETWORK,
        t('error.networkHint'),
      );
      return handleError(networkErr);
    }

    const msg = err.message.toLowerCase();
    const isNetworkError =
      msg.includes('failed to fetch') ||
      msg.includes('connection refused') ||
      msg.includes('econnrefused') ||
      msg.includes('connection reset') ||
      msg.includes('econnreset') ||
      msg.includes('network error') ||
      msg.includes('enotfound') ||
      msg.includes('getaddrinfo') ||
      msg.includes('proxy') ||
      msg.includes('socket') ||
      msg.includes('etimedout') ||
      msg.includes('eai_again');

    if (isNetworkError) {
      let hint = t('error.networkHint');
      if (msg.includes('proxy')) {
        hint = t('error.proxyHint');
      }
      const networkErr = new CLIError(
        t('error.network'),
        ExitCode.NETWORK,
        hint,
      );
      return handleError(networkErr);
    }

    const ecode = (err as NodeJS.ErrnoException).code;
    if (
      ecode === 'ENOENT' ||
      ecode === 'EACCES' ||
      ecode === 'ENOSPC' ||
      ecode === 'ENOTDIR' ||
      ecode === 'EISDIR' ||
      ecode === 'EPERM' ||
      ecode === 'EBUSY'
    ) {
      let hint = t('error.fsDefault');
      if (ecode === 'ENOENT') hint = t('error.fsEnoent');
      if (ecode === 'EACCES' || ecode === 'EPERM')
        hint = t('error.fsEacces');
      if (ecode === 'ENOSPC') hint = t('error.fsEnospc');
      const fsErr = new CLIError(
        t('error.fsPrefix') + err.message,
        ExitCode.GENERAL,
        hint,
      );
      return handleError(fsErr);
    } else if (typeof ecode === 'string' && ecode.startsWith('E')) {
      const fsErr = new CLIError(
        t('error.fsPrefix') + err.message,
        ExitCode.GENERAL,
        t('error.fsDefault'),
      );
      return handleError(fsErr);
    }

    // 对通用错误信息做脱敏处理，防止 API Key 泄露
    process.stderr.write(`\n${t('error.prefix')} ${redactApiKeysInText(err.message)}\n`);
    if (process.env.MIMO_VERBOSE === '1') {
      process.stderr.write(`${redactApiKeysInText(err.stack ?? '')}\n`);
    }
  } else {
    // 对非 Error 类型的输出也做脱敏
    process.stderr.write(`\n${t('error.prefix')} ${redactApiKeysInText(String(err))}\n`);
  }

  process.exit(ExitCode.GENERAL);
}
