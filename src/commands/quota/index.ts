import { defineCommand } from '../../command';
import type { Config } from '../../config/schema';
import { resolveCredential } from '../../auth/resolver';
import { resolveCookie, fetchPlatformApi } from './shared';
import { t } from '../../i18n';
import { formatOutput } from '../../output/formatter';

const QUOTA_API_URL = 'https://platform.xiaomimimo.com/api/v1/tokenPlan/usage';
const BALANCE_API_URL = 'https://platform.xiaomimimo.com/api/v1/balance';
const SCALE = 1_000_000;

// ---- TokenPlan 套餐用量 ----

interface UsageItem {
  name: string;
  used: number;
  limit: number;
  percent?: number;
}

interface QuotaResponse {
  data?: {
    usage?: {
      items?: UsageItem[];
    };
  };
}

const PLAN_CONFIGS = [
  { name: 'plan_total_token', labelKey: 'quota.planTokenPlan' },
  { name: 'compensation_total_token', labelKey: 'quota.planCompensation' },
];

function formatPercent(used: number, total: number, fallbackPercent?: number): string {
  const percent = total > 0 ? used / total : Number(fallbackPercent || 0);
  return `${(percent * 100).toFixed(2).replace(/\.?0+$/, '')}%`;
}

function formatValue(value: number): string {
  return String(value / SCALE);
}

async function fetchTokenPlanUsage(cookie: string, config: Config): Promise<void> {
  process.stderr.write(t('quota.fetching') + '\n');

  const response = await fetchPlatformApi<QuotaResponse>(QUOTA_API_URL, cookie);
  const items = response?.data?.usage?.items || [];

  const results = PLAN_CONFIGS
    .map(({ name, labelKey }) => {
      const item = items.find((i) => i?.name === name);
      if (!item) return null;

      const used = Number(item.used || 0);
      const total = Number(item.limit || 0);
      const remaining = Math.max(total - used, 0);

      return {
        [t('quota.planName')]: t(labelKey),
        [t('quota.used')]: formatValue(used),
        [t('quota.total')]: formatValue(total),
        [t('quota.remaining')]: formatValue(remaining),
        [t('quota.unit')]: t('quota.unitBaiM'),
        [t('quota.usage')]: formatPercent(used, total, item.percent),
      };
    })
    .filter(Boolean) as Record<string, string>[];

  if (results.length === 0) {
    process.stderr.write(t('quota.fetchFailed') + 'no usage data returned\n');
    process.exit(1);
  }

  console.log(formatOutput(results, config));
}

// ---- 按量计费余额查询 ----

interface BalanceData {
  balance?: number;
  cashBalance?: number;
  giftBalance?: number;
  frozenBalance?: number;
  overdraftLimit?: number;
  remainingOverdraftLimit?: number;
  currency?: string;
}

interface BalanceResponse {
  code?: number;
  data?: BalanceData;
}

const BALANCE_CONFIGS = [
  { key: 'balance', labelKey: 'quota.balanceTotal' },
  { key: 'cashBalance', labelKey: 'quota.balanceCash' },
  { key: 'giftBalance', labelKey: 'quota.balanceGift' },
  { key: 'frozenBalance', labelKey: 'quota.balanceFrozen' },
  { key: 'overdraftLimit', labelKey: 'quota.balanceOverdraft' },
  { key: 'remainingOverdraftLimit', labelKey: 'quota.balanceOverdraftRemain' },
] as const;

function formatMoney(value: number): string {
  return value.toFixed(2);
}

async function fetchBalance(cookie: string, config: Config): Promise<void> {
  process.stderr.write(t('quota.fetchingBalance') + '\n');

  const response = await fetchPlatformApi<BalanceResponse>(BALANCE_API_URL, cookie);
  const data = response?.data || {};
  const unit = data.currency || 'CNY';

  if (response?.code !== 0) {
    process.stderr.write(t('quota.fetchFailed') + 'invalid response\n');
    process.exit(1);
  }

  const results = BALANCE_CONFIGS
    .map(({ key, labelKey }) => {
      const value = Number(data[key] ?? 0);
      return {
        [t('quota.planName')]: t(labelKey),
        [t('quota.remaining')]: formatMoney(value),
        [t('quota.unit')]: unit,
      };
    });

  console.log(formatOutput(results, config));
}

// ---- 命令入口 ----

export const quotaCommand = defineCommand({
  name: 'quota',
  description: 'cmd.quota.desc',
  usage: 'mimo quota [--cookie <cookie>]',
  options: [
    { flag: '--cookie <value>', description: 'flag.quota.cookie' },
  ],
  examples: [
    'mimo quota',
    'mimo quota --cookie "serviceToken=...; userId=..."',
    'mimo quota --output json',
    'mimo config set platform_cookie "serviceToken=...; userId=..."',
  ],
  async run(config: Config, flags: Record<string, unknown>): Promise<void> {
    // 检测当前 Key 类型
    let keyType: 'tp' | 'sk' | 'none' = 'none';
    try {
      const cred = resolveCredential(config);
      keyType = cred.token.startsWith('sk-') ? 'sk' : 'tp';
    } catch {
      // 未配置任何 Key 时不阻断，默认按 tp 处理
    }

    const cookie = await resolveCookie(config, flags);

    if (keyType === 'sk') {
      await fetchBalance(cookie, config);
    } else {
      await fetchTokenPlanUsage(cookie, config);
    }
  },
});
