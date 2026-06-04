import { homedir } from 'os';
import { join } from 'path';
import { mkdirSync } from 'fs';

export function getConfigDir(): string {
  return process.env.MIMO_CONFIG_DIR ?? join(homedir(), '.mimo');
}

export function getConfigPath(): string {
  return join(getConfigDir(), 'config.json');
}

export function ensureConfigDir(): void {
  const dir = getConfigDir();
  mkdirSync(dir, { recursive: true, mode: 0o700 });
}
