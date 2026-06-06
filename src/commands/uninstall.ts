import { defineCommand } from '../command';
import type { Config } from '../config/schema';
import { execSync, spawn } from 'child_process';
import { existsSync, writeFileSync, renameSync } from 'fs';
import { join } from 'path';
import { t } from '../i18n';

const INSTALL_DIR = join(
  process.env.LOCALAPPDATA || join(process.env.USERPROFILE || 'C:\\', 'AppData', 'Local'),
  'mimo',
);
const EXE_PATH = join(INSTALL_DIR, 'mimo.exe');

export const uninstallCommand = defineCommand({
  name: 'uninstall',
  description: 'cmd.uninstall.desc',
  usage: 'mimo uninstall',
  async run(_config: Config, _flags: Record<string, unknown>): Promise<void> {
    const isExe = existsSync(EXE_PATH);
    if (!isExe) {
      process.stdout.write(`\n  ${t('uninstall.notFound')}\n`);
      process.stdout.write(`  ${t('uninstall.npmHint')}\n\n`);
      return;
    }

    process.stdout.write('\n');
    process.stdout.write(`  ${t('uninstall.header')}\n\n`);

    // Step 1: remove from PATH
    const pathRemoved = removeFromUserPath();
    if (pathRemoved) {
      process.stdout.write(`  ✓ ${t('uninstall.pathRemoved')}\n`);
    } else {
      process.stdout.write(`  ✓ ${t('uninstall.pathNotPresent')}\n`);
    }

    // Step 2: keep config file (~/.mimo/config.json) for potential npm reinstall
    process.stdout.write(`  ✓ ${t('uninstall.keepConfig')}\n`);

    // Step 3: rename the running exe so it no longer blocks directory deletion
    try {
      renameSync(EXE_PATH, EXE_PATH + '.old');
    } catch {
      // Ignore — proceed even if rename fails
    }

    // Step 4: write a batch file to %TEMP%. The batch content is pure ASCII
    // (uses %LOCALAPPDATA% env var), so latin1 encoding works fine with cmd.
    // Write to %TEMP% because it's always writable by the current user.
    const batPath = join(process.env.TEMP || 'C:\\Temp', 'mimo_uninstall.bat');
    const batContent =
      '@echo off\r\n' +
      'timeout /t 5 /nobreak >nul\r\n' +
      'rmdir /s /q "%LOCALAPPDATA%\\mimo"\r\n' +
      'del "%~f0"';
    writeFileSync(batPath, batContent, 'latin1');

    // Step 5: spawn the batch in a fully detached process. `spawn` with
    // detached:true creates a process NOT bound to our Windows Job Object,
    // so it continues running after our process exits. `unref()` tells Node
    // not to keep the event loop alive for this child.
    spawn('cmd.exe', ['/c', batPath], {
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
    }).unref();

    process.stdout.write(`\n  ${t('uninstall.done')}\n\n`);
    process.stdout.write(`  ${t('uninstall.restartHint')}\n\n`);
  },
});

function removeFromUserPath(): boolean {
  try {
    const psScript = `
$dir = [Environment]::GetFolderPath('LocalApplicationData') + '\\mimo'
$p = [Environment]::GetEnvironmentVariable('Path', 'User')
$parts = $p -split ';' | ForEach-Object { $_.Trim() }
$newParts = $parts | Where-Object { $_ -ne $dir }
$newPath = $newParts -join ';'
if ($newPath -ne $p) {
  [Environment]::SetEnvironmentVariable('Path', $newPath, 'User')
  Write-Output 'REMOVED'
} else {
  Write-Output 'NOTFOUND'
}
`.trim();
    const encoded = Buffer.from(psScript, 'utf16le').toString('base64');
    const result = execSync(
      `powershell -NoProfile -EncodedCommand ${encoded}`,
      { windowsHide: true, encoding: 'utf-8', timeout: 10000 },
    );
    return result.trim() === 'REMOVED';
  } catch {
    return false;
  }
}
