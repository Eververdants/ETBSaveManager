/**
 * Application version configuration
 * Automatically reads version from package.json, no manual maintenance needed
 */
import packageJson from "../../package.json"; // package.json is outside src/, keep relative

export const APP_VERSION: string = packageJson.version;
