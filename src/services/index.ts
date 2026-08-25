/**
 * 服务层
 * 所有外部交互（Tauri invoke、HTTP API）都应在此层封装
 * 组件不应直接调用外部 API，而是通过服务层
 */

// Tauri API 服务示例
export const tauriService = {
  // 后续添加具体的 Tauri invoke 调用
  // async readFile(path: string): Promise<Uint8Array> {
  //   return invoke('read_file', { path });
  // },
};

// HTTP API 服务示例（如需后端）
export const apiService = {
  // 后续添加具体的 HTTP 请求
  // async fetchSaves(): Promise<SaveFile[]> {
  //   return fetch('/api/saves').then(r => r.json());
  // },
};
