import type { Router } from "vue-router";
import type { Composer } from "vue-i18n";

interface AppContext {
  i18n: Composer | null;
  router: Router | null;
  vue: typeof import("vue") | null;
  storage: {
    getItem: <T = unknown>(key: string, defaultValue?: T | null) => T | null;
    setItem: (key: string, value: unknown) => void;
    removeItem: (key: string) => void;
    clear: () => void;
    keys: () => string[];
  } | null;
}

let _ctx: AppContext = {
  i18n: null,
  router: null,
  vue: null,
  storage: null,
};

export function setAppContext(partial: Partial<AppContext>): void {
  _ctx = { ..._ctx, ...partial };
}

export function getAppContext(): AppContext {
  return _ctx;
}
