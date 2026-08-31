/**
 * 编辑存档页内部类型
 */
export interface EditPlayer {
  /** 显示/编辑用的纯 steam id（在线玩家已剥离 UE 后缀） */
  steamId: string;
  /** 存档原始完整键（可能带 steamId_+_|EOS 后缀；离线为 id-后缀） */
  originalSteamId: string;
  /** 12 格物品（名称），空槽 null */
  inventory: (string | null)[];
  username: string | null;
  isOfflinePlayer: boolean;
  sanity: number;
}
