export interface GlobalFlags {
  apiKey?: string;
  baseUrl?: string;
  output?: 'text' | 'json';
  timeout?: number;
  quiet?: boolean;
  verbose?: boolean;
  noColor?: boolean;
  dryRun?: boolean;
  nonInteractive?: boolean;
  help?: boolean;
  version?: boolean;
  [key: string]: unknown;
}

export interface ChatFlags {
  message?: string;
  model?: string;
  system?: string;
  thinking?: boolean;
  search?: boolean;
  forceSearch?: boolean;
  maxKeyword?: number;       // 一轮搜索最大关键词数量
  searchLimit?: number;      // 搜索结果数量限制
  userCountry?: string;      // 用户位置：国家
  userRegion?: string;       // 用户位置：地区
  userCity?: string;         // 用户位置：城市
  stream?: boolean;
  noStream?: boolean;
  json?: boolean;
  maxTokens?: number;
  temperature?: number;
}

export interface ReplFlags {
  model?: string;
  thinking?: boolean;
  search?: boolean;
  system?: string;
}

export interface VisionFlags {
  image?: string;
  audio?: string;
  video?: string;
  prompt?: string;
  model?: string;
  fps?: number;
  mediaResolution?: 'default' | 'max';
}

export interface ASRFlags {
  language?: 'auto' | 'zh' | 'en';
  stream?: boolean;
  file?: string;
}

export interface TTSSynthesizeFlags {
  text?: string;
  voice?: string;
  style?: string;
  format?: 'wav' | 'mp3' | 'pcm';
  out?: string;
}

export interface TTSCloneFlags {
  sample?: string;
  text?: string;
  format?: 'wav' | 'mp3' | 'pcm';
  out?: string;
}

export interface TTSDesignFlags {
  prompt?: string;
  text?: string;
  optimizeText?: boolean;
  format?: 'wav' | 'mp3' | 'pcm';
  out?: string;
}

export interface TTSVoicesFlags {
  // tts voices 命令无特有 flags，仅继承 GlobalFlags
}
