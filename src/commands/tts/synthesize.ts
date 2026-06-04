import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { defineCommand } from '../../command';
import { CLIError } from '../../errors/base';
import { ExitCode } from '../../errors/codes';
import { createClient } from '../../client/index';
import { dryRun, detectOutputFormat, formatOutput } from '../../output/formatter';
import { createSpinner } from '../../output/progress';
import { t } from '../../i18n';
import type { ChatRequest, AudioData, MiMoChatCompletion } from '../../types/api';
import type { TTSSynthesizeFlags } from '../../types/flags';
import type { GlobalFlags } from '../../types/flags';
import type { Config } from '../../config/schema';

const VALID_VOICES = [
  'mimo_default', '冰糖', '茉莉', '苏打', '白桦',
  'Mia', 'Chloe', 'Milo', 'Dean',
] as const;

export function defaultOutPath(prefix: string, ext: string): string {
  const ts = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
  return `${prefix}_${ts}.${ext}`;
}

export function saveAudioData(audioData: string, outPath: string): string {
  const dest = resolve(outPath);
  const dir = dirname(dest);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const buffer = Buffer.from(audioData, 'base64');
  writeFileSync(dest, buffer);
  return dest;
}

export default defineCommand({
  name: 'tts synthesize',
  description: 'cmd.ttsSynth.desc',
  apiDocs: '/docs/api-reference/tts',
  usage: 'mimo tts synthesize --text <text> [flags]',
  options: [
    { flag: '-t, --text <text>', description: 'Text to synthesize', required: true },
    { flag: '--voice <id>', description: `Voice ID (default: mimo_default). Valid: ${VALID_VOICES.join(', ')}`, default: 'mimo_default' },
    { flag: '--style <desc>', description: 'Natural language style instruction' },
    { flag: '--format <fmt>', description: 'Audio format: wav/mp3/pcm (default: wav)', default: 'wav' },
    { flag: '-o, --out <path>', description: 'Output file path' },
  ],
  examples: [
    'mimo tts synthesize --text "你好，世界！"',
    'mimo tts synthesize -t "Hello world" --voice Mia --format mp3',
    'mimo tts synthesize -t "温柔地说" --style "温柔、缓慢" --voice 茉莉',
  ],
  async run(config: Config, rawFlags: Record<string, unknown>) {
    const flags = rawFlags as GlobalFlags & TTSSynthesizeFlags;
    const text = flags.text;
    if (!text) {
      throw new CLIError(
        t('tts.noText'),
        ExitCode.USAGE,
        'mimo tts synthesize --text "你好，世界！"',
      );
    }

    // 边界条件：空文本（仅空白字符）
    if (text.trim().length === 0) {
      throw new CLIError(
        t('tts.emptyText'),
        ExitCode.USAGE,
        'Provide non-empty text to synthesize.',
      );
    }

    // 边界条件：超长文本（超过 5000 字符）
    const MAX_TTS_TEXT_LENGTH = 5000;
    if (text.length > MAX_TTS_TEXT_LENGTH) {
      throw new CLIError(
        t('tts.textTooLong', { len: String(text.length), max: String(MAX_TTS_TEXT_LENGTH) }),
        ExitCode.USAGE,
        t('tts.textTooLongHint'),
      );
    }

    const voice = flags.voice ?? 'mimo_default';
    if (!(VALID_VOICES as readonly string[]).includes(voice)) {
      throw new CLIError(
        t('tts.invalidVoice') + '"' + voice + '". ' + VALID_VOICES.join(', '),
        ExitCode.USAGE,
      );
    }

    const format = flags.format ?? 'wav';
    const outPath = flags.out ?? defaultOutPath('tts_output', format);

    const messages: ChatRequest['messages'] = [];
    if (flags.style) {
      messages.push({ role: 'user', content: flags.style });
      messages.push({ role: 'assistant', content: text });
    } else {
      messages.push({ role: 'assistant', content: text });
    }

    const body: ChatRequest = {
      model: 'mimo-v2.5-tts',
      messages,
      stream: false,
      audio: {
        format: format as 'wav' | 'mp3' | 'pcm',
        voice,
      },
    };

    if (dryRun(config, body)) return;

    const spinner = createSpinner(t('spinner.synthesizing'));
    spinner.start();

    try {
      const client = createClient(config);
      const response: MiMoChatCompletion = await client.chatCompletion(body);

      const audio = response.choices?.[0]?.message?.audio as AudioData | undefined;
      if (!audio?.data) {
        throw new CLIError(t('tts.noAudioData'), ExitCode.GENERAL);
      }

      const savedPath = saveAudioData(audio.data, outPath);
      spinner.stop('');

      const outputFormat = detectOutputFormat(config.output);
      if (!config.quiet) {
        console.log(formatOutput({ output: savedPath, voice, format }, outputFormat));
      } else {
        console.log(savedPath);
      }
    } catch (err) {
      spinner.stop('');
      throw err;
    }
  },
});
