// 侧边栏菜单配置（支持i18n国际化）
// 使用国际化键值，实际文本在i18n语言包中定义

/**
 * 顶部菜单项配置
 * 用于侧边栏上半部分的菜单
 */
export const topMenuItems = [
  {
    id: 1,
    textKey: "sidebar.archiveList", // i18n键值
    icon: ["fas", "list"],
    action: "openArchiveList",
    descriptionKey: "archive.listDescription",
    route: "Home",
  },
  {
    id: 2,
    textKey: "sidebar.createArchive",
    icon: ["fas", "plus-circle"],
    action: "createNewArchive",
    descriptionKey: "archive.createDescription",
    route: "CreateArchive",
  },
  // 核心存档功能暂时隐藏
  // {
  //   id: 3,
  //   textKey: "sidebar.coreArchive",
  //   icon: ["fas", "database"],
  //   action: "openCoreArchive",
  //   descriptionKey: "archive.coreDescription",
  //   route: "CoreArchive",
  // },
  {
    id: 4,
    textKey: "sidebar.pluginMarket",
    icon: ["fas", "store"],
    action: "openPluginMarket",
    descriptionKey: "plugin.marketDescription",
    route: "PluginMarket",
  },
];

/**
 * 底部菜单项配置
 * 用于侧边栏下半部分的菜单
 */
export const bottomMenuItems = [
  {
    id: 7,
    textKey: "sidebar.feedback",
    icon: ["fas", "comment-dots"],
    action: "openFeedback",
    descriptionKey: "feedback.sidebarDescription",
    route: "Feedback",
  },
  {
    id: 5,
    textKey: "sidebar.about",
    icon: ["fas", "info-circle"],
    action: "showAbout",
    descriptionKey: "about.description",
    route: "About",
  },
  {
    id: 6,
    textKey: "sidebar.settings",
    icon: ["fas", "cog"],
    action: "openSettings",
    descriptionKey: "settings.description",
    route: "Settings",
  },
];

/**
 * 获取所有菜单项
 * @returns {Object} 包含顶部和底部菜单项的对象
 */
export const getAllMenuItems = () => {
  return {
    top: topMenuItems,
    bottom: bottomMenuItems,
  };
};

/**
 * 根据ID查找菜单项
 * @param {number} id - 菜单项ID
 * @returns {Object|null} 找到的菜单项或null
 */
export const findMenuItemById = (id) => {
  const allItems = [...topMenuItems, ...bottomMenuItems];
  return allItems.find((item) => item.id === id) || null;
};

/**
 * 根据action查找菜单项
 * @param {string} action - 动作名称
 * @returns {Object|null} 找到的菜单项或null
 */
export const findMenuItemByAction = (action) => {
  const allItems = [...topMenuItems, ...bottomMenuItems];
  return allItems.find((item) => item.action === action) || null;
};

/**
 * 添加新的顶部菜单项
 * @param {Object} item - 菜单项配置
 */
export const addTopMenuItem = (item) => {
  if (!item.id || !item.text || !item.icon) {
    console.error("菜单项必须包含id、text和icon属性");
    return false;
  }
  topMenuItems.push({
    id: item.id,
    text: item.text,
    icon: item.icon,
    action: item.action || `action_${item.id}`,
    description: item.description || "",
  });
  return true;
};

/**
 * 添加新的底部菜单项
 * @param {Object} item - 菜单项配置
 */
export const addBottomMenuItem = (item) => {
  if (!item.id || !item.text || !item.icon) {
    console.error("菜单项必须包含id、text和icon属性");
    return false;
  }
  bottomMenuItems.push({
    id: item.id,
    text: item.text,
    icon: item.icon,
    action: item.action || `action_${item.id}`,
    description: item.description || "",
  });
  return true;
};

/**
 * 更新菜单项
 * @param {number} id - 菜单项ID
 * @param {Object} updates - 要更新的属性
 */
export const updateMenuItem = (id, updates) => {
  const item = findMenuItemById(id);
  if (item) {
    Object.assign(item, updates);
    return true;
  }
  return false;
};

/**
 * 删除菜单项
 * @param {number} id - 菜单项ID
 */
export const removeMenuItem = (id) => {
  const topIndex = topMenuItems.findIndex((item) => item.id === id);
  if (topIndex !== -1) {
    topMenuItems.splice(topIndex, 1);
    return true;
  }

  const bottomIndex = bottomMenuItems.findIndex((item) => item.id === id);
  if (bottomIndex !== -1) {
    bottomMenuItems.splice(bottomIndex, 1);
    return true;
  }

  return false;
};
