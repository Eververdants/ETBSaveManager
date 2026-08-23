/**
 * 禁用所有快捷键、文字选中和图片拖拽
 * 只保留左键基本操作
 */

export function disableInteractions(): void {
  // 键盘快捷键：应用内快捷键已开放（如 Ctrl+Z 撤销、Tab 导航等）。
  // 仅仍拦截两件事：WebView2 原生的查找转发到应用内搜索，以及打开开发者工具的快捷键。
  document.addEventListener(
    "keydown",
    (e: KeyboardEvent) => {
      const normalizedKey = String(e.key || "").toLowerCase();
      const isFindShortcut = (e.ctrlKey || e.metaKey) && normalizedKey === "f";

      // 拦截 WebView2 原生查找，转发到应用内搜索逻辑
      if (isFindShortcut) {
        e.preventDefault();
        e.stopPropagation();
        window.dispatchEvent(
          new CustomEvent("app-global-find", {
            detail: { from: "disableInteractions", shiftKey: !!e.shiftKey },
          }),
        );
        return false;
      }

      // 模拟原生查找下一项/上一项（F3 / Shift+F3）
      if (e.key === "F3") {
        e.preventDefault();
        e.stopPropagation();
        window.dispatchEvent(
          new CustomEvent("app-global-find-next", {
            detail: { from: "disableInteractions", backward: !!e.shiftKey },
          }),
        );
        return false;
      }

      // 始终禁止打开开发者工具的快捷键
      const isDevtoolsShortcut =
        e.key === "F12" ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && ["KeyI", "KeyJ", "KeyC"].includes(e.code)) ||
        ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.code === "KeyU");

      if (isDevtoolsShortcut) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // 其余按键与快捷键一律放行（包括输入框内外的所有组合键）。
      return;
    },
    true,
  );

  // 禁用文字选中（但允许在输入框中选择）
  document.addEventListener(
    "selectstart",
    (e: Event) => {
      const target = e.target as HTMLElement;
      const isInputElement =
        target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.contentEditable === "true";

      if (!isInputElement) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    },
    true,
  );

  // 禁用拖拽
  document.addEventListener(
    "dragstart",
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    },
    true,
  );

  // 禁用图片拖拽
  document.addEventListener(
    "mousedown",
    (e: MouseEvent) => {
      if ((e.target as HTMLElement).tagName === "IMG") {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    },
    true,
  );

  // 禁用右键菜单
  document.addEventListener(
    "contextmenu",
    (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    },
    true,
  );

  // 禁用双击选中文本（但允许在输入框中双击）
  document.addEventListener(
    "dblclick",
    (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isInputElement =
        target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.contentEditable === "true";

      if (!isInputElement) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    },
    true,
  );

  // 禁用鼠标中键和右键
  document.addEventListener(
    "mousedown",
    (e: MouseEvent) => {
      // 只允许左键（button === 0）
      if (e.button !== 0) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    },
    true,
  );

  // 禁用复制、剪切、粘贴（但允许在输入框中使用）
  document.addEventListener(
    "copy",
    (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputElement =
        target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.contentEditable === "true";

      if (!isInputElement) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    },
    true,
  );

  document.addEventListener(
    "cut",
    (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputElement =
        target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.contentEditable === "true";

      if (!isInputElement) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    },
    true,
  );

  document.addEventListener(
    "paste",
    (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputElement =
        target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.contentEditable === "true";

      if (!isInputElement) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    },
    true,
  );

  // 禁用选择文本的CSS样式
  const style = document.createElement("style");
  style.textContent = `
    * {
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
      user-select: none !important;
      -webkit-touch-callout: none !important;
      -webkit-tap-highlight-color: transparent !important;
    }

    img {
      -webkit-user-drag: none !important;
      -khtml-user-drag: none !important;
      -moz-user-drag: none !important;
      -o-user-drag: none !important;
      user-drag: none !important;
      pointer-events: none !important;
    }

    input, textarea {
      -webkit-user-select: text !important;
      -moz-user-select: text !important;
      -ms-user-select: text !important;
      user-select: text !important;
    }
  `;
  document.head.appendChild(style);

  console.info("所有快捷键、文字选中和图片拖拽已禁用，仅保留左键操作");
}

/**
 * 恢复所有交互
 */
export function enableInteractions(): void {
  console.info("交互已恢复");
}
