import { defineCommand } from '../command';
import { createClient } from '../client/index';
import { formatReasoning } from '../output/reasoning';
import { formatAnnotations, type Annotation } from '../output/annotations';
import { CLIError } from '../errors/base';
import { ExitCode } from '../errors/codes';
import { t } from '../i18n';
import type { ChatMessage, ChatRequest, ToolDef, MiMoChatCompletion, ChatStreamDelta, Usage } from '../types/api';
import { extractDelta, extractChunkUsage, abortStream } from '../types/api';
import type { ChatFlags, GlobalFlags } from '../types/flags';
import type { Config } from '../config/schema';

export default defineCommand({
  name: 'chat',
  description: 'cmd.chat.desc',
  usage: 'mimo chat --message <text> [flags]',
  options: [
    { flag: '-m, --message <text>', description: 'flag.chat.message', required: true },
    { flag: '--model <model>', description: 'flag.chat.model' },
    { flag: '-s, --system <text>', description: 'flag.chat.system' },
    { flag: '--thinking', description: 'flag.chat.thinking' },
    { flag: '--search', description: 'flag.chat.search' },
    { flag: '--force-search', description: 'flag.chat.forceSearch' },
    { flag: '--max-keyword <n>', description: 'flag.chat.maxKeyword', type: 'number' },
    { flag: '--search-limit <n>', description: 'flag.chat.searchLimit', type: 'number' },
    { flag: '--user-country <country>', description: 'flag.chat.userCountry' },
    { flag: '--user-region <region>', description: 'flag.chat.userRegion' },
    { flag: '--user-city <city>', description: 'flag.chat.userCity' },
    { flag: '--stream', description: 'flag.chat.stream', default: true },
    { flag: '--no-stream', description: 'flag.chat.noStream' },
    { flag: '--json', description: 'flag.chat.json' },
    { flag: '--max-tokens <n>', description: 'flag.chat.maxTokens', type: 'number' },
    { flag: '--temperature <n>', description: 'flag.chat.temperature', type: 'number' },
  ],
  examples: [
    'mimo chat --message "What is MiMo?"',
    'mimo chat -m "Hello" --model mimo-v2.5-pro --thinking',
    'mimo chat -m "Latest news" --search',
    'mimo chat -m "武汉明天天气" --search --user-city 武汉',
    'mimo chat -m "Return JSON" --json --no-stream',
    'mimo chat -m "Translate" --system "You are a translator"',
    'mimo chat -m "Short answer" --max-tokens 100 --temperature 0.5',
  ],
  async run(config: Config, rawFlags: Record<string, unknown>) {
    const flags = rawFlags as GlobalFlags & ChatFlags;
    const client = createClient(config);

    const message = flags.message;
    if (!message) {
      throw new CLIError(t('chat.noMessage'), ExitCode.USAGE, 'Usage: mimo chat --message <text>');
    }

    // 边界条件：空消息（仅空白字符）
    if (message.trim().length === 0) {
      throw new CLIError(t('chat.emptyMessage'), ExitCode.USAGE, 'Provide a non-empty message with --message <text>');
    }

    // 边界条件：超长消息（超过 100000 字符）
    const MAX_MESSAGE_LENGTH = 100000;
    if (message.length > MAX_MESSAGE_LENGTH) {
      throw new CLIError(
        t('chat.messageTooLong', { len: String(message.length), max: String(MAX_MESSAGE_LENGTH) }),
        ExitCode.USAGE,
        t('chat.messageTooLongHint'),
      );
    }

    const model = flags.model ?? 'mimo-v2.5-pro';
    const shouldStream = flags.noStream ? false : (flags.stream !== false);

    // Build messages
    const messages: ChatMessage[] = [];
    if (flags.system) {
      messages.push({ role: 'system', content: flags.system });
    }
    messages.push({ role: 'user', content: message });

    // Build request
    const params: ChatRequest = {
      model,
      messages,
      stream: shouldStream,
    };

    if (flags.thinking) {
      params.thinking = { type: 'enabled' };
    }

    if (flags.search) {
      const tool: ToolDef = { type: 'web_search' };
      if (flags.forceSearch) {
        tool.force_search = true;
      }
      // 最大关键词数量
      if (flags.maxKeyword !== undefined) {
        tool.max_keyword = flags.maxKeyword;
      }
      // 搜索结果数量限制
      if (flags.searchLimit !== undefined) {
        tool.limit = flags.searchLimit;
      }
      // 用户位置信息
      if (flags.userCountry || flags.userRegion || flags.userCity) {
        tool.user_location = {
          type: 'approximate',
          ...(flags.userCountry && { country: flags.userCountry }),
          ...(flags.userRegion && { region: flags.userRegion }),
          ...(flags.userCity && { city: flags.userCity }),
        };
      }
      params.tools = [tool];
    }

    if (flags.json) {
      params.response_format = { type: 'json_object' };
    }

    if (flags.maxTokens !== undefined) {
      params.max_completion_tokens = flags.maxTokens;
    }

    if (flags.temperature !== undefined) {
      params.temperature = flags.temperature;
    }

    // Dry-run
    if (config.dryRun) {
      console.log(JSON.stringify({ request: params }, null, 2));
      return;
    }

    if (shouldStream) {
      let fullContent = '';
      let fullReasoning = '';
      const collectedAnnotations: Annotation[] = [];

      const DIM = '\x1b[2m';
      const GRAY = '\x1b[90m';
      const RESET = '\x1b[0m';

      const stream = await client.chatCompletionStream(params);
      try {
        for await (const chunk of stream) {
          for (const choice of chunk.choices) {
            // 使用 extractDelta 安全提取 MiMo 扩展字段
            const delta = extractDelta(choice.delta as Record<string, unknown>);

            if (delta?.reasoning_content) {
              fullReasoning += delta.reasoning_content;
              process.stdout.write(`${DIM}${GRAY}${delta.reasoning_content}${RESET}`);
            }

            if (delta?.content) {
              fullContent += delta.content;
              process.stdout.write(delta.content);
            }

            if (delta?.annotations) {
              collectedAnnotations.push(...delta.annotations);
            }
          }

          // Stream usage may come in the final chunk
          const chunkUsage = extractChunkUsage(chunk as unknown as Record<string, unknown>);
          if (chunkUsage && config.verbose) {
            process.stderr.write(`\n\nTokens: prompt=${chunkUsage.prompt_tokens}, completion=${chunkUsage.completion_tokens}, total=${chunkUsage.total_tokens}\n`);
          }
        }
      } catch (err) {
        // 流式请求失败时给出明确错误提示
        throw new CLIError(
          t('chat.streamFailed') + (err instanceof Error ? err.message : String(err)),
          ExitCode.NETWORK,
          t('chat.streamFailedHint'),
        );
      } finally {
        // 确保流式连接被正确关闭，释放网络资源
        abortStream(stream);
      }

      process.stdout.write('\n');

      if (collectedAnnotations.length > 0) {
        process.stdout.write('\n' + formatAnnotations(collectedAnnotations) + '\n');
      }
    } else {
      const response: MiMoChatCompletion = await client.chatCompletion(params);

      for (const choice of response.choices) {
        const msg = choice.message;
        let output = '';

        if (msg?.reasoning_content && msg?.content) {
          output = formatReasoning(msg.reasoning_content, msg.content);
        } else if (msg?.content) {
          output = msg.content;
        } else if (msg?.reasoning_content) {
          output = formatReasoning(msg.reasoning_content, '');
        }

        if (output) {
          console.log(output);
        }

        if (msg?.annotations && msg.annotations.length > 0) {
          console.log('\n' + formatAnnotations(msg.annotations));
        }
      }

      if (response.usage && config.verbose) {
        process.stderr.write(`\nTokens: prompt=${response.usage.prompt_tokens}, completion=${response.usage.completion_tokens}, total=${response.usage.total_tokens}\n`);
      }
    }
  },
});
