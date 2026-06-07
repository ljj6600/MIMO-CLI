import { defineCommand } from '../../command';
import type { Config } from '../../config/schema';
import { resolveCookie, fetchPlatformApi } from './shared';
import { t } from '../../i18n';
import { formatOutput } from '../../output/formatter';

const RECHARGE_API_URL = 'https://platform.xiaomimimo.com/api/v1/accumulatedRechargeAmount';

interface RechargeData {
  accumulatedRechargeAmount?: number;
  currency?: string;
}

interface RechargeResponse {
  code?: number;
  data?: RechargeData;
}

function fmtMoney(value: number | undefined): string {
  return (Number(value || 0)).toFixed(2);
}

export const quotaRechargeCommand = defineCommand({
  name: 'quota recharge',
  description: 'cmd.quotaRecharge.desc',
  usage: 'mimo quota recharge [--cookie <cookie>]',
  options: [
    { flag: '--cookie <value>', description: 'flag.quota.cookie' },
  ],
  examples: [
    'mimo quota recharge',
    'mimo quota recharge --cookie "serviceToken=...; userId=..."',
    'mimo quota recharge --output json',
  ],
  async run(config: Config, flags: Record<string, unknown>): Promise<void> {
    process.stderr.write(t('quota.fetchingRecharge') + '\n');

    const cookie = await resolveCookie(config, flags);
    const response = await fetchPlatformApi<RechargeResponse>(RECHARGE_API_URL, cookie);

    if (response?.code !== 0) {
      process.stderr.write(t('quota.fetchFailed') + 'invalid response\n');
      process.exit(1);
    }

    const data = response?.data || {};
    const unit = data.currency || 'CNY';

    const results: Record<string, string>[] = [
      {
        [t('quota.planName')]: t('quota.rechargeTotal'),
        [t('quota.remaining')]: fmtMoney(data.accumulatedRechargeAmount),
        [t('quota.unit')]: unit,
      },
    ];

    console.log(formatOutput(results, config));
  },
});
