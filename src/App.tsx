/**
 * 主应用组件
 * 路由配置在此处
 */
import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { AppShell } from "./layouts";
import { PagePlaceholder } from "./components";
import { useAppStore } from "./stores";

function App() {
  const theme = useAppStore((s) => s.theme);

  // 应用主题（light / dark / system）
  useEffect(() => {
    const root = document.documentElement;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark =
        theme === "dark" || (theme === "system" && mq.matches);
      root.classList.toggle("dark", dark);
    };
    apply();
    if (theme !== "system") return;
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [theme]);

  // 占位页面：后续按 features/{feature} 拆分实现
  const page = (labelKey: string) => <PagePlaceholder labelKey={labelKey} />;

  return (
    <Routes>
      {/* 布局路由：所有页面渲染在 AppShell 的内容区（Outlet）内 */}
      <Route element={<AppShell />}>
        <Route path="/" element={page("home")} />

        {/* 存档 */}
        <Route path="/saves/all" element={page("saves-all")} />
        <Route path="/saves/favorites" element={page("saves-favorites")} />
        <Route path="/saves/trash" element={page("saves-trash")} />
        <Route path="/saves/create" element={page("saves-create")} />

        {/* 游戏 */}
        <Route path="/games/overview" element={page("games-overview")} />
        <Route path="/games/edit" element={page("games-edit")} />

        {/* 模组 */}
        <Route path="/mods/installed" element={page("mods-installed")} />
        <Route path="/mods/browse" element={page("mods-browse")} />
        <Route path="/mods/updates" element={page("mods-updates")} />

        {/* 修改 */}
        <Route path="/tools/game-data" element={page("tools-game-data")} />
        <Route path="/tools/realtime" element={page("tools-realtime")} />
        <Route path="/tools/more" element={page("tools-more")} />

        <Route path="/login" element={page("login")} />
        <Route path="/settings" element={page("settings")} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
