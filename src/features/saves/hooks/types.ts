/**
 * 存档动作相关共享类型
 * 单独成文件，避免 useArchiveVisibility / useArchiveDelete / useArchiveActions 循环依赖。
 */
export interface ArchiveActionCallbacks {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
  onRefresh?: () => Promise<void>;
}

export interface BatchDeleteCallbacks extends ArchiveActionCallbacks {
  onProgress?: (current: number, total: number, archiveName: string) => void;
}

export interface DeleteResults {
  success: number[];
  failed: Array<{ id: number; error: unknown }>;
}
