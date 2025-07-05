// src/utils/levelConfig.js
export const levelConfig = {
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
    {
      id: "exploration",
      label: "探索度(%)",
      type: "range",
      min: 0,
      max: 100,
      step: 5,
      default: 0,
    },
    {
      id: "hasExit",
      label: "是否存在出口",
      type: "checkbox",
      default: false,
    },
    // 后续可在此添加更多字段
  ],
};
