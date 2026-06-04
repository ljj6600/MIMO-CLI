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
  if (clack.isCancel(result)) {
    throw new Error('Operation cancelled');
  }
  // 边界条件：空输入检查
  const trimmed = (result as string).trim();
  if (!trimmed) {
    throw new Error('Input cannot be empty');
  }
  return trimmed;
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
