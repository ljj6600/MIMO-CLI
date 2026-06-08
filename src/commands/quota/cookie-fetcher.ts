import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { t } from '../../i18n';

const PLATFORM_URL = 'platform.xiaomimimo.com';
const CDP_PORTS = [9222, 9333, 9444, 9555];
const POLL_INTERVAL = 3_000;
const MAX_WAIT = 120_000;

function getEdgePath(): string | null {
  if (process.platform === 'win32') {
    const paths = [
      join(process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
      join(process.env['PROGRAMFILES'] || 'C:\\Program Files', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    ];
    for (const p of paths) {
      if (existsSync(p)) return p;
    }
  }
  return null;
}

function getMimoBrowserDir(): string {
  const dir = join(homedir(), '.mimo-browser');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

async function findCDPPort(): Promise<number | null> {
  for (const port of CDP_PORTS) {
    try {
      const resp = await fetch(`http://localhost:${port}/json/version`, {
        signal: AbortSignal.timeout(2000),
      });
      const info = await resp.json() as { Browser?: string };
      if (info.Browser) return port;
    } catch {
      continue;
    }
  }
  return null;
}

async function launchEdgeWithCDP(): Promise<number | null> {
  const edgePath = getEdgePath();
  if (!edgePath) return null;

  const port = 9222;
  const userDataDir = getMimoBrowserDir();

  const child = spawn(edgePath, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
  ], {
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
  });
  child.unref();

  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 500));
    try {
      const resp = await fetch(`http://localhost:${port}/json/version`, {
        signal: AbortSignal.timeout(1000),
      });
      const info = await resp.json() as { Browser?: string };
      if (info.Browser) return port;
    } catch {
      // not ready yet
    }
  }
  return null;
}

async function hasPlatformPage(port: number): Promise<boolean> {
  try {
    const resp = await fetch(`http://localhost:${port}/json`, {
      signal: AbortSignal.timeout(3000),
    });
    const targets = await resp.json() as Array<{ url?: string; type?: string }>;

    for (const target of targets) {
      if (target.type === 'page' && target.url?.includes(PLATFORM_URL)) {
        return true;
      }
    }
  } catch {
    // ignore
  }
  return false;
}

async function getCookiesViaCDP(port: number): Promise<string | null> {
  try {
    const resp = await fetch(`http://localhost:${port}/json`, {
      signal: AbortSignal.timeout(3000),
    });
    const targets = await resp.json() as Array<{ webSocketDebuggerUrl?: string; url?: string; type?: string }>;

    let wsUrl: string | null = null;
    for (const target of targets) {
      if (target.type === 'page' && target.url?.includes(PLATFORM_URL)) {
        wsUrl = target.webSocketDebuggerUrl || null;
        break;
      }
    }

    if (!wsUrl) return null;

    const _require = createRequire(import.meta.url);
    const WS = _require('ws');

    return new Promise<string | null>((resolve) => {
      const ws = new WS(wsUrl);
      let resolved = false;

      const timer = setTimeout(() => {
        if (!resolved) { resolved = true; ws.close(); resolve(null); }
      }, 15_000);

      ws.on('open', () => {
        ws.send(JSON.stringify({
          id: 1,
          method: 'Network.getCookies',
          params: { urls: [`https://${PLATFORM_URL}/`, `https://.xiaomimimo.com/`] }
        }));
      });

      ws.on('message', (data: any) => {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.id === 1 && msg.result) {
            clearTimeout(timer);
            resolved = true;
            ws.close();

            const cookies = msg.result.cookies || [];
            if (cookies.length > 0) {
              const cookieStr = cookies
                .filter((c: any) => c.domain?.includes('xiaomimimo'))
                .map((c: any) => `${c.name}=${c.value}`)
                .join('; ');
              resolve(cookieStr || null);
            } else {
              resolve(null);
            }
          }
        } catch {
          // ignore
        }
      });

      ws.on('error', () => {
        clearTimeout(timer);
        if (!resolved) { resolved = true; resolve(null); }
      });
    });
  } catch {
    return null;
  }
}

export async function autoFetchCookie(): Promise<string | null> {
  process.stderr.write(t('quota.autoFetchCookie') + '\n');

  let port = await findCDPPort();

  if (!port) {
    process.stderr.write(t('quota.launchingBrowser') + '\n');
    port = await launchEdgeWithCDP();
    if (!port) {
      process.stderr.write(t('quota.browserLaunchFailed') + '\n');
      return null;
    }
  }

  const hasPage = await hasPlatformPage(port);
  if (!hasPage) {
    process.stderr.write(t('quota.openPlatformPage') + '\n');

    const startTime = Date.now();
    while (Date.now() - startTime < MAX_WAIT) {
      await new Promise(r => setTimeout(r, POLL_INTERVAL));
      if (await hasPlatformPage(port)) break;
    }

    if (!(await hasPlatformPage(port))) {
      process.stderr.write(t('quota.timeout') + '\n');
      return null;
    }
  }

  process.stderr.write(t('quota.pageFound') + '\n');

  for (let i = 0; i < 5; i++) {
    const cookie = await getCookiesViaCDP(port);
    if (cookie) {
      process.stderr.write(t('quota.cookieFetched') + '\n');
      return cookie;
    }
    await new Promise(r => setTimeout(r, 2000));
  }

  return null;
}
