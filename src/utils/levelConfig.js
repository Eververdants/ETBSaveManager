export const levelConfig = {
  levelMeta: {
    "level-0": {
      name: "Level 0 - 教学关卡",
      subtitle: "这是 Level 0 的小标题",
      fields: [
        {
          id: "entityCount",
          label: "梯子数量",
          type: "number",
          min: 0,
          max: 4,
          default: 0,
        },
        {
          id: "safetyLevel",
          label: "安全等级",
          type: "radio",
          options: [
            { value: "安全", label: "安全" },
            { value: "中等", label: "中等" },
            { value: "危险", label: "危险" },
            { value: "致命", label: "致命" },
          ],
          default: "安全",
        },
      ],
    },

    "level-1": {
      name: "Level 1 - 起始之地",
      subtitle: "这是 Level 1 的小标题",
      fields: [
        {
          id: "enemyCount",
          label: "敌人数量",
          type: "number",
          min: 0,
          max: 10,
          default: 3,
        },
        {
          id: "weather",
          label: "天气类型",
          type: "radio",
          options: [
            { value: "晴天", label: "晴天" },
            { value: "雨天", label: "雨天" },
            { value: "雾天", label: "雾天" },
          ],
          default: "晴天",
        },
      ],
    },
    // 其他层级类似...
  },
};
