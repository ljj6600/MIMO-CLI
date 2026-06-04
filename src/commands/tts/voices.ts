import { defineCommand } from '../../command';
import { formatTable } from '../../output/text';
import { detectOutputFormat, formatOutput } from '../../output/formatter';
import type { TTSVoice } from '../../types/api';
import type { GlobalFlags, TTSVoicesFlags } from '../../types/flags';
import type { Config } from '../../config/schema';

const VOICES: TTSVoice[] = [
  { name: 'MiMo默认', voiceId: 'mimo_default', language: '中/英', gender: '-' },
  { name: '冰糖', voiceId: '冰糖', language: '中文', gender: '女' },
  { name: '茉莉', voiceId: '茉莉', language: '中文', gender: '女' },
  { name: '苏打', voiceId: '苏打', language: '中文', gender: '男' },
  { name: '白桦', voiceId: '白桦', language: '中文', gender: '男' },
  { name: 'Mia', voiceId: 'Mia', language: '英文', gender: '女' },
  { name: 'Chloe', voiceId: 'Chloe', language: '英文', gender: '女' },
  { name: 'Milo', voiceId: 'Milo', language: '英文', gender: '男' },
  { name: 'Dean', voiceId: 'Dean', language: '英文', gender: '男' },
];

export default defineCommand({
  name: 'tts voices',
  description: 'cmd.ttsVoices.desc',
  usage: 'mimo tts voices',
  options: [],
  examples: [
    'mimo tts voices',
    'mimo tts voices --output json',
  ],
  async run(config: Config, _rawFlags: Record<string, unknown>) {
    const format = detectOutputFormat(config.output);

    if (format === 'json') {
      console.log(formatOutput(VOICES, format));
      return;
    }

    const headers = ['name', 'voiceId', 'language', 'gender'];
    const rows = VOICES.map(v => [v.name, v.voiceId, v.language, v.gender]);
    console.log(formatTable(headers, rows));
  },
});
