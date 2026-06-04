// 命令 flags 类型 — 从 flags.ts 重新导出，保持向后兼容
// 所有 flags 接口的权威定义在 flags.ts 中
export type {
  GlobalFlags,
  ChatFlags,
  ReplFlags,
  VisionFlags,
  ASRFlags,
  TTSSynthesizeFlags,
  TTSCloneFlags,
  TTSDesignFlags,
  TTSVoicesFlags,
} from './flags';
