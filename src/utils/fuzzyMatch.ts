/**
 * 轻量模糊匹配工具 —— Dice 系数（二元组相似度）
 *
 * 不需要任何外部依赖，纯字符串算法，<1ms 完成 25 个物品的匹配。
 * 用于在物品选择器搜索无精确结果时，自动匹配最相似的物品。
 */

/**
 * 生成字符串的所有二元组 (bigrams)
 */
function bigrams(str: string): Set<string> {
  const result = new Set<string>();
  for (let i = 0; i < str.length - 1; i++) {
    result.add(str.substring(i, i + 2));
  }
  return result;
}

/**
 * 计算两个字符串的 Dice 系数
 * 返回值范围 [0, 1]，越高表示越相似
 */
export function diceCoefficient(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) {
    // 短字符串用字符交集近似
    const setA = new Set(a.toLowerCase());
    const setB = new Set(b.toLowerCase());
    const intersection = new Set([...setA].filter((c) => setB.has(c)));
    return intersection.size === 0 ? 0 : (2 * intersection.size) / (setA.size + setB.size);
  }

  const bigramsA = bigrams(a.toLowerCase());
  const bigramsB = bigrams(b.toLowerCase());

  let intersection = 0;
  for (const bg of bigramsA) {
    if (bigramsB.has(bg)) intersection++;
  }

  return (2 * intersection) / (bigramsA.size + bigramsB.size);
}

export interface FuzzyMatchResult<T> {
  item: T;
  score: number;
  matchedOn: string;
}

/**
 * 对一组数据进行模糊搜索
 *
 * @param queries  用户输入的搜索词（单个字符串或数组，传数组时会取各查询词的最高得分）
 * @param items    待匹配的数据列表
 * @param getTexts 从每个 item 提取用于匹配的文本数组（如 [id, 中文名, 英文名, 拼音]）
 * @param threshold  最低匹配阈值（默认 0.3）
 * @param maxResults 最多返回结果数（默认 5）
 */
export function fuzzySearch<T>(
  queries: string | string[],
  items: T[],
  getTexts: (item: T) => string[],
  threshold = 0.3,
  maxResults = 5,
): FuzzyMatchResult<T>[] {
  const queryList = (Array.isArray(queries) ? queries : [queries]).map((q) => q.trim().toLowerCase()).filter(Boolean);
  if (queryList.length === 0 || items.length === 0) return [];

  const scored: FuzzyMatchResult<T>[] = [];

  for (const item of items) {
    const texts = getTexts(item);
    let bestScore = 0;
    let bestMatch = "";

    for (const keyword of queryList) {
      for (const text of texts) {
        if (!text) continue;
        const normalizedText = text.toLowerCase();

        // 子串包含 → 加分，因为这通常意味着精准匹配了部分名称
        if (normalizedText.includes(keyword)) {
          const score = 0.9 + (keyword.length / normalizedText.length) * 0.09;
          if (score > bestScore) {
            bestScore = score;
            bestMatch = text;
          }
          continue;
        }

        // Dice 系数模糊匹配
        const score = diceCoefficient(keyword, normalizedText);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = text;
        }
      }
    }

    if (bestScore >= threshold) {
      scored.push({ item, score: bestScore, matchedOn: bestMatch });
    }
  }

  return scored.sort((a, b) => b.score - a.score).slice(0, maxResults);
}
