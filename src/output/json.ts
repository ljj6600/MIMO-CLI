import type { CLIError } from '../errors/base';

export function formatJson(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

export function formatErrorJson(error: CLIError): object {
  return {
    error: {
      code: error.exitCode,
      message: error.message,
      ...(error.hint ? { hint: error.hint } : {}),
    },
  };
}
