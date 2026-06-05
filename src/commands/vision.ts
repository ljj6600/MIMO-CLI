import { defineCommand } from '../command';
import { createClient } from '../client/index';
import { resolveImageInput } from '../utils/image';
import { audioFileToBase64DataUri } from '../utils/audio';
import { videoFileToBase64DataUri } from '../utils/video';
import { CLIError } from '../errors/base';
import { ExitCode } from '../errors/codes';
import { t } from '../i18n';
import type { ChatMessage, ChatRequest, ContentPart, VideoUrlPart, ChatStreamDelta } from '../types/api';
import { extractDelta, abortStream } from '../types/api';
import type { VisionFlags, GlobalFlags } from '../types/flags';
import type { Config } from '../config/schema';

function isUrl(input: string): boolean {
  return input.startsWith('http://') || input.startsWith('https://');
}

export default defineCommand({
  name: 'vision',
  description: 'cmd.vision.desc',
  usage: 'mimo vision --image <path|url> --prompt <text> [flags]',
  options: [
    { flag: '--image <path|url>', description: 'flag.vision.image' },
    { flag: '--audio <path|url>', description: 'flag.vision.audio' },
    { flag: '--video <path|url>', description: 'flag.vision.video' },
    { flag: '-p, --prompt <text>', description: 'flag.vision.prompt', required: true },
    { flag: '--model <model>', description: 'flag.vision.model' },
    { flag: '--stream', description: 'flag.vision.stream', default: true },
    { flag: '--no-stream', description: 'flag.vision.noStream' },
    { flag: '--fps <n>', description: 'flag.vision.fps', type: 'number' },
    { flag: '--media-resolution <value>', description: 'flag.vision.mediaResolution' },
  ],
  examples: [
    'mimo vision --image photo.jpg -p "Describe this image"',
    'mimo vision --image https://example.com/img.png -p "What is in this picture?"',
    'mimo vision --audio recording.mp3 -p "Transcribe this audio"',
    'mimo vision --video clip.mp4 -p "Summarize this video" --fps 1',
    'mimo vision --image a.jpg --audio b.mp3 -p "Compare the image and audio"',
  ],
  async run(config: Config, rawFlags: Record<string, unknown>) {
    const flags = rawFlags as GlobalFlags & VisionFlags;
    const client = createClient(config);

    // Validate at least one media input
    if (!flags.image && !flags.audio && !flags.video) {
      throw new CLIError(
        t('vision.noMedia'),
        ExitCode.USAGE,
        'mimo vision --image <路径|URL> --prompt <文本>',
      );
    }

    if (!flags.prompt) {
      throw new CLIError(
        t('vision.noPrompt'),
        ExitCode.USAGE,
        'mimo vision --image <路径|URL> -p <文本>',
      );
    }

    const model = flags.model ?? 'mimo-v2.5';
    const shouldStream = flags.noStream ? false : (flags.stream !== false);

    // Build content parts
    const content: ContentPart[] = [];

    if (flags.image) {
      const imageUrl = await resolveImageInput(flags.image);
      content.push({ type: 'image_url', image_url: { url: imageUrl } });
    }

    if (flags.audio) {
      if (isUrl(flags.audio)) {
        content.push({ type: 'input_audio', input_audio: { data: flags.audio } });
      } else {
        const dataUri = await audioFileToBase64DataUri(flags.audio);
        content.push({ type: 'input_audio', input_audio: { data: dataUri } });
      }
    }

    if (flags.video) {
      let videoUrl: string;
      if (isUrl(flags.video)) {
        // URL 模式：直接传入，API 侧限制 300 MB
        videoUrl = flags.video;
      } else {
        // 本地文件模式：Base64 编码，限制原始文件 ≤ 37.5 MB（编码后 ≤ 50 MB）
        videoUrl = await videoFileToBase64DataUri(flags.video);
      }
      const videoPart: VideoUrlPart = {
        type: 'video_url',
        video_url: { url: videoUrl },
      };
      if (flags.fps !== undefined) {
        videoPart.fps = flags.fps;
      }
      if (flags.mediaResolution) {
        videoPart.media_resolution = flags.mediaResolution;
      }
      content.push(videoPart);
    }

    // Add the text prompt
    content.push({ type: 'text', text: flags.prompt });

    const messages: ChatMessage[] = [
      { role: 'user', content },
    ];

    const params: ChatRequest = {
      model,
      messages,
      stream: shouldStream,
    };

    // Dry-run
    if (config.dryRun) {
      console.log(JSON.stringify({ request: params }, null, 2));
      return;
    }

    if (shouldStream) {
      // Stream response
      let fullContent = '';
      let fullReasoning = '';

      const DIM = '\x1b[2m';
      const GRAY = '\x1b[90m';
      const RESET = '\x1b[0m';

      const stream = await client.chatCompletionStream(params);
      try {
        for await (const chunk of stream) {
          for (const choice of chunk.choices) {
            const delta = extractDelta(choice.delta as Record<string, unknown>);

            if (delta?.reasoning_content) {
              fullReasoning += delta.reasoning_content;
              process.stdout.write(`${DIM}${GRAY}${delta.reasoning_content}${RESET}`);
            }

            if (delta?.content) {
              fullContent += delta.content;
              process.stdout.write(delta.content);
            }
          }
        }
      } catch (err) {
        throw new CLIError(
          t('vision.requestFailed') + (err instanceof Error ? err.message : String(err)),
          ExitCode.NETWORK,
          t('vision.requestFailedHint'),
        );
      } finally {
        abortStream(stream);
      }

      process.stdout.write('\n');
    } else {
      // Non-stream response
      const response = await client.chatCompletion(params);
      for (const choice of response.choices) {
        const msg = choice.message;
        if (msg?.reasoning_content && msg?.content) {
          console.log(`[Thinking] ${msg.reasoning_content}\n\n${msg.content}`);
        } else if (msg?.content) {
          console.log(msg.content);
        } else if (msg?.reasoning_content) {
          console.log(`[Thinking] ${msg.reasoning_content}`);
        }
      }
    }
  },
});
