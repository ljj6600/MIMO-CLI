import { exec } from 'node:child_process';
import { defineCommand } from '../command';
import { VERSION } from '../version';
import { t } from '../i18n';

const REGISTRY_URL = 'https://registry.npmjs.org/mimo-cli/latest';

interface NpmLatestVersion {
  version: string;
}

function execAsync(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(command, { timeout: 120_000 }, (err, stdout, stderr) => {
      if (err) return reject(err);
      resolve((stdout || '').trim());
    });
  });
}

function compareVersions(a: string, b: string): number {
  const pa = a.replace(/^v/, '').split('.').map(Number);
  const pb = b.replace(/^v/, '').split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] ?? 0) > (pb[i] ?? 0)) return 1;
    if ((pa[i] ?? 0) < (pb[i] ?? 0)) return -1;
  }
  return 0;
}

export const updateCommand = defineCommand({
  name: 'update',
  description: 'cmd.update.desc',
  usage: 'mimo update',
  async run(): Promise<void> {
    // 1. 查询 npm registry 最新版本
    process.stderr.write(t('update.checking') + '\n');

    let latestVersion: string;
    try {
      const resp = await fetch(REGISTRY_URL);
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }
      const data = await resp.json() as NpmLatestVersion;
      latestVersion = data.version;
    } catch {
      process.stderr.write(t('update.checkFailed') + '\n');
      process.stderr.write(t('update.manualHint') + '\n');
      return;
    }

    const current = VERSION.replace(/^v/, '');

    // 2. 比较版本
    process.stderr.write(t('update.currentVersion', { version: current }) + '\n');
    process.stderr.write(t('update.latestVersion', { version: latestVersion }) + '\n');

    if (compareVersions(latestVersion, current) <= 0) {
      process.stderr.write(t('update.alreadyLatest') + '\n');
      return;
    }

    // 3. 执行更新
    process.stderr.write(t('update.updating', { version: latestVersion }) + '\n');

    try {
      const output = await execAsync('npm install -g mimo-cli@latest');
      if (output) {
        process.stderr.write(output + '\n');
      }
      process.stderr.write(t('update.success', { version: latestVersion }) + '\n');
    } catch {
      process.stderr.write(t('update.installFailed') + '\n');
      process.stderr.write(t('update.manualHint') + '\n');
    }
  },
});
