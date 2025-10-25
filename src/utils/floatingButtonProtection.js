/**
 * 浮动按钮全局保护工具
 * 确保浮动按钮在任何情况下都保持在正确的位置
 */

/**
 * 强制重置浮动按钮位置
 * @param {HTMLElement} floatingButton - 浮动按钮元素
 */
export const forceResetFloatingButtonPosition = (floatingButton) => {
  if (!floatingButton) return;
  
  // 使用最高优先级设置样式
  floatingButton.style.setProperty('position', 'fixed', 'important');
  floatingButton.style.setProperty('bottom', '30px', 'important');
  floatingButton.style.setProperty('right', '30px', 'important');
  floatingButton.style.setProperty('top', 'auto', 'important');
  floatingButton.style.setProperty('left', 'auto', 'important');
  floatingButton.style.setProperty('transform', 'none', 'important');
  floatingButton.style.setProperty('margin', '0', 'important');
  floatingButton.style.setProperty('padding', '0', 'important');
  floatingButton.style.setProperty('z-index', '10000', 'important');
};

/**
 * 保护浮动按钮位置
 * 在可能影响定位的操作后调用
 */
export const protectFloatingButtonPosition = () => {
  const floatingButton = document.querySelector('.floating-action-container');
  if (!floatingButton) return;
  
  // 立即重置位置
  forceResetFloatingButtonPosition(floatingButton);
  
  // 使用requestAnimationFrame确保在下一帧重置
  requestAnimationFrame(() => {
    forceResetFloatingButtonPosition(floatingButton);
  });
  
  // 多重延迟检查，确保在所有布局变化后位置仍然正确
  setTimeout(() => forceResetFloatingButtonPosition(floatingButton), 50);
  setTimeout(() => forceResetFloatingButtonPosition(floatingButton), 100);
  setTimeout(() => forceResetFloatingButtonPosition(floatingButton), 200);
  setTimeout(() => forceResetFloatingButtonPosition(floatingButton), 500);
  setTimeout(() => forceResetFloatingButtonPosition(floatingButton), 1000);
};

/**
 * 安全修改body样式，不影响浮动按钮定位
 * @param {Object} styles - 要应用的样式
 * @param {Function} callback - 样式应用后的回调
 */
export const safeModifyBodyStyles = (styles, callback) => {
  // 保存浮动按钮的原始样式
  const floatingButton = document.querySelector('.floating-action-container');
  let originalFabStyles = null;
  
  if (floatingButton) {
    originalFabStyles = {
      position: floatingButton.style.position,
      bottom: floatingButton.style.bottom,
      right: floatingButton.style.right,
      top: floatingButton.style.top,
      left: floatingButton.style.left,
      transform: floatingButton.style.transform
    };
  }
  
  // 应用body样式
  Object.keys(styles).forEach(property => {
    document.body.style[property] = styles[property];
  });
  
  // 立即重置浮动按钮位置
  if (floatingButton) {
    forceResetFloatingButtonPosition(floatingButton);
  }
  
  // 执行回调
  if (callback) callback();
  
  // 返回恢复函数
  return () => {
    // 恢复body样式
    Object.keys(styles).forEach(property => {
      document.body.style[property] = '';
    });
    
    // 确保浮动按钮在body样式恢复后仍然保持正确位置
    if (floatingButton) {
      setTimeout(() => forceResetFloatingButtonPosition(floatingButton), 50);
      setTimeout(() => forceResetFloatingButtonPosition(floatingButton), 200);
    }
  };
};

/**
 * 初始化全局浮动按钮保护
 */
export const initGlobalFloatingButtonProtection = () => {
  // 定期检查并修复浮动按钮位置
  setInterval(protectFloatingButtonPosition, 2000);
  
  // 监听可能影响定位的事件
  const eventsThatMayAffectPosition = ['resize', 'scroll', 'orientationchange'];
  
  eventsThatMayAffectPosition.forEach(event => {
    window.addEventListener(event, () => {
      protectFloatingButtonPosition();
    }, { passive: true });
  });
  
  // 初始保护
  protectFloatingButtonPosition();
};