/**
 * 编辑存档数据 Store — 跨页面传参（Home → EditArchive）
 *
 * 路由只带 name，完整 ArchiveData JSON 通过此 store 传递，
 * 避免把大对象塞进路由参数。
 */
import { create } from "zustand";

interface EditArchiveState {
  /** 当前待编辑的 ArchiveData JSON（null 表示无数据） */
  payload: string | null;
  setPayload: (payload: string) => void;
  clearPayload: () => void;
}

export const useEditArchiveStore = create<EditArchiveState>()((set) => ({
  payload: null,
  setPayload: (payload) => set({ payload }),
  clearPayload: () => set({ payload: null }),
}));
