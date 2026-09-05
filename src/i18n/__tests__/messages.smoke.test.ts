import { describe, expect, it } from "vitest";
import type { Composer } from "vue-i18n";
import { createI18nInstance } from "@/i18n/loader";
import zhCN from "@/i18n/locales/zh-CN/index";
import zhTW from "@/i18n/locales/zh-TW/index";
import enUS from "@/i18n/locales/en-US/index";

// Regression guard for the delete/visibility toast bug: composables called
// t() with keys under the WRONG namespace ("archiveCard.*" instead of
// "archive.actions.*"), so toasts rendered the raw key string. Every key
// used by useArchiveActions must resolve in every locale.
const i18n = await createI18nInstance();
const g = i18n.global as unknown as Composer;

// Pre-load all locales so the test can switch between them
g.setLocaleMessage("zh-CN", zhCN);
g.setLocaleMessage("zh-TW", zhTW);
g.setLocaleMessage("en-US", enUS);

const ACTION_KEYS: Array<[string, Record<string, unknown> | undefined]> = [
  ["archive.actions.deleteSuccess", { name: "demo", count: 1 }],
  ["archive.actions.deleteFailed", { error: "e" }],
  ["archive.actions.toggleVisibilityFailed", { error: "e" }],
  ["archive.actions.openFolderFailed", undefined],
  ["archive.actions.batchDeleteSuccess", { count: 2 }],
  ["archive.actions.batchDeleteComplete", { success: 1, failed: 1 }],
];

describe("i18n keys used by archive actions", () => {
  it("resolve in every locale instead of returning the raw key", () => {
    for (const locale of ["zh-CN", "zh-TW", "en-US"]) {
      g.locale.value = locale;
      for (const [key, params] of ACTION_KEYS) {
        const text = g.t(key, params ?? {});
        expect(text, `${locale}: ${key} returned raw key`).not.toBe(key);
        expect(text.length, `${locale}: ${key} resolved empty`).toBeGreaterThan(0);
      }
    }
  });

  it("keeps confirmModal delete dialog keys resolvable", () => {
    g.locale.value = "zh-CN";
    expect(g.t("confirmModal.deleteArchiveTitle")).not.toBe("confirmModal.deleteArchiveTitle");
  });
});
