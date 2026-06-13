/**
 * Application version configuration
 * Automatically reads version from package.json, no manual maintenance needed
 */
import packageJson from "../../package.json";

export const APP_VERSION = packageJson.version;
