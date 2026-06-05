import { defineCommand } from '../../command';
import { CLIError } from '../../errors/base';
import { ExitCode } from '../../errors/codes';
import { createClient } from '../../client/index';
import { dryRun, detectOutputFormat, formatOutput } from '../../output/formatter';
import { createSpinner } from '../../output/progress';
import { audioFileToBase64DataUri, validateAudioFile } from '../../utils/audio';
import { saveAudioData, defaultOutPath } from './synthesize';
import { t } from '../../i18n';
import type { ChatRequest, AudioData, MiMoChatCompletion } from '../../types/api';
import type { TTSCloneFlags } from '../../types/flags';
import type { GlobalFlags } from '../../types/flags';
import type { Config } from '../../config/schema';

export default defineCommand({
  name: 'tts clone',
  description: 'cmd.ttsClone.desc',
  apiDocs: '/docs/api-reference/tts-voiceclone',
  usage: 'mimo tts clone --sample <audio> --text <text> [flags]',
  options: [
    { flag: '--sample <path>', description: 'flag.tts.sample', required: true },
    { flag: '-t, --text <text>', description: 'flag.tts.text', required: true },
    { flag: '--format <fmt>', description: 'flag.tts.format', default: 'wav' },
    { flag: '-o, --out <path>', description: 'flag.tts.out' },
  ],
  examples: [
    'mimo tts clone --sample voice.mp3 --text "你好，世界！"',
    'mimo tts clone --sample my_voice.wav -t "Hello world" --format mp3',
  ],
  async run(config: Config, rawFlags: Record<string, unknown>) {
    const flags = rawFlags as GlobalFlags & TTSCloneFlags;
    const samplePath = flags.sample;
    const text = flags.text;

    if (!samplePath) {
      throw new CLIError(
        t('tts.noSample'),
        ExitCode.USAGE,
        'mimo tts clone --sample voice.mp3 --text "你好，世界！"',
      );
    }
    if (!text) {
      throw new CLIError(
        t('tts.noText'),
        ExitCode.USAGE,
        'mimo tts clone --sample voice.mp3 --text "你好，世界！"',
      );
    }

    await validateAudioFile(samplePath, 10);

    const format = flags.format ?? 'wav';
    const outPath = flags.out ?? defaultOutPath('clone_output', format);

    const spinner = createSpinner(t('spinner.readingSample'));
    spinner.start();

    try {
      const voiceDataUri = await audioFileToBase64DataUri(samplePath);

      spinner.update(t('spinner.cloning'));

      const messages: ChatRequest['messages'] = [
        { role: 'user', content: '' },
        { role: 'assistant', content: text },
      ];

      const body: ChatRequest = {
        model: 'mimo-v2.5-tts-voiceclone',
        messages,
        stream: false,
        audio: {
          format: format as 'wav' | 'mp3' | 'pcm',
          voice: voiceDataUri,
        },
      };

      if (dryRun(config, body)) {
        spinner.stop('');
        return;
      }

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
