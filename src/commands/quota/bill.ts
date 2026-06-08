import { defineCommand } from '../../command';
import type { Config } from '../../config/schema';
import { resolveCookie, fetchPlatformApi, checkCookieAuth } from './shared';
import { CLIError } from '../../errors/base';
import { ExitCode } from '../../errors/codes';
import { t } from '../../i18n';
import { formatOutput } from '../../output/formatter';

const BILL_API_URL = 'https://platform.xiaomimimo.com/api/v1/usage/bill/monthly';

interface BillItem {
  reportMonth?: number;
  consumptionAmount?: number;
  cashConsumption?: number;
  giftConsumption?: number;
}

interface BillResponse {
  code?: number;
  data?: BillItem[];
}

function fmtMoney(value: number | undefined): string {
  return (Number(value || 0)).toFixed(2);
}

function formatMonth(reportMonth: number | undefined): string {
  if (!reportMonth) return '????-??';
  const m = String(reportMonth);
  return `${m.slice(0, 4)}-${m.slice(4, 6)}`;
}

export const quotaBillCommand = defineCommand({
  name: 'quota bill',
  description: 'cmd.quotaBill.desc',
  usage: 'mimo quota bill [--cookie <cookie>]',
  options: [
    { flag: '--cookie <value>', description: 'flag.quota.cookie' },
  ],
  examples: [
    'mimo quota bill',
    'mimo quota bill --cookie "serviceToken=...; userId=..."',
    'mimo quota bill --output json',
  ],
  async run(config: Config, flags: Record<string, unknown>): Promise<void> {
    process.stderr.write(t('quota.fetchingBill') + '\n');

    const cookie = await resolveCookie(config, flags);
    const response = await fetchPlatformApi<BillResponse>(BILL_API_URL, cookie);

    checkCookieAuth(response);

    if (response?.code !== 0) {
      throw new CLIError(t('quota.fetchFailed') + 'invalid response', ExitCode.GENERAL);
    }

    const bills = response?.data || [];

    if (bills.length === 0) {
      process.stderr.write(t('quota.noBillData') + '\n');
      process.exit(0);
    }

    const results: Record<string, string>[] = [];

    for (const bill of bills) {
      const month = formatMonth(bill.reportMonth);
      results.push(
        { [t('quota.planName')]: t('quota.billTotal', { month }), [t('quota.remaining')]: fmtMoney(bill.consumptionAmount), [t('quota.unit')]: 'CNY' },
        { [t('quota.planName')]: t('quota.billCash', { month }), [t('quota.remaining')]: fmtMoney(bill.cashConsumption), [t('quota.unit')]: 'CNY' },
        { [t('quota.planName')]: t('quota.billGift', { month }), [t('quota.remaining')]: fmtMoney(bill.giftConsumption), [t('quota.unit')]: 'CNY' },
      );
    }

    console.log(formatOutput(results, config));
  },
});
