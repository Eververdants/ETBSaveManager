import pluginVue from "eslint-plugin-vue";
import js from "@eslint/js";
import globals from "globals";
import eslintConfigPrettier from "eslint-config-prettier";

export default [
  // 忽略目录
  {
    ignores: ["dist/", "node_modules/", "src-tauri/"],
  },

  // JS 推荐规则
  js.configs.recommended,

  // Vue 推荐规则 (flat config)
  ...pluginVue.configs["flat/recommended"],

  // 自定义规则
  {
    files: ["src/**/*.{ts,vue}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      // Vue 组件名允许多单词（关闭强制多单词规则）
      "vue/multi-word-component-names": "off",

      // 允许 v-html 但警告
      "vue/no-v-html": "warn",

      // console 保留 warn/error，其他警告
      "no-console": ["warn", { allow: ["warn", "error", "info"] }],

      // debugger 警告
      "no-debugger": "warn",

      // 不必要的三元表达式
      "no-unneeded-ternary": "warn",

      // 优先使用 === 和 !==
      "eqeqeq": ["warn", "always"],

      // 已定义但未使用的变量（不检查函数参数）
      "no-unused-vars": "off",

      // 禁止 var
      "no-var": "error",

      // Vue template 中属性顺序
      "vue/attributes-order": [
        "warn",
        {
          order: [
            "DEFINITION",
            "LIST_RENDERING",
            "CONDITIONALS",
            "RENDER_MODIFIERS",
            "GLOBAL",
            "UNIQUE",
            "TWO_WAY_BINDING",
            "OTHER_DIRECTIVES",
            "OTHER_ATTR",
            "EVENTS",
            "CONTENT",
          ],
          alphabetical: false,
        },
      ],

      // Vue 组件属性每行最大数量
      "vue/max-attributes-per-line": [
        "warn",
        {
          singleline: { max: 4 },
          multiline: { max: 1 },
        },
      ],

      // Vue 模板中的空格
      "vue/html-indent": ["warn", 2],
    },
  },

  // 测试文件宽松规则
  {
    files: ["src/**/*.test.ts", "src/**/*.spec.ts", "src/**/__tests__/**"],
    rules: {
      "no-console": "off",
      "no-unused-vars": "off",
    },
  },

  // Prettier 兼容 (必须最后)
  eslintConfigPrettier,
];
