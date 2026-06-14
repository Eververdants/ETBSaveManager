import { ref } from "vue";
import type { MenuConfig } from "../types";

// 侧边栏菜单配置（支持i18n国际化）
// 使用国际化键值，实际文本在i18n语言包中定义

interface MenuItemInput {
  id: number;
  text: string;
  icon: [string, string];
  action?: string;
  description?: string;
}

/**
 * 顶部菜单项配置
 * 用于侧边栏上半部分的菜单
 */
export const topMenuItems = ref<MenuConfig[]>([
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
]);

/**
 * 底部菜单项配置
 * 用于侧边栏下半部分的菜单
 */
export const bottomMenuItems = ref<MenuConfig[]>([
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
]);

/**
 * 获取所有菜单项
 * @returns {Object} 包含顶部和底部菜单项的对象
 */
export const getAllMenuItems = (): { top: typeof topMenuItems; bottom: typeof bottomMenuItems } => {
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
export const findMenuItemById = (id: number): MenuConfig | null => {
  const allItems: MenuConfig[] = [...topMenuItems.value, ...bottomMenuItems.value];
  return allItems.find((item: MenuConfig) => item.id === id) || null;
};

/**
 * 根据action查找菜单项
 * @param {string} action - 动作名称
 * @returns {Object|null} 找到的菜单项或null
 */
export const findMenuItemByAction = (action: string): MenuConfig | null => {
  const allItems: MenuConfig[] = [...topMenuItems.value, ...bottomMenuItems.value];
  return allItems.find((item: MenuConfig) => item.action === action) || null;
};

/**
 * 添加新的顶部菜单项
 * @param {Object} item - 菜单项配置
 */
export const addTopMenuItem = (item: MenuItemInput): boolean => {
  if (!item.id || !item.text || !item.icon) {
    console.error("菜单项必须包含id、text和icon属性");
    return false;
  }
  topMenuItems.value.push({
    id: item.id,
    textKey: item.text,
    icon: item.icon,
    action: item.action || `action_${item.id}`,
    descriptionKey: item.description || "",
    route: "",
  });
  return true;
};

/**
 * 添加新的底部菜单项
 * @param {Object} item - 菜单项配置
 */
export const addBottomMenuItem = (item: MenuItemInput): boolean => {
  if (!item.id || !item.text || !item.icon) {
    console.error("菜单项必须包含id、text和icon属性");
    return false;
  }
  bottomMenuItems.value.push({
    id: item.id,
    textKey: item.text,
    icon: item.icon,
    action: item.action || `action_${item.id}`,
    descriptionKey: item.description || "",
    route: "",
  });
  return true;
};

/**
 * 更新菜单项
 * @param {number} id - 菜单项ID
 * @param {Object} updates - 要更新的属性
 */
export const updateMenuItem = (id: number, updates: Partial<MenuConfig>): boolean => {
  const item: MenuConfig | null = findMenuItemById(id);
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
export const removeMenuItem = (id: number): boolean => {
  const topIndex: number = topMenuItems.value.findIndex((item: MenuConfig) => item.id === id);
  if (topIndex !== -1) {
    topMenuItems.value.splice(topIndex, 1);
    return true;
  }

  const bottomIndex: number = bottomMenuItems.value.findIndex((item: MenuConfig) => item.id === id);
  if (bottomIndex !== -1) {
    bottomMenuItems.value.splice(bottomIndex, 1);
    return true;
  }

  return false;
};
