import { defineCommand } from '../../command';
import type { Config } from '../../config/schema';
import { resolveCookie, fetchPlatformApi, checkCookieAuth } from './shared';
import { CLIError } from '../../errors/base';
import { ExitCode } from '../../errors/codes';
import { t } from '../../i18n';
import { formatOutput } from '../../output/formatter';

const USAGE_API_URL = 'https://platform.xiaomimimo.com/api/v1/usage';

interface TokenUsage {
  inputToken?: number;
  outputToken?: number;
  cacheToken?: number;
  totalToken?: number;
}

interface CostUsage {
  totalCost?: number;
  currentMonthCost?: number;
}

interface PluginUsage {
  totalRequestCount?: number;
  webSearchRequestCount?: number;
}

interface RateLimit {
  tpm?: number;
  rpm?: number;
  concurrency?: number;
}

interface UsageData {
  tokenUsage?: TokenUsage;
  costUsage?: CostUsage;
  pluginUsage?: PluginUsage;
  accountRateLimit?: RateLimit;
}

interface UsageResponse {
  code?: number;
  data?: UsageData;
}

function fmtNum(value: number | undefined): string {
  if (value === undefined) return '0';
  return String(value);
}

function fmtMoney(value: number | undefined): string {
  return (Number(value || 0)).toFixed(2);
}

export const quotaUsageCommand = defineCommand({
  name: 'quota usage',
  description: 'cmd.quotaUsage.desc',
  usage: 'mimo quota usage [--cookie <cookie>]',
  options: [
    { flag: '--cookie <value>', description: 'flag.quota.cookie' },
  ],
  examples: [
    'mimo quota usage',
    'mimo quota usage --cookie "serviceToken=...; userId=..."',
    'mimo quota usage --output json',
  ],
  async run(config: Config, flags: Record<string, unknown>): Promise<void> {
    process.stderr.write(t('quota.fetchingUsage') + '\n');

    const cookie = await resolveCookie(config, flags);
    const response = await fetchPlatformApi<UsageResponse>(USAGE_API_URL, cookie);

    checkCookieAuth(response);

    if (response?.code !== 0) {
      throw new CLIError(t('quota.fetchFailed') + 'invalid response', ExitCode.GENERAL);
    }

    const data = response?.data || {};
    const results: Record<string, string>[] = [];

    if (data.tokenUsage) {
      results.push(
        { [t('quota.planName')]: t('quota.inputToken'), [t('quota.remaining')]: fmtNum(data.tokenUsage.inputToken), [t('quota.unit')]: 'token' },
        { [t('quota.planName')]: t('quota.outputToken'), [t('quota.remaining')]: fmtNum(data.tokenUsage.outputToken), [t('quota.unit')]: 'token' },
        { [t('quota.planName')]: t('quota.cacheToken'), [t('quota.remaining')]: fmtNum(data.tokenUsage.cacheToken), [t('quota.unit')]: 'token' },
        { [t('quota.planName')]: t('quota.totalToken'), [t('quota.remaining')]: fmtNum(data.tokenUsage.totalToken), [t('quota.unit')]: 'token' },
      );
    }

    if (data.costUsage) {
      results.push(
        { [t('quota.planName')]: t('quota.totalCost'), [t('quota.remaining')]: fmtMoney(data.costUsage.totalCost), [t('quota.unit')]: 'CNY' },
        { [t('quota.planName')]: t('quota.monthCost'), [t('quota.remaining')]: fmtMoney(data.costUsage.currentMonthCost), [t('quota.unit')]: 'CNY' },
      );
    }

    if (data.pluginUsage) {
      results.push(
        { [t('quota.planName')]: t('quota.pluginRequests'), [t('quota.remaining')]: fmtNum(data.pluginUsage.totalRequestCount), [t('quota.unit')]: t('quota.unitRequests') },
        { [t('quota.planName')]: t('quota.webSearchRequests'), [t('quota.remaining')]: fmtNum(data.pluginUsage.webSearchRequestCount), [t('quota.unit')]: t('quota.unitRequests') },
      );
    }

    if (data.accountRateLimit) {
      results.push(
        { [t('quota.planName')]: t('quota.tpmLimit'), [t('quota.remaining')]: fmtNum(data.accountRateLimit.tpm), [t('quota.unit')]: 'token/min' },
        { [t('quota.planName')]: t('quota.rpmLimit'), [t('quota.remaining')]: fmtNum(data.accountRateLimit.rpm), [t('quota.unit')]: t('quota.unitReqMin') },
        { [t('quota.planName')]: t('quota.concurrency'), [t('quota.remaining')]: fmtNum(data.accountRateLimit.concurrency), [t('quota.unit')]: '' },
      );
    }

    if (results.length === 0) {
      throw new CLIError(t('quota.fetchFailed') + 'no usage data returned', ExitCode.GENERAL);
    }

    console.log(formatOutput(results, config));
  },
});
