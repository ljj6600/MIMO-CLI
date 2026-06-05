import { defineCommand } from '../command';
import { createClient } from '../client/index';
import { validateAudioFile, audioFileToBase64DataUri } from '../utils/audio';
import { CLIError } from '../errors/base';
import { ExitCode } from '../errors/codes';
import { t } from '../i18n';
import type { ChatMessage, ChatRequest, InputAudioPart, MiMoChatCompletion, ChatStreamDelta } from '../types/api';
import { extractDelta, abortStream } from '../types/api';
import type { ASRFlags, GlobalFlags } from '../types/flags';
import type { Config } from '../config/schema';

export default defineCommand({
  name: 'asr',
  description: 'cmd.asr.desc',
  usage: 'mimo asr <audio-file> [flags]',
  options: [
    { flag: '--language <lang>', description: 'flag.asr.language' },
    { flag: '--stream', description: 'flag.asr.stream' },
    { flag: '--file <path>', description: 'flag.asr.file' },
  ],
  examples: [
    'mimo asr recording.wav',
    'mimo asr audio.mp3 --language zh',
    'mimo asr --file recording.wav --language en',
  ],
  async run(config: Config, rawFlags: Record<string, unknown>) {
    const flags = rawFlags as GlobalFlags & ASRFlags;
    const client = createClient(config);

    // Get audio file path from positional args or --file flag
    const positionalArgs = rawFlags._positional as string[] | undefined;
    const filePath = positionalArgs?.[0] ?? flags.file;

    if (!filePath) {
      throw new CLIError(
        t('asr.noFile'),
        ExitCode.USAGE,
        'Usage: mimo asr <audio-file> [flags]',
      );
    }

    // Validate file format and size
    await validateAudioFile(filePath, 10);

    // Convert to Base64 data URI
    const dataUri = await audioFileToBase64DataUri(filePath);

    const language = flags.language ?? 'auto';

    // Build messages with audio content
    const audioPart: InputAudioPart = {
      type: 'input_audio',
      input_audio: { data: dataUri },
    };

    const messages: ChatMessage[] = [
      {
        role: 'user',
        content: [audioPart],
      },
    ];

    const params: ChatRequest = {
      model: 'mimo-v2.5-asr',
      messages,
      stream: flags.stream ?? false,
      asr_options: { language },
    };

    // Dry-run
    if (config.dryRun) {
      console.log(JSON.stringify({ request: { ...params, messages: [{ role: 'user', content: '[audio data]' }] } }, null, 2));
      return;
    }

    if (flags.stream) {
      const stream = await client.chatCompletionStream(params);
      try {
        for await (const chunk of stream) {
          for (const choice of chunk.choices) {
            // 使用 extractDelta 安全提取 MiMo 扩展字段
            const delta = extractDelta(choice.delta as Record<string, unknown>);
            if (delta?.content) {
              process.stdout.write(delta.content);
            }
          }
        }
      } catch (err) {
        throw new CLIError(
          t('asr.streamFailed') + (err instanceof Error ? err.message : String(err)),
          ExitCode.NETWORK,
          t('asr.checkHint'),
        );
      } finally {
        abortStream(stream);
      }
      process.stdout.write('\n');
    } else {
      let response: MiMoChatCompletion;
      try {
        response = await client.chatCompletion(params);
      } catch (err) {
        throw new CLIError(
          t('asr.requestFailed') + (err instanceof Error ? err.message : String(err)),
          ExitCode.NETWORK,
          t('asr.checkHint'),
        );
      }

      for (const choice of response.choices) {
        const content = choice.message?.content;
        if (content) {
          console.log(typeof content === 'string' ? content : JSON.stringify(content));
        }
      }
    }
  },
});
