import { defineCommand } from '../../command';
import { CLIError } from '../../errors/base';
import { ExitCode } from '../../errors/codes';
import { createClient } from '../../client/index';
import { dryRun, detectOutputFormat, formatOutput } from '../../output/formatter';
import { createSpinner } from '../../output/progress';
import { saveAudioData, defaultOutPath } from './synthesize';
import { t } from '../../i18n';
import type { ChatRequest, AudioData, MiMoChatCompletion } from '../../types/api';
import type { TTSDesignFlags } from '../../types/flags';
import type { GlobalFlags } from '../../types/flags';
import type { Config } from '../../config/schema';

export default defineCommand({
  name: 'tts design',
  description: 'cmd.ttsDesign.desc',
  apiDocs: '/docs/api-reference/tts-voicedesign',
  usage: 'mimo tts design --prompt <description> [flags]',
  options: [
    { flag: '-p, --prompt <desc>', description: 'Voice description text', required: true },
    { flag: '-t, --text <text>', description: 'Text to synthesize (optional if --optimize-text)' },
    { flag: '--optimize-text', description: 'Enable smart text preview optimization' },
    { flag: '--format <fmt>', description: 'Audio format: wav/mp3/pcm (default: wav)', default: 'wav' },
    { flag: '-o, --out <path>', description: 'Output file path' },
  ],
  examples: [
    'mimo tts design --prompt "温柔的女声，语速较慢" --text "你好，世界！"',
    'mimo tts design -p "低沉男声，播音腔" --optimize-text',
    'mimo tts design --prompt "活泼的少女音" -t "今天天气真好" --format mp3',
  ],
  async run(config: Config, rawFlags: Record<string, unknown>) {
    const flags = rawFlags as GlobalFlags & TTSDesignFlags;
    const prompt = flags.prompt;
    if (!prompt) {
      throw new CLIError(
        t('tts.noPrompt'),
        ExitCode.USAGE,
        'mimo tts design --prompt "温柔的女声" --text "你好"',
      );
    }

    const text = flags.text;
    const optimizeText = flags.optimizeText ?? false;

    if (!text && !optimizeText) {
      throw new CLIError(
        t('tts.noTextOrOptimize'),
        ExitCode.USAGE,
        'mimo tts design --prompt "温柔的女声" --text "你好" 或 --optimize-text',
      );
    }

    const format = flags.format ?? 'wav';
    const outPath = flags.out ?? defaultOutPath('design_output', format);

    const messages: ChatRequest['messages'] = [
      { role: 'user', content: prompt },
    ];
    if (text) {
      messages.push({ role: 'assistant', content: text });
    }

    const audioConfig: ChatRequest['audio'] = {
      format: format as 'wav' | 'mp3' | 'pcm',
    };
    if (optimizeText && !text) {
      audioConfig.optimize_text_preview = true;
    }

    const body: ChatRequest = {
      model: 'mimo-v2.5-tts-voicedesign',
      messages,
      stream: false,
      audio: audioConfig,
    };

    if (dryRun(config, body)) return;

    const spinner = createSpinner(t('spinner.designing'));
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
        console.log(formatOutput({ output: savedPath, format }, outputFormat));
      } else {
        console.log(savedPath);
      }
    } catch (err) {
      spinner.stop('');
      throw err;
    }
  },
});
