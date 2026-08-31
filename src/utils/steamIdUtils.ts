/**
 * Steam ID 工具
 *
 * 存档里 UE 的 UniqueNetId 带后缀：`<17位steamid>_+_|<32hex>`
 * - 32hex = `0002`（2 字节版本/格式标记）+ 14 字节随机部分
 * - 由游戏按 steam 账号生成一次并持久化，跟随玩家不跟随机器，**应用无法推导**
 * - 界面显示/用户输入时：只用纯 steam id（17 位数字）
 * - 写回存档时：必须复用存档里已有的完整键，不能合成后缀
 * - 离线玩家（`<id>-<15字符>`）不带 `_+_|` 后缀，原样处理
 */

/** 剥离 UE 后缀，返回纯 steam id（17 位数字）
 * 离线玩家 id / 无后缀的 id 原样返回
 */
export function stripSteamIdSuffix(id: string): string {
  const idx = id.indexOf("_+_|");
  return idx > 0 ? id.slice(0, idx) : id;
}
