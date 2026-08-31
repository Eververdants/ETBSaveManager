/**
 * 主题 API — Rust 端主题配置存取
 */
import { tauriInvoke } from "./index";

export const themeApi = {
  async getThemeConfig(): Promise<{ activeThemeId: string | null }> {
    return tauriInvoke<{ activeThemeId: string | null }>("get_theme_config");
  },

  async setActiveTheme(themeId: string): Promise<void> {
    return tauriInvoke<void>("set_active_theme", { themeId });
  },
};
