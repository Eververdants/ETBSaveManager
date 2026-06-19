import { i18nReady } from "@/i18n";
import "@/styles/global.css";
import { App } from "@/app";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// 必须 await i18nReady 再 render：
// 1. i18n 资源与 LanguageDetector 都是异步注入；
// 2. 直接 render 会让首屏 t() 返回键名（"hero.ctaDownload" 等），用户看到未翻译的 fallback。
// 3. init 失败时显式抛错,避免静默退化为英文之外的混乱语言。
void i18nReady
  .then(() => {
    const container = document.getElementById("root");
    if (!container) {
      throw new Error("Root container #root not found");
    }
    createRoot(container).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  })
  .catch((error: unknown) => {
    console.error("[i18n] init failed:", error);
    throw error;
  });
