/**
 * ThemeValidator Service
 *
 * Provides validation for theme colors and structures.
 * Implements color format validation (hex, rgb, rgba) and theme structure validation.
 *
 * Requirements: 6.1, 6.3, 6.4, 8.3, 8.4, 8.5, 8.6
 */

/**
 * Default theme template containing all CSS variables with default values.
 * Used for merging incomplete themes to ensure completeness.
 */
export const DEFAULT_THEME_TEMPLATE = {
  // Background layers
  bg: "#f8f9fa",
  bgPrimary: "#f8f9fa",
  bgSecondary: "#ffffff",
  bgTertiary: "#f2f2f7",
  bgElevated: "#ffffff",

  // Text layers
  text: "#1c1c1e",
  textPrimary: "#1c1c1e",
  textSecondary: "#3a3a3c",
  textTertiary: "#8e8e93",

  // Primary colors
  primary: "#007aff",
  primaryHover: "#0066d6",
  accentColor: "#007aff",
  accentHover: "#0051d5",

  // Border/divider
  borderColor: "rgba(60, 60, 67, 0.1)",
  dividerColor: "rgba(60, 60, 67, 0.1)",

  // Sidebar
  sidebarBg: "rgba(240, 240, 245, 0.8)",
  sidebarTextColor: "#1c1c1e",
  sidebarHoverBg: "rgba(220, 220, 225, 0.9)",
  sidebarActiveBg: "rgba(0, 122, 255, 0.1)",
  sidebarActiveColor: "#007aff",

  // Card
  cardBg: "#ffffff",
  cardShadow: "rgba(0, 0, 0, 0.1)",
  cardBorder: "rgba(60, 60, 67, 0.1)",

  // Scrollbar
  scrollbarTrack: "rgba(200, 200, 205, 0.3)",
  scrollbarThumb: "rgba(180, 180, 185, 0.5)",
  scrollbarThumbHover: "rgba(160, 160, 165, 0.7)",
};

/**
 * CSS variable mapping from camelCase to CSS variable names
 */
export const CSS_VARIABLE_MAP = {
  bg: "--bg",
  bgPrimary: "--bg-primary",
  bgSecondary: "--bg-secondary",
  bgTertiary: "--bg-tertiary",
  bgElevated: "--bg-elevated",
  text: "--text",
  textPrimary: "--text-primary",
  textSecondary: "--text-secondary",
  textTertiary: "--text-tertiary",
  primary: "--primary",
  primaryHover: "--primary-hover",
  accentColor: "--accent-color",
  accentHover: "--accent-hover",
  borderColor: "--border-color",
  dividerColor: "--divider-color",
  sidebarBg: "--sidebar-bg",
  sidebarTextColor: "--sidebar-text-color",
  sidebarHoverBg: "--sidebar-hover-bg",
  sidebarActiveBg: "--sidebar-active-bg",
  sidebarActiveColor: "--sidebar-active-color",
  cardBg: "--card-bg",
  cardShadow: "--card-shadow",
  cardBorder: "--card-border",
  scrollbarTrack: "--scrollbar-track",
  scrollbarThumb: "--scrollbar-thumb",
  scrollbarThumbHover: "--scrollbar-thumb-hover",
};

/**
 * Validation result structure
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Whether the validation passed
 * @property {string|null} error - Error message if validation failed
 * @property {*} [value] - Normalized value if applicable
 */

/**
 * Security validation result structure
 * @typedef {Object} SecurityResult
 * @property {boolean} safe - Whether the data is safe
 * @property {string|null} error - Error message if security check failed
 * @property {string[]} [violations] - List of security violations found
 */

// Regular expressions for color validation
const HEX_COLOR_REGEX = /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/;
const RGB_COLOR_REGEX =
  /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/;
const RGBA_COLOR_REGEX =
  /^rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(0|1|0?\.\d+)\s*\)$/;

/**
 * ThemeValidator class providing validation methods for theme colors and structures
 */
export class ThemeValidator {
  /**
   * Validates a color value string
   * Supports hex (#RGB, #RRGGBB, #RRGGBBAA), rgb(), and rgba() formats
   *
   * @param {string} color - The color string to validate
   * @returns {ValidationResult} Validation result with valid flag and error message
   */
  validateColor(color) {
    if (typeof color !== "string") {
      return {
        valid: false,
        error: "Color must be a string",
      };
    }

    const trimmedColor = color.trim();

    if (!trimmedColor) {
      return {
        valid: false,
        error: "Color cannot be empty",
      };
    }

    // Check hex format
    if (trimmedColor.startsWith("#")) {
      if (HEX_COLOR_REGEX.test(trimmedColor)) {
        return { valid: true, error: null, value: trimmedColor };
      }
      return {
        valid: false,
        error: `Invalid hex color format: ${trimmedColor}. Expected #RGB, #RRGGBB, or #RRGGBBAA`,
      };
    }

    // Check rgb format
    if (trimmedColor.startsWith("rgb(")) {
      const match = trimmedColor.match(RGB_COLOR_REGEX);
      if (match) {
        const [, r, g, b] = match;
        if (
          this._isValidRGBValue(r) &&
          this._isValidRGBValue(g) &&
          this._isValidRGBValue(b)
        ) {
          return { valid: true, error: null, value: trimmedColor };
        }
        return {
          valid: false,
          error: `Invalid RGB values: each component must be 0-255`,
        };
      }
      return {
        valid: false,
        error: `Invalid RGB format: ${trimmedColor}. Expected rgb(r, g, b)`,
      };
    }

    // Check rgba format
    if (trimmedColor.startsWith("rgba(")) {
      const match = trimmedColor.match(RGBA_COLOR_REGEX);
      if (match) {
        const [, r, g, b, a] = match;
        if (
          this._isValidRGBValue(r) &&
          this._isValidRGBValue(g) &&
          this._isValidRGBValue(b)
        ) {
          const alpha = parseFloat(a);
          if (alpha >= 0 && alpha <= 1) {
            return { valid: true, error: null, value: trimmedColor };
          }
          return {
            valid: false,
            error: `Invalid alpha value: ${a}. Must be between 0 and 1`,
          };
        }
        return {
          valid: false,
          error: `Invalid RGBA values: RGB components must be 0-255`,
        };
      }
      return {
        valid: false,
        error: `Invalid RGBA format: ${trimmedColor}. Expected rgba(r, g, b, a)`,
      };
    }

    return {
      valid: false,
      error: `Unsupported color format: ${trimmedColor}. Use hex (#RRGGBB), rgb(), or rgba()`,
    };
  }

  /**
   * Validates a complete theme object
   *
   * @param {Object} theme - The theme object to validate
   * @returns {ValidationResult} Validation result
   */
  validateTheme(theme) {
    if (!theme || typeof theme !== "object") {
      return {
        valid: false,
        error: "Theme must be an object",
      };
    }

    // Validate required fields
    if (!theme.id || typeof theme.id !== "string") {
      return {
        valid: false,
        error: "Theme must have a valid id",
      };
    }

    if (!theme.name || typeof theme.name !== "string" || !theme.name.trim()) {
      return {
        valid: false,
        error: "Theme must have a non-empty name",
      };
    }

    // Validate theme ID format (alphanumeric, hyphens, underscores only)
    if (!/^[a-zA-Z0-9_-]{1,64}$/.test(theme.id)) {
      return {
        valid: false,
        error:
          "Theme ID must be 1-64 characters, containing only letters, numbers, hyphens, and underscores",
      };
    }

    // Validate colors object
    if (!theme.colors || typeof theme.colors !== "object") {
      return {
        valid: false,
        error: "Theme must have a colors object",
      };
    }

    // Validate each color in the theme
    const colorErrors = [];
    for (const [key, value] of Object.entries(theme.colors)) {
      if (CSS_VARIABLE_MAP[key]) {
        const result = this.validateColor(value);
        if (!result.valid) {
          colorErrors.push(`${key}: ${result.error}`);
        }
      }
    }

    if (colorErrors.length > 0) {
      return {
        valid: false,
        error: `Invalid colors: ${colorErrors.join("; ")}`,
      };
    }

    return { valid: true, error: null };
  }

  /**
   * Validates import data for security issues
   * Checks for prototype pollution and other security vulnerabilities
   *
   * @param {*} data - The data to validate
   * @returns {SecurityResult} Security validation result
   */
  validateImportSecurity(data) {
    const violations = [];

    const checkObject = (obj, path = "") => {
      if (obj === null || typeof obj !== "object") {
        return;
      }

      if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
          checkObject(item, `${path}[${index}]`);
        });
        return;
      }

      for (const [key, value] of Object.entries(obj)) {
        // Check for prototype pollution attempts
        if (
          key === "__proto__" ||
          key === "constructor" ||
          key === "prototype"
        ) {
          violations.push(`Dangerous key '${key}' found at ${path || "root"}`);
        }

        // Check for function values (potential code injection)
        if (typeof value === "function") {
          violations.push(
            `Function value found at ${path ? `${path}.${key}` : key}`
          );
        }

        // Recursively check nested objects
        const newPath = path ? `${path}.${key}` : key;
        checkObject(value, newPath);
      }
    };

    checkObject(data);

    if (violations.length > 0) {
      return {
        safe: false,
        error: `Security violations detected: ${violations.join("; ")}`,
        violations,
      };
    }

    return { safe: true, error: null, violations: [] };
  }

  /**
   * Merges a partial theme with the default template to ensure completeness
   *
   * @param {Object} partialColors - Partial theme colors object
   * @returns {Object} Complete theme colors with all required fields
   */
  mergeWithTemplate(partialColors) {
    if (!partialColors || typeof partialColors !== "object") {
      return { ...DEFAULT_THEME_TEMPLATE };
    }

    const merged = { ...DEFAULT_THEME_TEMPLATE };

    for (const [key, value] of Object.entries(partialColors)) {
      if (key in DEFAULT_THEME_TEMPLATE) {
        // Only use the value if it's a valid color
        const validation = this.validateColor(value);
        if (validation.valid) {
          merged[key] = value;
        }
      }
    }

    return merged;
  }

  /**
   * Validates all colors in a theme before application
   * Returns true only if all colors are valid
   *
   * @param {Object} colors - Theme colors object
   * @returns {ValidationResult} Validation result
   */
  validateAllColors(colors) {
    if (!colors || typeof colors !== "object") {
      return {
        valid: false,
        error: "Colors must be an object",
      };
    }

    const invalidColors = [];

    for (const [key, value] of Object.entries(colors)) {
      if (CSS_VARIABLE_MAP[key]) {
        const result = this.validateColor(value);
        if (!result.valid) {
          invalidColors.push({ key, error: result.error });
        }
      }
    }

    if (invalidColors.length > 0) {
      return {
        valid: false,
        error: `Invalid colors found: ${invalidColors
          .map((c) => `${c.key}`)
          .join(", ")}`,
        invalidColors,
      };
    }

    return { valid: true, error: null };
  }

  /**
   * Helper method to check if an RGB value is valid (0-255)
   * @private
   */
  _isValidRGBValue(value) {
    const num = parseInt(value, 10);
    return num >= 0 && num <= 255;
  }

  /**
   * Normalizes a hex color to 6-digit format
   *
   * @param {string} hex - Hex color string
   * @returns {string} Normalized 6-digit hex color
   */
  normalizeHexColor(hex) {
    if (!hex || !hex.startsWith("#")) {
      return hex;
    }

    const color = hex.slice(1);

    // Convert 3-digit to 6-digit
    if (color.length === 3) {
      return `#${color[0]}${color[0]}${color[1]}${color[1]}${color[2]}${color[2]}`;
    }

    // Return as-is for 6 or 8 digit
    return hex;
  }

  /**
   * Parses a color string to RGB components
   *
   * @param {string} color - Color string (hex, rgb, or rgba)
   * @returns {{r: number, g: number, b: number, a: number}|null} RGB components or null if invalid
   */
  parseColor(color) {
    if (!color || typeof color !== "string") {
      return null;
    }

    const trimmed = color.trim();

    // Parse hex
    if (trimmed.startsWith("#")) {
      const hex = trimmed.slice(1);
      let r,
        g,
        b,
        a = 1;

      if (hex.length === 3) {
        r = parseInt(hex[0] + hex[0], 16);
        g = parseInt(hex[1] + hex[1], 16);
        b = parseInt(hex[2] + hex[2], 16);
      } else if (hex.length === 6) {
        r = parseInt(hex.slice(0, 2), 16);
        g = parseInt(hex.slice(2, 4), 16);
        b = parseInt(hex.slice(4, 6), 16);
      } else if (hex.length === 8) {
        r = parseInt(hex.slice(0, 2), 16);
        g = parseInt(hex.slice(2, 4), 16);
        b = parseInt(hex.slice(4, 6), 16);
        a = parseInt(hex.slice(6, 8), 16) / 255;
      } else {
        return null;
      }

      if (isNaN(r) || isNaN(g) || isNaN(b) || isNaN(a)) {
        return null;
      }

      return { r, g, b, a };
    }

    // Parse rgb
    const rgbMatch = trimmed.match(RGB_COLOR_REGEX);
    if (rgbMatch) {
      return {
        r: parseInt(rgbMatch[1], 10),
        g: parseInt(rgbMatch[2], 10),
        b: parseInt(rgbMatch[3], 10),
        a: 1,
      };
    }

    // Parse rgba
    const rgbaMatch = trimmed.match(RGBA_COLOR_REGEX);
    if (rgbaMatch) {
      return {
        r: parseInt(rgbaMatch[1], 10),
        g: parseInt(rgbaMatch[2], 10),
        b: parseInt(rgbaMatch[3], 10),
        a: parseFloat(rgbaMatch[4]),
      };
    }

    return null;
  }
}

// Export singleton instance
export const themeValidator = new ThemeValidator();

export default themeValidator;
