document.addEventListener("keydown", function (event) {
  // 禁用 Ctrl + S (保存)
  if (event.ctrlKey && event.key === "s") {
    event.preventDefault();
  }

  // 禁用 Ctrl + P (打印)
  if (event.ctrlKey && event.key === "p") {
    event.preventDefault();
  }

  // 禁用 Ctrl + F (查找)
  if (event.ctrlKey && event.key === "f") {
    event.preventDefault();
  }

  // 禁用 Ctrl + T (打开新标签页)
  if (event.ctrlKey && event.key === "t") {
    event.preventDefault();
  }

  // 禁用 Ctrl + W (关闭标签页)
  if (event.ctrlKey && event.key === "w") {
    event.preventDefault();
  }

  // 禁用 F5 或 Ctrl + R (刷新)
  if (event.key === "F5" || (event.ctrlKey && event.key === "r")) {
    event.preventDefault();
  }

  // 禁用 Alt + 左箭头/右箭头 (后退/前进)
  if (
    (event.altKey && event.key === "ArrowLeft") ||
    (event.altKey && event.key === "ArrowRight")
  ) {
    event.preventDefault();
  }
});

// 禁用鼠标右键菜单
document.addEventListener(
  "contextmenu",
  function (event) {
    event.preventDefault();
  },
  false
);

// 禁用鼠标中键
document.addEventListener(
  "mousedown",
  function (event) {
    if (event.button === 1) {
      event.preventDefault();
    }
  },
  false
);

// 禁用鼠标滚轮缩放
document.addEventListener(
  "wheel",
  function (event) {
    if (event.ctrlKey) {
      event.preventDefault();
    }
  },
  { passive: false }
);

// 禁用图片拖拽
document.querySelectorAll("img").forEach((img) => {
  img.addEventListener("dragstart", function (event) {
    event.preventDefault();
  });
});

// 禁用文本选择
document.addEventListener("selectstart", function (event) {
  event.preventDefault();
});

// 禁用鼠标中键点击
document.addEventListener("auxclick", function (event) {
  if (event.button === 1) {
    let target = event.target;
    while (target && target !== document.body) {
      if (
        (target.tagName.toLowerCase() === "a" && target.href) ||
        (target.hasAttribute &&
          (target.getAttribute("href") || target.getAttribute("data-url")))
      ) {
        event.preventDefault();
        break;
      }
      target = target.parentElement;
    }
  }
});
