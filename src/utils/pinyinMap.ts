/**
 * 物品中文名的拼音映射 —— 轻量、零依赖
 *
 * 用于模糊搜索时支持拼音输入：
 *   - 用户输入 "xingrenshui"  → 匹配到 "杏仁水"
 *   - 用户输入 "sdt"          → 匹配到 "手电筒"
 *   - 用户输入 "dian"         → Dice 匹配到 "电锯" / "手电筒" 等
 *
 * 格式：[全拼, 首字母缩写?]
 * 全拼不带声调，ü 用 lv 表示（通用数字输入习惯）
 */
const PINYIN_MAP: Record<string, [full: string, initials?: string]> = {
  AlmondConcentrate: ["xingrennongsuoye", "xrnsy"],
  BugSpray: ["shachongji", "scj"],
  Camera: ["xiangji", "xj"],
  AlmondWater: ["xingrenshui", "xrs"],
  Chainsaw: ["dianju", "dj"],
  Crowbar: ["qiaogun", "qg"],
  DivingHelmet: ["qianshuitoukui", "qstk"],
  EnergyBar: ["nengliangbang", "nlb"],
  Firework: ["yanhua", "yh"],
  Flaregun: ["xinhaoqiang", "xhq"],
  Flashlight: ["shoudiantong", "sdt"],
  GlowstickBlue: ["lanseyingguangbang", "lsygb"],
  GlowStick: ["lvseyingguangbang", "lsygb"],
  GlowstickRed: ["hongseyingguangbang", "hsygb"],
  GlowstickYellow: ["huangseyingguangbang", "hsygb"],
  Knife: ["daoju", "dj"],
  LiquidPain: ["yetitongku", "yttk"],
  Juice: ["guozhi", "gz"],
  Rope: ["shengsuo", "ss"],
  LiDAR: ["saomiaoyi", "smy"],
  Thermometer: ["wenduji", "wdj"],
  Ticket: ["piao", "p"],
  Toy: ["taidixiong", "tdx"],
  WalkieTalkie: ["duijiangji", "djj"],
  MothJelly: ["feieguodong", "fegd"],
};

/**
 * 返回物品 ID 对应的拼音文本列表（全拼、首字母缩写）
 */
export function getPinyinTexts(itemId: string): string[] {
  const entry = PINYIN_MAP[itemId];
  if (!entry) return [];
  return entry[1] ? [entry[0], entry[1]] : [entry[0]];
}
