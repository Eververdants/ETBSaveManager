import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { DEFAULT_LANGUAGE, LANGUAGE_META, STORAGE_KEY, SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/i18n";

export interface UseLocaleResult {
  current: SupportedLanguage;
  currentLabel: string;
  currentShortLabel: string;
  languages: readonly SupportedLanguage[];
  setLocale: (next: SupportedLanguage) => void;
}

function isSupportedLanguage(value: string): value is SupportedLanguage {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

function readCurrent(i18nLanguage: string | undefined): SupportedLanguage {
  if (i18nLanguage && isSupportedLanguage(i18nLanguage)) {
    return i18nLanguage;
  }
  return DEFAULT_LANGUAGE;
}

export function useLocale(): UseLocaleResult {
  const { i18n } = useTranslation();

  const current = useMemo<SupportedLanguage>(() => readCurrent(i18n.language), [i18n.language]);
  const meta = LANGUAGE_META[current];

  const setLocale = useCallback(
    (next: SupportedLanguage): void => {
      if (!isSupportedLanguage(next)) return;
      void i18n.changeLanguage(next);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, next);
        document.documentElement.lang = LANGUAGE_META[next].htmlLang;
      }
    },
    [i18n],
  );

  return {
    current,
    currentLabel: meta.label,
    currentShortLabel: meta.shortLabel,
    languages: SUPPORTED_LANGUAGES,
    setLocale,
  };
}
