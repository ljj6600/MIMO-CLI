import { defineCommand } from '../command';
import { createClient } from '../client/index';
import { formatReasoning } from '../output/reasoning';
import { formatAnnotations, type Annotation } from '../output/annotations';
import * as clack from '@clack/prompts';
import { t } from '../i18n';
import type { ChatMessage, ChatRequest, ChatStreamDelta } from '../types/api';
import { extractDelta, abortStream } from '../types/api';
import type { ReplFlags, GlobalFlags } from '../types/flags';
import type { Config } from '../config/schema';

export default defineCommand({
  name: 'repl',
  description: 'cmd.repl.desc',
  usage: 'mimo repl [flags]',
  options: [
    { flag: '--model <model>', description: 'flag.repl.model' },
    { flag: '--thinking', description: 'flag.repl.thinking' },
    { flag: '--search', description: 'flag.repl.search' },
    { flag: '-s, --system <text>', description: 'flag.repl.system' },
  ],
  examples: [
    'mimo repl',
    'mimo repl --thinking --system "You are a helpful coding assistant"',
    'mimo repl --search',
  ],
  async run(config: Config, rawFlags: Record<string, unknown>) {
    const flags = rawFlags as GlobalFlags & ReplFlags;
    const client = createClient(config);
    const model = flags.model ?? 'mimo-v2.5-pro';

    // Initialize conversation history
    const messages: ChatMessage[] = [];
    if (flags.system) {
      messages.push({ role: 'system', content: flags.system });
    }

    clack.intro(t('repl.intro'));

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const input = await clack.text({
        message: t('repl.you'),
        placeholder: t('repl.placeholder'),
      });

      if (clack.isCancel(input)) {
        clack.outro(t('repl.goodbye'));
        break;
      }

      const text = (input as string).trim();

      if (!text) continue;

      if (text === '/exit' || text === '/quit') {
        clack.outro(t('repl.goodbye'));
        break;
      }

      if (text === '/clear') {
        messages.length = 0;
        if (flags.system) {
          messages.push({ role: 'system', content: flags.system });
        }
        clack.note(t('repl.cleared'));
        continue;
      }

      // Add user message
      messages.push({ role: 'user', content: text });

      // Build request params
      const params: ChatRequest = {
        model,
        messages,
        stream: true,
      };

      if (flags.thinking) {
        params.thinking = { type: 'enabled' };
      }

      if (flags.search) {
        params.tools = [{ type: 'web_search' }];
      }

      // Stream the response
      let assistantContent = '';
      let assistantReasoning = '';
      const collectedAnnotations: Annotation[] = [];

      const DIM = '\x1b[2m';
      const GRAY = '\x1b[90m';
      const RESET = '\x1b[0m';

      process.stdout.write('\n');

      try {
        const stream = await client.chatCompletionStream(params);
        try {
          for await (const chunk of stream) {
            for (const choice of chunk.choices) {
              // 使用 extractDelta 安全提取 MiMo 扩展字段
              const delta = extractDelta(choice.delta as Record<string, unknown>);

              if (delta?.reasoning_content) {
                assistantReasoning += delta.reasoning_content;
                process.stdout.write(`${DIM}${GRAY}${delta.reasoning_content}${RESET}`);
              }

              if (delta?.content) {
                assistantContent += delta.content;
                process.stdout.write(delta.content);
              }

              if (delta?.annotations) {
                collectedAnnotations.push(...delta.annotations);
              }
            }
          }
        } finally {
          // 确保流式连接被正确关闭，释放网络资源
          abortStream(stream);
        }
      } catch (err) {
        process.stdout.write(`\n\nError: ${err instanceof Error ? err.message : String(err)}\n`);
        // Remove the failed user message so the conversation can continue
        messages.pop();
        continue;
      }

      process.stdout.write('\n');

      if (collectedAnnotations.length > 0) {
        process.stdout.write('\n' + formatAnnotations(collectedAnnotations) + '\n');
      }

      // Add assistant response to history — include reasoning_content to avoid 400 errors
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: assistantContent,
      };
      if (assistantReasoning) {
        assistantMsg.reasoning_content = assistantReasoning;
      }
      messages.push(assistantMsg);
    }
  },
});
