/**
 * AccessibilityChecker Service
 *
 * Provides WCAG contrast ratio calculations and accessibility checking.
 * Implements contrast ratio calculation using WCAG formula and level determination.
 *
 * Requirements: 10.1, 10.2, 10.3
 */

import { themeValidator } from "./themeValidator.js";

/**
 * WCAG compliance levels
 * @typedef {'AAA' | 'AA' | 'A' | 'FAIL'} WCAGLevel
 */

/**
 * Accessibility issue structure
 * @typedef {Object} AccessibilityIssue
 * @property {string} type - Type of issue (e.g., 'contrast')
 * @property {string} element - Element or color pair affected
 * @property {number} ratio - Actual contrast ratio
 * @property {number} required - Required contrast ratio
 * @property {WCAGLevel} level - Current WCAG level
 */

/**
 * Accessibility score structure
 * @typedef {Object} AccessibilityScore
 * @property {WCAGLevel} level - Overall WCAG compliance level
 * @property {AccessibilityIssue[]} issues - List of accessibility issues
 * @property {string[]} suggestions - Improvement suggestions
 */

/**
 * WCAG contrast ratio thresholds
 */
const WCAG_THRESHOLDS = {
  AAA_NORMAL: 7.0, // AAA for normal text
  AAA_LARGE: 4.5, // AAA for large text
  AA_NORMAL: 4.5, // AA for normal text
  AA_LARGE: 3.0, // AA for large text
  A_MINIMUM: 3.0, // Minimum for any text
};

/**
 * Text-background color pairs to check in a theme
 */
const COLOR_PAIRS_TO_CHECK = [
  { text: "text", bg: "bg", name: "Primary text on background" },
  {
    text: "textPrimary",
    bg: "bgPrimary",
    name: "Primary text on primary background",
  },
  {
    text: "textSecondary",
    bg: "bgSecondary",
    name: "Secondary text on secondary background",
  },
  {
    text: "textTertiary",
    bg: "bgTertiary",
    name: "Tertiary text on tertiary background",
  },
  {
    text: "sidebarTextColor",
    bg: "sidebarBg",
    name: "Sidebar text on sidebar background",
  },
  {
    text: "sidebarActiveColor",
    bg: "sidebarActiveBg",
    name: "Active sidebar text on active background",
  },
  { text: "text", bg: "cardBg", name: "Text on card background" },
];

/**
 * AccessibilityChecker class providing WCAG compliance checking
 */
export class AccessibilityChecker {
  constructor() {
    this.validator = themeValidator;
  }

  /**
   * Calculates the relative luminance of a color
   * Using WCAG formula: https://www.w3.org/TR/WCAG20/#relativeluminancedef
   *
   * @param {number} r - Red component (0-255)
   * @param {number} g - Green component (0-255)
   * @param {number} b - Blue component (0-255)
   * @returns {number} Relative luminance (0-1)
   */
  calculateLuminance(r, g, b) {
    // Convert to sRGB
    const rsRGB = r / 255;
    const gsRGB = g / 255;
    const bsRGB = b / 255;

    // Apply gamma correction
    const rLinear =
      rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
    const gLinear =
      gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
    const bLinear =
      bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

    // Calculate luminance using WCAG coefficients
    return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
  }

  /**
   * Calculates the contrast ratio between two colors
   * Using WCAG formula: (L1 + 0.05) / (L2 + 0.05) where L1 is the lighter luminance
   *
   * @param {string} foreground - Foreground color string
   * @param {string} background - Background color string
   * @returns {number} Contrast ratio (1-21)
   */
  calculateContrastRatio(foreground, background) {
    const fgColor = this.validator.parseColor(foreground);
    const bgColor = this.validator.parseColor(background);

    if (!fgColor || !bgColor) {
      return 1; // Return minimum ratio if colors can't be parsed
    }

    const fgLuminance = this.calculateLuminance(
      fgColor.r,
      fgColor.g,
      fgColor.b
    );
    const bgLuminance = this.calculateLuminance(
      bgColor.r,
      bgColor.g,
      bgColor.b
    );

    // Ensure L1 is the lighter luminance
    const L1 = Math.max(fgLuminance, bgLuminance);
    const L2 = Math.min(fgLuminance, bgLuminance);

    // WCAG contrast ratio formula
    const ratio = (L1 + 0.05) / (L2 + 0.05);

    // Round to 2 decimal places
    return Math.round(ratio * 100) / 100;
  }

  /**
   * Checks WCAG compliance level for a given contrast ratio
   *
   * @param {number} ratio - Contrast ratio
   * @param {boolean} [isLargeText=false] - Whether the text is large (18pt+ or 14pt+ bold)
   * @returns {WCAGLevel} WCAG compliance level
   */
  checkWCAGCompliance(ratio, isLargeText = false) {
    if (isLargeText) {
      if (ratio >= WCAG_THRESHOLDS.AAA_LARGE) return "AAA";
      if (ratio >= WCAG_THRESHOLDS.AA_LARGE) return "AA";
      if (ratio >= WCAG_THRESHOLDS.A_MINIMUM) return "A";
      return "FAIL";
    }

    // Normal text thresholds
    if (ratio >= WCAG_THRESHOLDS.AAA_NORMAL) return "AAA";
    if (ratio >= WCAG_THRESHOLDS.AA_NORMAL) return "AA";
    if (ratio >= WCAG_THRESHOLDS.A_MINIMUM) return "A";
    return "FAIL";
  }

  /**
   * Gets the overall accessibility score for a complete theme
   *
   * @param {Object} colors - Theme colors object
   * @returns {AccessibilityScore} Accessibility score with level, issues, and suggestions
   */
  getThemeAccessibilityScore(colors) {
    const issues = [];
    const suggestions = [];
    let worstLevel = "AAA";

    const levelPriority = { AAA: 3, AA: 2, A: 1, FAIL: 0 };

    for (const pair of COLOR_PAIRS_TO_CHECK) {
      const textColor = colors[pair.text];
      const bgColor = colors[pair.bg];

      if (!textColor || !bgColor) {
        continue;
      }

      const ratio = this.calculateContrastRatio(textColor, bgColor);
      const level = this.checkWCAGCompliance(ratio);

      // Track worst level
      if (levelPriority[level] < levelPriority[worstLevel]) {
        worstLevel = level;
      }

      // Record issues for anything below AA
      if (level === "FAIL" || level === "A") {
        issues.push({
          type: "contrast",
          element: pair.name,
          ratio,
          required: WCAG_THRESHOLDS.AA_NORMAL,
          level,
        });

        // Add suggestion
        if (level === "FAIL") {
          suggestions.push(
            `Increase contrast for "${pair.name}": current ratio is ${ratio}:1, minimum required is ${WCAG_THRESHOLDS.A_MINIMUM}:1`
          );
        } else if (level === "A") {
          suggestions.push(
            `Consider improving contrast for "${pair.name}": current ratio is ${ratio}:1, AA standard requires ${WCAG_THRESHOLDS.AA_NORMAL}:1`
          );
        }
      }
    }

    return {
      level: worstLevel,
      issues,
      suggestions,
    };
  }

  /**
   * Checks if a text-background color pair meets the minimum contrast requirement
   * Returns a warning if contrast ratio is below AA standard (4.5:1)
   *
   * @param {string} textColor - Text color string
   * @param {string} bgColor - Background color string
   * @returns {{passes: boolean, ratio: number, level: WCAGLevel, warning: string|null}}
   */
  checkContrastPair(textColor, bgColor) {
    const ratio = this.calculateContrastRatio(textColor, bgColor);
    const level = this.checkWCAGCompliance(ratio);

    let warning = null;
    if (ratio < WCAG_THRESHOLDS.AA_NORMAL) {
      warning = `Low contrast: ${ratio}:1. WCAG AA requires at least ${WCAG_THRESHOLDS.AA_NORMAL}:1 for normal text.`;
    }

    return {
      passes: ratio >= WCAG_THRESHOLDS.AA_NORMAL,
      ratio,
      level,
      warning,
    };
  }

  /**
   * Suggests a color adjustment to meet minimum contrast requirements
   *
   * @param {string} textColor - Current text color
   * @param {string} bgColor - Background color
   * @param {number} [targetRatio=4.5] - Target contrast ratio
   * @returns {{suggestedColor: string, achievedRatio: number}|null}
   */
  suggestColorAdjustment(
    textColor,
    bgColor,
    targetRatio = WCAG_THRESHOLDS.AA_NORMAL
  ) {
    const textRgb = this.validator.parseColor(textColor);
    const bgRgb = this.validator.parseColor(bgColor);

    if (!textRgb || !bgRgb) {
      return null;
    }

    const bgLuminance = this.calculateLuminance(bgRgb.r, bgRgb.g, bgRgb.b);

    // Determine if we should lighten or darken the text
    const shouldLighten = bgLuminance < 0.5;

    // Binary search for the right adjustment
    let low = 0;
    let high = 1;
    let bestColor = textColor;
    let bestRatio = this.calculateContrastRatio(textColor, bgColor);

    for (let i = 0; i < 20; i++) {
      const mid = (low + high) / 2;

      let adjustedR, adjustedG, adjustedB;

      if (shouldLighten) {
        adjustedR = Math.round(textRgb.r + (255 - textRgb.r) * mid);
        adjustedG = Math.round(textRgb.g + (255 - textRgb.g) * mid);
        adjustedB = Math.round(textRgb.b + (255 - textRgb.b) * mid);
      } else {
        adjustedR = Math.round(textRgb.r * (1 - mid));
        adjustedG = Math.round(textRgb.g * (1 - mid));
        adjustedB = Math.round(textRgb.b * (1 - mid));
      }

      const adjustedColor = `rgb(${adjustedR}, ${adjustedG}, ${adjustedB})`;
      const ratio = this.calculateContrastRatio(adjustedColor, bgColor);

      if (ratio >= targetRatio) {
        bestColor = adjustedColor;
        bestRatio = ratio;
        high = mid;
      } else {
        low = mid;
      }
    }

    if (bestRatio >= targetRatio) {
      return {
        suggestedColor: bestColor,
        achievedRatio: bestRatio,
      };
    }

    return null;
  }

  /**
   * Gets a human-readable description of a WCAG level
   *
   * @param {WCAGLevel} level - WCAG level
   * @returns {string} Human-readable description
   */
  getLevelDescription(level) {
    switch (level) {
      case "AAA":
        return "Excellent - Meets highest accessibility standards";
      case "AA":
        return "Good - Meets standard accessibility requirements";
      case "A":
        return "Minimum - Meets basic accessibility requirements";
      case "FAIL":
        return "Poor - Does not meet accessibility requirements";
      default:
        return "Unknown";
    }
  }
}

// Export singleton instance
export const accessibilityChecker = new AccessibilityChecker();

export default accessibilityChecker;
