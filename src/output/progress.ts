import * as clack from '@clack/prompts';

export interface Spinner {
  start(): void;
  stop(message?: string): void;
  update(message: string): void;
}

export function createSpinner(message: string): Spinner {
  const s = clack.spinner();

  return {
    start() {
      s.start(message);
    },
    stop(message?: string) {
      s.stop(message ?? '', 0);
    },
    update(message: string) {
      s.message(message);
    },
  };
}

export interface ProgressBar {
  update(current: number): void;
  done(): void;
}

export function createProgressBar(total: number, message: string): ProgressBar {
  const isTTY = process.stderr.isTTY;
  const width = 30;

  return {
    update(current: number) {
      if (!isTTY) return;
      const pct = Math.min(1, current / total);
      const filled = Math.round(width * pct);
      const empty = width - filled;
      const bar = '█'.repeat(filled) + '░'.repeat(empty);
      const pctStr = `${Math.round(pct * 100)}%`;
      process.stderr.write(`\r${message} ${bar} ${pctStr}`);
    },
    done() {
      if (isTTY) {
        process.stderr.write('\n');
      }
    },
  };
}
