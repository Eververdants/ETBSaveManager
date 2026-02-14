/**
 * Central seasonal theme schedule.
 *
 * New Year:
 * - Fixed yearly window: Dec 31 to Jan 4 (inclusive)
 *
 * Spring Festival:
 * - Automatically calculated from Lunar New Year (Chinese calendar)
 * - Window defaults to Lunar New Year day -4 to +7 (inclusive)
 */

const CHINESE_CALENDAR_FORMATTER = new Intl.DateTimeFormat("en-u-ca-chinese", {
  year: "numeric",
  month: "numeric",
  day: "numeric",
});

const LUNAR_NEW_YEAR_CACHE = new Map();

export const NEW_YEAR_AVAILABILITY_TEXT = "12-31 ~ 01-04 (yearly)";
export const SPRING_FESTIVAL_DAY_OFFSETS = {
  start: -4,
  end: 7,
};
export const SPRING_FESTIVAL_AVAILABILITY_TEXT =
  "Auto (Lunar New Year -4d ~ +7d)";

function normalizeToNoon(date) {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  return d;
}

function addDays(date, days) {
  const d = normalizeToNoon(date);
  d.setDate(d.getDate() + days);
  return d;
}

function getChineseCalendarParts(date) {
  try {
    const parts = CHINESE_CALENDAR_FORMATTER.formatToParts(date);
    const relatedYear = Number(parts.find((p) => p.type === "relatedYear")?.value);
    const monthRaw = parts.find((p) => p.type === "month")?.value || "";
    const dayRaw = parts.find((p) => p.type === "day")?.value || "";

    const month = Number.parseInt(monthRaw, 10);
    const day = Number.parseInt(dayRaw, 10);

    if (!Number.isFinite(relatedYear) || !Number.isFinite(month) || !Number.isFinite(day)) {
      return null;
    }

    return { relatedYear, month, day };
  } catch (error) {
    console.warn("[SeasonalTheme] Failed to parse Chinese calendar date:", error);
    return null;
  }
}

function findLunarNewYearDate(gregorianYear) {
  if (LUNAR_NEW_YEAR_CACHE.has(gregorianYear)) {
    return LUNAR_NEW_YEAR_CACHE.get(gregorianYear);
  }

  const start = new Date(gregorianYear, 0, 20, 12, 0, 0, 0);
  const end = new Date(gregorianYear, 2, 1, 12, 0, 0, 0);

  for (
    let cursor = new Date(start);
    cursor <= end;
    cursor.setDate(cursor.getDate() + 1)
  ) {
    const lunar = getChineseCalendarParts(cursor);
    if (!lunar) continue;

    if (
      lunar.relatedYear === gregorianYear &&
      lunar.month === 1 &&
      lunar.day === 1
    ) {
      const result = normalizeToNoon(cursor);
      LUNAR_NEW_YEAR_CACHE.set(gregorianYear, result);
      return result;
    }
  }

  LUNAR_NEW_YEAR_CACHE.set(gregorianYear, null);
  return null;
}

export function getSpringFestivalWindowByYear(gregorianYear) {
  const lunarNewYear = findLunarNewYearDate(gregorianYear);
  if (!lunarNewYear) return null;

  return {
    start: addDays(lunarNewYear, SPRING_FESTIVAL_DAY_OFFSETS.start),
    end: addDays(lunarNewYear, SPRING_FESTIVAL_DAY_OFFSETS.end),
  };
}

export function isNewYearPeriod(date = new Date()) {
  const d = normalizeToNoon(date);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return (month === 12 && day === 31) || (month === 1 && day >= 1 && day <= 4);
}

export function isSpringFestivalPeriod(date = new Date()) {
  const d = normalizeToNoon(date);
  const year = d.getFullYear();
  const candidateYears = [year - 1, year, year + 1];

  return candidateYears.some((y) => {
    const window = getSpringFestivalWindowByYear(y);
    if (!window) return false;
    return d >= window.start && d <= window.end;
  });
}

export function isSeasonalTheme(themeId) {
  return ["new-year", "spring-festival-dark", "spring-festival-light"].includes(
    themeId
  );
}

export function isSeasonalThemeAvailable(
  themeId,
  { mode = "auto", date = new Date() } = {}
) {
  if (!isSeasonalTheme(themeId)) return true;
  if (mode === "force") return true;
  if (mode === "hide") return false;

  if (themeId === "new-year") return isNewYearPeriod(date);
  if (themeId === "spring-festival-dark" || themeId === "spring-festival-light") {
    return isSpringFestivalPeriod(date);
  }
  return true;
}

export function getSeasonalThemeAvailability(themeId) {
  if (themeId === "new-year") {
    return NEW_YEAR_AVAILABILITY_TEXT;
  }

  if (themeId === "spring-festival-dark" || themeId === "spring-festival-light") {
    return SPRING_FESTIVAL_AVAILABILITY_TEXT;
  }

  return null;
}
