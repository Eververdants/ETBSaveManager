/**
 * 应用版本配置
 * 从 package.json 自动读取版本号，无需手动维护
 */
import packageJson from '../../package.json';

export const APP_VERSION = packageJson.version;
