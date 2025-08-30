/**
 * 更新配置
 * 允许用户选择更新源（Gitee 或 GitHub）
 */

export const UPDATE_SOURCES = {
  GITEE: {
    name: 'Gitee',
    description: '国内访问更稳定，推荐中国地区用户使用',
    apiUrl: 'https://gitee.com/api/v5/repos/Eververdants/ETBSaveManager/releases',
    releasesUrl: 'https://gitee.com/Eververdants/ETBSaveManager/releases',
    enabled: true
  },
  GITHUB: {
    name: 'GitHub',
    description: '官方源，全球访问，推荐非中国地区用户使用',
    apiUrl: 'https://api.github.com/repos/Eververdants/ETBSaveManager/releases',
    releasesUrl: 'https://github.com/Eververdants/ETBSaveManager/releases',
    enabled: true
  }
};

// 根据用户地区自动选择默认更新源
function getDefaultUpdateSourceByRegion() {
  try {
    // 获取浏览器语言
    const userLanguage = navigator.language || navigator.userLanguage || '';
    
    // 中国地区语言代码
    const chinaLanguages = ['zh-CN', 'zh-HK', 'zh-MO', 'zh-SG', 'zh-TW', 'zh'];
    
    // 检查是否为中国地区
    const isChinaRegion = chinaLanguages.some(lang => 
      userLanguage.toLowerCase().startsWith(lang.toLowerCase())
    );
    
    return isChinaRegion ? 'GITEE' : 'GITHUB';
  } catch (error) {
    // 如果获取语言失败，默认使用GITEE
    console.warn('无法检测用户地区，使用默认更新源 GITHUB');
    return 'GITHUB';
  }
}

export const DEFAULT_UPDATE_SOURCE = getDefaultUpdateSourceByRegion();

/**
 * 获取用户选择的更新源
 * @returns {string} 更新源标识
 */
export function getUserUpdateSource() {
  const savedSource = localStorage.getItem('updateSource');
  
  // 如果用户手动设置过，优先使用用户设置
  if (savedSource && UPDATE_SOURCES[savedSource]) {
    return savedSource;
  }
  
  // 否则使用地区自动检测
  return DEFAULT_UPDATE_SOURCE;
}

/**
 * 设置用户选择的更新源
 * @param {string} source - 更新源标识 ('GITEE' 或 'GITHUB')
 */
export function setUserUpdateSource(source) {
  if (UPDATE_SOURCES[source]) {
    localStorage.setItem('updateSource', source);
    return true;
  }
  return false;
}

/**
 * 获取当前更新源的详细信息
 * @returns {Object} 更新源配置
 */
export function getCurrentUpdateSource() {
  const sourceKey = getUserUpdateSource();
  return UPDATE_SOURCES[sourceKey] || UPDATE_SOURCES[DEFAULT_UPDATE_SOURCE];
}

/**
 * 获取所有可用的更新源
 * @returns {Object} 所有更新源
 */
export function getAllUpdateSources() {
  return UPDATE_SOURCES;
}