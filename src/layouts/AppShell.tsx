/**
 * 应用外壳布局：标题栏 + 侧边栏 + 内容区
 */
import { Outlet } from "react-router-dom";

import { useAppStore } from "../stores";
import { TitleBar, Sidebar } from "./components";

export default function AppShell() {
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);

  return (
    <div
      className="flex h-screen w-screen flex-col overflow-hidden"
      style={{ backgroundColor: "var(--color-shell-bg)" }}
    >
      <TitleBar onToggleSidebar={toggleSidebar} />

      <div className="flex min-h-0 flex-1">
        <Sidebar />

        <main
          className="min-w-0 flex-1 overflow-y-auto rounded-t-lg rounded-l-lg"
          style={{
            backgroundColor: "var(--color-bg-primary)",
            color: "var(--color-text-primary)",
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
