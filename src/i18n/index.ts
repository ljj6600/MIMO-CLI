// ============================================================
// MiMo CLI 国际化 (i18n) 模块
// ============================================================

export type Locale = 'zh' | 'en';

// 当前语言，默认中文
let currentLocale: Locale = 'zh';

export function getLocale(): Locale {
  return currentLocale;
}

export function setLocale(locale: Locale): void {
  if (locale !== 'zh' && locale !== 'en') {
    currentLocale = 'zh';
  } else {
    currentLocale = locale;
  }
}

// 从配置值初始化语言
export function initLocale(configLang?: string): void {
  if (!configLang) {
    // 尝试从环境变量检测
    const envLang = process.env.LANG || process.env.LC_ALL || process.env.LC_MESSAGES || '';
    if (envLang.startsWith('zh')) {
      currentLocale = 'zh';
    } else {
      currentLocale = 'zh'; // 默认中文
    }
    return;
  }
  if (configLang === 'en') {
    currentLocale = 'en';
  } else {
    currentLocale = 'zh';
  }
}

// ============================================================
// 翻译字典
// ============================================================

const translations: Record<string, Record<Locale, string>> = {
  // ---- 主界面 ----
  'main.usage': {
    zh: '用法：mimo <资源> <命令> [参数]',
    en: 'Usage: mimo <resource> <command> [flags]',
  },
  'main.resources': {
    zh: '可用命令：',
    en: 'Resources:',
  },
  'main.globalFlags': {
    zh: '全局参数：',
    en: 'Global Flags:',
  },
  'main.gettingHelp': {
    zh: '获取帮助：',
    en: 'Getting Help:',
  },
  'main.helpHint1': {
    zh: '在任何命令后添加 --help 查看完整选项、默认值和示例。',
    en: 'Add --help after any command to see its full list of options, defaults,',
  },
  'main.helpHint2': {
    zh: '例如：',
    en: 'and usage examples. For example:',
  },
  'main.notLoggedIn': {
    zh: '  尚未配置 API Key。',
    en: '  No API key configured.',
  },
  'main.loginHint1': {
    zh: '  mimo auth login              交互式输入 API Key',
    en: '  mimo auth login              Enter an API key interactively',
  },
  'main.loginHint2': {
    zh: '  mimo auth login --api-key    直接保存 API Key',
    en: '  mimo auth login --api-key    Save an API key directly',
  },
  'main.interrupted': {
    zh: '\n已中断，退出。',
    en: '\nInterrupted. Exiting.',
  },
  'main.fatalArgv': {
    zh: '致命错误：无法读取进程参数。\n',
    en: 'Fatal: failed to read process arguments.\n',
  },

  // ---- 命令帮助 ----
  'help.usage': { zh: '用法：', en: 'Usage:' },
  'help.options': { zh: '选项：', en: 'Options:' },
  'help.examples': { zh: '示例：', en: 'Examples:' },
  'help.apiRef': { zh: 'API 参考：', en: 'API Reference:' },
  'help.commands': { zh: '子命令：', en: 'Commands:' },
  'help.globalHint': {
    zh: '全局参数（--api-key、--output、--quiet 等）始终可用。',
    en: 'Global flags (--api-key, --output, --quiet, etc.) are always available.',
  },
  'help.globalHintRun': {
    zh: '运行 mimo --help 查看完整列表。',
    en: 'Run mimo --help for the full list.',
  },

  // ---- 错误处理 ----
  'error.prefix': { zh: '错误：', en: 'Error:' },
  'error.exitCode': { zh: '（退出码 {code}）', en: '(exit code {code})' },
  'error.timeout': { zh: '请求超时。', en: 'Request timed out.' },
  'error.timeoutHint': {
    zh: '尝试增大超时时间（如 --timeout 60）。\n如果使用有效 API Key 仍然频繁超时，请检查网络和区域。\n运行：mimo auth status   — 检查认证状态。',
    en: 'Try increasing --timeout (e.g. --timeout 60).\nIf this happens on every request with a valid API key, check your network and region.\nRun: mimo auth status   — to check your credentials.',
  },
  'error.network': { zh: '网络请求失败。', en: 'Network request failed.' },
  'error.networkHint': {
    zh: '请检查网络连接。\n如需使用代理：设置 HTTPS_PROXY 环境变量，或运行：mimo config set proxy http://HOST:PORT',
    en: 'Check your network connection.\nTo use a proxy: set HTTPS_PROXY env var, or run: mimo config set proxy http://HOST:PORT',
  },
  'error.proxyHint': {
    zh: '代理连接失败 — 请检查代理 URL 和认证信息。\n检查：HTTPS_PROXY / HTTP_PROXY 环境变量，或运行 mimo config show 查看已配置的代理。',
    en: 'Proxy connection failed — verify your proxy URL and authentication.\nCheck: HTTPS_PROXY / HTTP_PROXY env vars, or mimo config show for configured proxy.',
  },
  'error.fsEnoent': { zh: '文件或目录不存在。', en: 'File or directory not found.' },
  'error.fsEacces': { zh: '权限不足 — 请检查文件或目录权限。', en: 'Permission denied — check file or directory permissions.' },
  'error.fsEnospc': { zh: '磁盘空间不足 — 请释放空间后重试。', en: 'Disk full — free up space and try again.' },
  'error.fsDefault': { zh: '请检查文件路径和权限。', en: 'Check the file path and permissions.' },
  'error.fsPrefix': { zh: '文件系统错误：', en: 'File system error: ' },

  // ---- API 错误 ----
  'api.400': { zh: '请求参数错误：', en: 'Bad request: ' },
  'api.400Hint': { zh: '请检查请求格式和参数。', en: 'Check your request format and parameters.' },
  'api.401': { zh: '认证失败（HTTP 401）。', en: 'Authentication failed (HTTP 401).' },
  'api.401Hint': { zh: '请检查 API Key：mimo auth status\n重新登录：mimo auth login', en: 'Check your API Key: mimo auth status\nRe-authenticate: mimo auth login' },
  'api.402': { zh: '余额不足：', en: 'Payment required: ' },
  'api.402Hint': { zh: '账户余额不足，请充值。', en: 'Insufficient balance. Please top up your account.' },
  'api.403': { zh: '访问被拒绝（HTTP 403）。', en: 'Access denied (HTTP 403).' },
  'api.403Hint': { zh: '您的 API Key 可能无权访问此资源，或 Key 受限。\n请检查 API Key 权限。', en: 'Your API Key may not have access to this resource, or the key is restricted.\nCheck your API Key permissions.' },
  'api.404': { zh: '未找到：', en: 'Not found: ' },
  'api.404Hint': { zh: '请求的模型或功能可能不受支持，请检查模型名称和接口地址。', en: 'The requested model or feature may not be supported. Check the model name and endpoint.' },
  'api.421': { zh: '内容被过滤：', en: 'Content filtered: ' },
  'api.421Hint': { zh: '您的输入被内容安全过滤器标记，请修改后重试。', en: 'Your input was flagged by the content safety filter. Please modify your request and try again.' },
  'api.429': { zh: '请求频率超限：', en: 'Rate limit exceeded: ' },
  'api.429Hint': { zh: '请求过于频繁，请稍后重试或检查配额。', en: 'You are sending requests too quickly. Please wait and retry, or check your quota.' },
  'api.500': { zh: '服务器内部错误（HTTP 500）。', en: 'Server error (HTTP 500).' },
  'api.500Hint': { zh: '服务器遇到内部错误，请稍后重试。', en: 'The server encountered an internal error. Please retry later.' },
  'api.503': { zh: '服务暂不可用（HTTP 503）。', en: 'Service unavailable (HTTP 503).' },
  'api.503Hint': { zh: '服务器暂时过载或维护中，请稍后重试。', en: 'The server is temporarily overloaded or under maintenance. Please retry later.' },
  'api.default': { zh: 'API 错误：', en: 'API error: ' },

  // ---- 认证 ----
  'auth.noCreds': { zh: '未找到 API Key。', en: 'No API key found.' },
  'auth.noCredsHint': {
    zh: '登录：        mimo auth login\n直接传入：    --api-key <key>\n环境变量：    MIMO_API_KEY=<key>',
    en: 'Log in:        mimo auth login\nPass directly:  --api-key <key>\nSet env var:    MIMO_API_KEY=<key>',
  },
  'auth.noKeyProvided': { zh: '未提供 API Key。', en: 'No API key provided.' },
  'auth.noKeyHint': { zh: '使用：mimo auth login --api-key <key>', en: 'Use: mimo auth login --api-key <key>' },
  'auth.keyEmpty': { zh: 'API Key 不能为空。', en: 'API key cannot be empty.' },
  'auth.keyRequired': { zh: 'API Key 为必填项。', en: 'API key is required.' },
  'auth.keySaved': { zh: 'API Key 已保存至', en: 'API key saved to' },
  'auth.baseUrlAuto': { zh: '接口地址已自动配置：', en: 'Base URL auto-configured: ' },
  'auth.promptTitle': { zh: '请输入您的 MiMo API Key：', en: 'Please enter your MiMo API key:' },
  'auth.promptPayKey': { zh: '- 按量计费 Key：以 "sk-" 等非 "tp-" 前缀开头', en: '- Pay-as-you-go Key: starts with "sk-" or other non-"tp-" prefix' },
  'auth.promptTpKey': { zh: '- TokenPlan Key：以 "tp-" 前缀开头', en: '- TokenPlan Key: starts with "tp-" prefix' },
  'auth.promptLabel': { zh: '输入 MiMo API Key：', en: 'Enter your MiMo API key:' },
  'auth.logoutNoKey': { zh: '配置文件中未找到 API Key，已处于登出状态。', en: 'No API key found in config file. Already logged out.' },
  'auth.logoutDone': { zh: 'API Key 已移除，您已登出。', en: 'API key removed. You are now logged out.' },

  // ---- 命令描述 ----
  'cmd.chat.desc': { zh: '发送对话请求', en: 'Send a chat completion request' },
  'cmd.repl.desc': { zh: '交互式多轮对话', en: 'Interactive multi-turn REPL conversation' },
  'cmd.vision.desc': { zh: '多模态理解（图片、音频、视频）', en: 'Multi-modal understanding (image, audio, video)' },
  'cmd.asr.desc': { zh: '语音识别（ASR）', en: 'Speech recognition (ASR)' },
  'cmd.ttsSynth.desc': { zh: '预设音色语音合成', en: 'Pre-set voice text-to-speech synthesis' },
  'cmd.ttsClone.desc': { zh: '声音克隆语音合成', en: 'Voice clone text-to-speech synthesis' },
  'cmd.ttsDesign.desc': { zh: '自定义音色语音合成', en: 'Voice design text-to-speech synthesis' },
  'cmd.ttsVoices.desc': { zh: '列出可用的 TTS 音色', en: 'List available TTS voices' },
  'cmd.authLogin.desc': { zh: '使用 MiMo API Key 登录（自动识别按量计费/TokenPlan）', en: 'Log in with a MiMo API key (auto-detects key type: Pay-as-you-go or TokenPlan)' },
  'cmd.authStatus.desc': { zh: '查看当前认证状态', en: 'Show current authentication status' },
  'cmd.authLogout.desc': { zh: '清除已保存的 API Key', en: 'Clear saved API key from config file' },
  'cmd.configShow.desc': { zh: '显示当前配置', en: 'Display current configuration' },
  'cmd.configSet.desc': { zh: '设置配置项', en: 'Set a configuration value' },
  'cmd.update.desc': { zh: '更新 MiMo CLI', en: 'Self-update the MiMo CLI' },
  'cmd.help.desc': { zh: '显示命令帮助', en: 'Show help for commands' },
  'cmd.language.desc': { zh: '切换界面语言（zh/en）', en: 'Switch interface language (zh/en)' },

  // ---- 视频理解错误 ----
  'vision.videoTooLarge': {
    zh: '视频文件过大：{size}MB（原始）。Base64 编码后将超过 {limit}MB 的 API 限制。',
    en: 'Video file too large: {size}MB (raw). After Base64 encoding it would exceed the {limit}MB API limit.',
  },
  'vision.videoTooLargeHint': {
    zh: '请改用 URL 方式传入视频（URL 模式支持最大 300MB），或将视频压缩至 {max}MB 以下。',
    en: 'Please use a URL to pass the video instead (URL mode supports up to 300MB), or compress the video to under {max}MB.',
  },
  'vision.videoBase64TooLarge': {
    zh: '视频 Base64 大小 {size}MB 超过 {limit}MB 的 API 限制。',
    en: 'Video Base64 size {size}MB exceeds the {limit}MB API limit.',
  },
  'vision.videoBase64TooLargeHint': {
    zh: '请改用 URL 方式传入视频（URL 模式支持最大 300MB），或压缩视频。',
    en: 'Please use a URL to pass the video instead (URL mode supports up to 300MB), or compress the video.',
  },
  'vision.noMedia': {
    zh: '至少需要提供 --image、--audio 或 --video 中的一项。',
    en: 'At least one of --image, --audio, or --video is required.',
  },
  'vision.noPrompt': {
    zh: '缺少必填参数：--prompt',
    en: 'Missing required flag: --prompt',
  },
  'vision.requestFailed': {
    zh: '多模态请求失败：',
    en: 'Vision request failed: ',
  },
  'vision.requestFailedHint': {
    zh: '请检查网络连接和媒体文件格式。',
    en: 'Check your network connection and media file format.',
  },

  // ---- Chat 错误 ----
  'chat.noMessage': { zh: '缺少必填参数：--message', en: 'Missing required flag: --message' },
  'chat.emptyMessage': { zh: '消息不能为空或仅包含空白字符。', en: 'Message cannot be empty or whitespace only.' },
  'chat.messageTooLong': { zh: '消息过长：{len} 字符（上限 {max}）。', en: 'Message too long: {len} characters (max {max}).' },
  'chat.messageTooLongHint': { zh: '请缩短消息或拆分为多次请求。', en: 'Shorten your message or split it into multiple requests.' },
  'chat.streamFailed': { zh: '流式请求失败：', en: 'Stream request failed: ' },
  'chat.streamFailedHint': { zh: '请检查网络连接和 API Key。', en: 'Check your network connection and API key.' },

  // ---- ASR 错误 ----
  'asr.noFile': { zh: '需要提供音频文件路径。', en: 'Audio file path is required.' },
  'asr.streamFailed': { zh: '语音识别流式请求失败：', en: 'ASR stream request failed: ' },
  'asr.requestFailed': { zh: '语音识别请求失败：', en: 'ASR request failed: ' },
  'asr.checkHint': { zh: '请检查网络连接和音频文件格式。', en: 'Check your network connection and audio file format.' },

  // ---- TTS 错误 ----
  'tts.noText': { zh: '--text 为必填项。', en: '--text is required.' },
  'tts.emptyText': { zh: '--text 不能为空或仅包含空白字符。', en: '--text cannot be empty or whitespace only.' },
  'tts.textTooLong': { zh: '文本过长：{len} 字符（上限 {max}）。', en: 'Text too long: {len} characters (max {max}).' },
  'tts.textTooLongHint': { zh: '请缩短文本或拆分为多次合成请求。', en: 'Shorten your text or split into multiple synthesis requests.' },
  'tts.noSample': { zh: '--sample 为必填项。', en: '--sample is required.' },
  'tts.noPrompt': { zh: '--prompt 为必填项。', en: '--prompt is required.' },
  'tts.noTextOrOptimize': { zh: '需要提供 --text 或启用 --optimize-text。', en: 'Either --text or --optimize-text is required.' },
  'tts.noAudioData': { zh: 'API 响应中缺少音频数据。', en: 'API response missing audio data.' },
  'tts.invalidVoice': { zh: '无效音色：', en: 'Invalid voice: ' },

  // ---- Config ----
  'config.keyRequired': { zh: '--key 为必填项。', en: '--key is required.' },
  'config.valueRequired': { zh: '--value 为必填项。', en: '--value is required.' },
  'config.invalidKey': { zh: '无效的配置键：', en: 'Invalid config key: ' },
  'config.invalidKeyChars': { zh: '配置键只能包含字母、数字和下划线。', en: 'Config key must only contain letters, numbers, and underscores.' },
  'config.validKeys': { zh: '有效的键：', en: 'Valid keys: ' },
  'config.setTimeout': { zh: 'timeout 必须为正数。', en: 'timeout must be a positive number.' },
  'config.setOutput': { zh: 'output 必须为 "text" 或 "json"。', en: 'output must be "text" or "json".' },
  'config.setDone': { zh: '已设置', en: 'Set' },
  'config.invalidActiveKey': { zh: 'active_key 必须为 "tp" 或 "sk"。', en: 'active_key must be "tp" or "sk".' },
  'config.switchKey': { zh: '已切换为{type} Key（{url}）', en: 'Switched to {type} key ({url})' },
  'config.corrupted': { zh: '警告：配置文件已损坏（', en: 'Warning: config file is corrupted (' },
  'config.corruptedHint': { zh: '）。运行 "mimo config set" 重置。\n', en: '). Run \'mimo config set\' to reset.\n' },

  // ---- Update ----
  'update.checking': { zh: '正在检查更新...', en: 'Checking for updates...' },
  'update.checkFailed': { zh: '无法检查更新，请检查网络连接。', en: 'Failed to check for updates. Please check your network connection.' },
  'update.currentVersion': { zh: '当前版本：{version}', en: 'Current version: {version}' },
  'update.latestVersion': { zh: '最新版本：{version}', en: 'Latest version: {version}' },
  'update.alreadyLatest': { zh: '已是最新版本，无需更新。', en: 'Already up to date.' },
  'update.updating': { zh: '正在更新至 v{version}...', en: 'Updating to v{version}...' },
  'update.success': { zh: '更新成功！已升级至 v{version}。', en: 'Update successful! Upgraded to v{version}.' },
  'update.updateFailed': { zh: 'npm update 失败，尝试 npm install...', en: 'npm update failed, trying npm install...' },
  'update.installFailed': { zh: '自动更新失败。', en: 'Auto-update failed.' },
  'update.manualHint': { zh: '请手动执行：npm install -g mimo-cli@latest', en: 'Please run manually: npm install -g mimo-cli@latest' },

  // ---- REPL ----
  'repl.intro': { zh: 'MiMo 交互对话 — 输入 /exit 退出，/clear 清空对话', en: 'MiMo REPL — type /exit to quit, /clear to reset' },
  'repl.you': { zh: '你', en: 'You' },
  'repl.placeholder': { zh: '输入你的消息...', en: 'Type your message...' },
  'repl.goodbye': { zh: '再见！', en: 'Goodbye!' },
  'repl.cleared': { zh: '对话已清空。', en: 'Conversation cleared.' },

  // ---- Spinner ----
  'spinner.synthesizing': { zh: '正在合成语音...', en: 'Synthesizing speech...' },
  'spinner.readingSample': { zh: '正在读取音频样本...', en: 'Reading audio sample...' },
  'spinner.cloning': { zh: '正在合成克隆语音...', en: 'Synthesizing cloned speech...' },
  'spinner.designing': { zh: '正在设计音色...', en: 'Designing voice...' },

  // ---- Language 命令 ----
  'language.current': { zh: '当前界面语言：', en: 'Current interface language: ' },
  'language.changed': { zh: '界面语言已切换为中文。', en: 'Interface language changed to English.' },
  'language.invalid': { zh: '无效的语言代码，请使用 zh（中文）或 en（英文）。', en: 'Invalid language code. Use zh (Chinese) or en (English).' },
  'language.hint': { zh: '使用：mimo language zh 或 mimo language en', en: 'Usage: mimo language zh or mimo language en' },

  // ---- 全局参数 ----
  'flag.apiKey': { zh: '覆盖配置中的 API Key', en: 'Override API Key from config' },
  'flag.baseUrl': { zh: '覆盖接口地址', en: 'Override API base URL' },
  'flag.output': { zh: '输出格式（text/json）', en: 'Output format (text/json)' },
  'flag.timeout': { zh: '请求超时时间（秒）', en: 'Request timeout in seconds' },
  'flag.quiet': { zh: '静默模式，仅输出必要信息', en: 'Suppress non-essential output' },
  'flag.verbose': { zh: '显示详细日志', en: 'Show verbose logging' },
  'flag.noColor': { zh: '禁用彩色输出', en: 'Disable colored output' },
  'flag.dryRun': { zh: '仅打印请求体，不实际执行', en: 'Print request body without executing' },
  'flag.nonInteractive': { zh: '非交互模式', en: 'Non-interactive mode' },
  'flag.help': { zh: '显示帮助信息', en: 'Show help' },
  'flag.version': { zh: '显示版本号', en: 'Show version' },

  // ---- Chat 选项 ----
  'flag.chat.message': { zh: '消息内容', en: 'Message text' },
  'flag.chat.model': { zh: '模型名称（默认：mimo-v2.5-pro）', en: 'Model name (default: mimo-v2.5-pro)' },
  'flag.chat.system': { zh: '系统提示词', en: 'System prompt' },
  'flag.chat.thinking': { zh: '启用深度思考模式', en: 'Enable thinking mode' },
  'flag.chat.search': { zh: '启用联网搜索', en: 'Enable web search' },
  'flag.chat.forceSearch': { zh: '强制联网搜索', en: 'Force web search' },
  'flag.chat.maxKeyword': { zh: '单次搜索最大关键词数量', en: 'Max keywords per search' },
  'flag.chat.searchLimit': { zh: '搜索结果数量限制', en: 'Search result limit' },
  'flag.chat.userCountry': { zh: '用户位置：国家', en: 'User location: country' },
  'flag.chat.userRegion': { zh: '用户位置：地区', en: 'User location: region' },
  'flag.chat.userCity': { zh: '用户位置：城市', en: 'User location: city' },
  'flag.chat.stream': { zh: '流式输出（默认开启，用 --no-stream 关闭）', en: 'Streaming output (default: on, use --no-stream to disable)' },
  'flag.chat.noStream': { zh: '禁用流式输出', en: 'Disable streaming output' },
  'flag.chat.json': { zh: '结构化 JSON 输出', en: 'Structured JSON output' },
  'flag.chat.maxTokens': { zh: '最大生成令牌数', en: 'Max completion tokens' },
  'flag.chat.temperature': { zh: '采样温度', en: 'Sampling temperature' },

  // ---- REPL 选项 ----
  'flag.repl.model': { zh: '模型名称（默认：mimo-v2.5-pro）', en: 'Model name (default: mimo-v2.5-pro)' },
  'flag.repl.thinking': { zh: '启用深度思考模式', en: 'Enable thinking mode' },
  'flag.repl.search': { zh: '启用联网搜索', en: 'Enable web search' },
  'flag.repl.system': { zh: '系统提示词', en: 'System prompt' },

  // ---- Vision 选项 ----
  'flag.vision.image': { zh: '图片路径或 URL', en: 'Image file path or URL' },
  'flag.vision.audio': { zh: '音频路径或 URL', en: 'Audio file path or URL' },
  'flag.vision.video': { zh: '视频路径或 URL', en: 'Video file path or URL' },
  'flag.vision.prompt': { zh: '对内容的提问', en: 'Question about the content' },
  'flag.vision.model': { zh: '模型名称（默认：mimo-v2.5）', en: 'Model name (default: mimo-v2.5)' },
  'flag.vision.stream': { zh: '流式输出（默认开启，用 --no-stream 关闭）', en: 'Streaming output (default: on, use --no-stream to disable)' },
  'flag.vision.noStream': { zh: '禁用流式输出', en: 'Disable streaming output' },
  'flag.vision.fps': { zh: '视频帧率（默认：2）', en: 'Video frame rate (default: 2)' },
  'flag.vision.mediaResolution': { zh: '视频分辨率：default | max', en: 'Video resolution: default | max' },

  // ---- ASR 选项 ----
  'flag.asr.language': { zh: '语言：auto | zh | en（默认：auto）', en: 'Language: auto | zh | en (default: auto)' },
  'flag.asr.stream': { zh: '启用流式输出', en: 'Enable streaming output' },
  'flag.asr.file': { zh: '音频文件路径（替代位置参数）', en: 'Audio file path (alternative to positional arg)' },

  // ---- TTS 选项 ----
  'flag.tts.text': { zh: '待合成文本', en: 'Text to synthesize' },
  'flag.tts.voice': { zh: '音色 ID（默认：mimo_default）', en: 'Voice ID (default: mimo_default)' },
  'flag.tts.style': { zh: '自然语言风格指令', en: 'Natural language style instruction' },
  'flag.tts.format': { zh: '音频格式：wav/mp3/pcm（默认：wav）', en: 'Audio format: wav/mp3/pcm (default: wav)' },
  'flag.tts.out': { zh: '输出文件路径', en: 'Output file path' },
  'flag.tts.sample': { zh: '音频样本文件路径（mp3/wav）', en: 'Audio sample file path (mp3/wav)' },
  'flag.ttsDesign.prompt': { zh: '音色描述文本', en: 'Voice description text' },
  'flag.ttsDesign.text': { zh: '待合成文本（启用 --optimize-text 时可省略）', en: 'Text to synthesize (optional if --optimize-text)' },
  'flag.ttsDesign.optimizeText': { zh: '启用智能文本预览优化', en: 'Enable smart text preview optimization' },

  // ---- Config 选项 ----
  'flag.config.key': { zh: '要设置的配置键', en: 'Config key to set' },
  'flag.config.value': { zh: '要设置的配置值', en: 'Config value to set' },

  // ---- Help 选项 ----
  'flag.help.command': { zh: '要查看帮助的命令路径（如 "auth login"）', en: 'Command path to get help for (e.g. "auth login")' },

  // ---- Auth 选项 ----
  'flag.auth.apiKey': { zh: '直接保存 API Key（跳过交互式输入）', en: 'API key to save (skips interactive prompt)' },

  // ---- Registry 错误 ----
  'registry.unknownCommand': { zh: '未知命令：mimo {command}', en: 'Unknown command: mimo {command}' },
  'registry.availableCommands': { zh: '可用命令：', en: 'Available commands:' },
  'registry.runHelp': { zh: '运行 mimo {command} --help 查看更多信息。', en: 'Run mimo {command} --help for more information.' },
  'registry.runHelpRoot': { zh: '运行 mimo --help 查看可用命令。', en: 'Run mimo --help for available commands.' },

  // ---- 通用 ----
  'general.notSet': { zh: '（未设置）', en: '(not set)' },
  'general.or': { zh: '或', en: 'or' },
};

// ============================================================
// 翻译函数
// ============================================================

/**
 * 获取翻译文本，支持模板变量替换
 * @param key 翻译键
 * @param vars 模板变量，如 { size: '120', limit: '50' }
 */
export function t(key: string, vars?: Record<string, string | number>): string {
  const entry = translations[key];
  if (!entry) return key;
  let text = entry[currentLocale] || entry['zh'] || key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }
  return text;
}
