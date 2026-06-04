import { CLIError } from './base';
import { ExitCode } from './codes';
import { redactApiKeysInText } from '../utils/sanitize';
import { t } from '../i18n';

export interface ApiErrorBody {
  error?: {
    message?: string;
    type?: string;
    code?: string | number;
  };
  message?: string;
  msg?: string;
}

export function mapApiError(status: number, body: ApiErrorBody, url: string): CLIError {
  // 对 API 错误消息做脱敏处理，防止泄露认证信息
  const apiMsg =
    redactApiKeysInText(
      body.error?.message ||
      body.message ||
      body.msg ||
      `HTTP ${status}`
    );

  switch (status) {
    case 400:
      return new CLIError(
        t('api.400') + apiMsg,
        ExitCode.USAGE,
        t('api.400Hint'),
      );

    case 401:
      return new CLIError(
        t('api.401'),
        ExitCode.AUTH,
        t('api.401Hint'),
      );

    case 402:
      return new CLIError(
        t('api.402') + apiMsg,
        ExitCode.QUOTA,
        t('api.402Hint'),
      );

    case 403:
      return new CLIError(
        t('api.403'),
        ExitCode.AUTH,
        t('api.403Hint'),
      );

    case 404:
      return new CLIError(
        t('api.404') + apiMsg,
        ExitCode.USAGE,
        t('api.404Hint'),
      );

    case 421:
      return new CLIError(
        t('api.421') + apiMsg,
        ExitCode.CONTENT_FILTER,
        t('api.421Hint'),
      );

    case 429:
      return new CLIError(
        t('api.429') + apiMsg,
        ExitCode.QUOTA,
        t('api.429Hint'),
      );

    case 500:
      return new CLIError(
        t('api.500'),
        ExitCode.NETWORK,
        t('api.500Hint'),
      );

    case 503:
      return new CLIError(
        t('api.503'),
        ExitCode.NETWORK,
        t('api.503Hint'),
      );

    default:
      return new CLIError(
        t('api.default') + apiMsg + ' (HTTP ' + status + ')',
        ExitCode.GENERAL,
      );
  }
}
