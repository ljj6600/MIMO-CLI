import { main } from './main';
import { existsSync, mkdirSync, copyFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

// ─── Installer constants ────────────────────────────────────
const INSTALL_DIR = join(
  process.env.LOCALAPPDATA || join(process.env.USERPROFILE || 'C:\\', 'AppData', 'Local'),
  'mimo',
);
const EXE_NAME = 'mimo.exe';
const INSTALL_PATH = join(INSTALL_DIR, EXE_NAME);

function getExePath(): string {
  return process.execPath;
}

function isRunningAtInstallPath(): boolean {
  return getExePath().toLowerCase() === INSTALL_PATH.toLowerCase();
}

function addDirToUserPath(): boolean {
  try {
    const psScript = `
$dir = [Environment]::GetFolderPath('LocalApplicationData') + '\\mimo'
$p = [Environment]::GetEnvironmentVariable('Path', 'User')
$parts = $p -split ';' | ForEach-Object { $_.Trim() }
if ($parts -notcontains $dir) {
  [Environment]::SetEnvironmentVariable('Path', ($p + ';' + $dir), 'User')
  Write-Output 'ADDED'
} else {
  Write-Output 'EXISTS'
}
`.trim();
    const encoded = Buffer.from(psScript, 'utf16le').toString('base64');
    const result = execSync(
      `powershell -NoProfile -EncodedCommand ${encoded}`,
      { windowsHide: true, encoding: 'utf-8', timeout: 10000 },
    );
    return result.trim() === 'ADDED';
  } catch {
    return false;
  }
}

// ─── Installer mode ─────────────────────────────────────────
async function installAndExit(): Promise<never> {
  const exePath = getExePath();

  process.stdout.write('\n');
  process.stdout.write('  ╔════════════════════════════════════════╗\n');
  process.stdout.write('  ║      MiMo CLI - Windows 安装程序       ║\n');
  process.stdout.write('  ╚════════════════════════════════════════╝\n\n');

  // Step 1: create directory
  if (!existsSync(INSTALL_DIR)) {
    mkdirSync(INSTALL_DIR, { recursive: true });
    process.stdout.write(`  ✓ 创建安装目录: ${INSTALL_DIR}\n`);
  } else {
    process.stdout.write(`  ✓ 安装目录已存在: ${INSTALL_DIR}\n`);
  }

  // Step 2: copy self
  copyFileSync(exePath, INSTALL_PATH);
  process.stdout.write(`  ✓ 已安装: ${INSTALL_PATH}\n`);

  // Step 3: add to PATH
  const pathAdded = addDirToUserPath();
  if (pathAdded) {
    process.stdout.write('  ✓ 已将安装目录添加至系统 PATH\n');
  } else {
    process.stdout.write('  ✓ 安装目录已在系统 PATH 中\n');
  }

  process.stdout.write('\n  ✔ 安装完成！\n\n');
  process.stdout.write('  请关闭当前终端，打开新的 cmd 或 PowerShell，\n');
  process.stdout.write('  输入以下命令开始使用 MiMo CLI：\n\n');
  process.stdout.write('      mimo --help               查看帮助\n');
  process.stdout.write('      mimo auth login           配置 API Key\n');
  process.stdout.write('      mimo chat --message "你好"  开始对话\n');
  process.stdout.write('      mimo --version            查看版本\n\n');

  await waitForKeypress();
  process.exit(0);
}

// ─── CLI mode ───────────────────────────────────────────────

class ExeExitSignal {
  constructor(public code: number) {}
}

async function runCli(): Promise<void> {
  const originalExit = process.exit.bind(process);

  (process.exit as unknown as (code?: number) => void) = (code?: number) => {
    throw new ExeExitSignal(code ?? 0);
  };

  let exitCode = 0;
  try {
    await main();
  } catch (err) {
    if (err instanceof ExeExitSignal) {
      exitCode = err.code;
    } else {
      process.exit = originalExit;
      process.stderr.write(`\nFatal error: ${err}\n`);
      originalExit(1);
      return;
    }
  }

  originalExit(exitCode);
}

// ─── Shared ─────────────────────────────────────────────────

function waitForKeypress(): Promise<void> {
  return new Promise<void>((resolve) => {
    process.stdout.write('  按任意键退出...');
    try {
      if (process.stdin.isTTY) {
        (process.stdin as any).setRawMode(true);
        process.stdin.once('data', () => {
          (process.stdin as any).setRawMode(false);
          resolve();
        });
        process.stdin.resume();
      } else {
        resolve();
      }
    } catch {
      resolve();
    }
  });
}

// ─── Entry ──────────────────────────────────────────────────

async function exeMain() {
  const noArgs = process.argv.slice(2).length === 0;
  const installed = existsSync(INSTALL_PATH);
  const atInstallPath = isRunningAtInstallPath();

  if (noArgs && !atInstallPath && !installed) {
    // First run after download → installer mode
    await installAndExit();
  }

  // When running from install path or already installed:
  // CLI mode — exit immediately after command completes
  await runCli();
}

exeMain();
