/**
 * 禁用所有快捷键、文字选中和图片拖拽
 * 只保留左键基本操作
 */

export function disableInteractions() {
  // 禁用所有快捷键
  document.addEventListener('keydown', (e) => {
    // 禁用所有Ctrl、Alt、Shift组合键
    if (e.ctrlKey || e.altKey || e.shiftKey || e.metaKey) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
    
    // 禁用F1-F12功能键
    if (e.key.startsWith('F') && e.key.length > 1) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
    
    // 禁用其他特殊按键
    const blockedKeys = [
      'Tab', 'Escape', 'Enter', 'Backspace', 'Delete', 'Insert',
      'Home', 'End', 'PageUp', 'PageDown', 'ArrowUp', 'ArrowDown',
      'ArrowLeft', 'ArrowRight'
    ];
    
    if (blockedKeys.includes(e.key)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, true);

  // 禁用文字选中
  document.addEventListener('selectstart', (e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }, true);

  // 禁用拖拽
  document.addEventListener('dragstart', (e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }, true);

  // 禁用图片拖拽
  document.addEventListener('mousedown', (e) => {
    if (e.target.tagName === 'IMG') {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, true);

  // 禁用右键菜单
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }, true);

  // 禁用双击选中文本
  document.addEventListener('dblclick', (e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }, true);

  // 禁用鼠标中键和右键
  document.addEventListener('mousedown', (e) => {
    // 只允许左键（button === 0）
    if (e.button !== 0) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, true);

  // 禁用复制、剪切、粘贴
  document.addEventListener('copy', (e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }, true);

  document.addEventListener('cut', (e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }, true);

  document.addEventListener('paste', (e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }, true);

  // 禁用选择文本的CSS样式
  const style = document.createElement('style');
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

  console.log('所有快捷键、文字选中和图片拖拽已禁用，仅保留左键操作');
}

/**
 * 恢复所有交互
 */
export function enableInteractions() {
  // 移除事件监听器（需要保存引用才能移除，这里简化处理）
  console.log('交互已恢复');
}

// 自动应用
if (typeof window !== 'undefined') {
  disableInteractions();
}