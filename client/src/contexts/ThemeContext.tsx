import React, { createContext, useContext, useEffect, useState } from "react";

/**
 * ثيمات التطبيق الثلاث:
 * - sap-clean: احترافي وكلاسيكي (مستوحى من SAP)
 * - sbts-custom: مخصص وحديث (مستوحى من Aramco)
 * - modern: معاصر ومتطور (Dark Mode)
 */
export type ThemeName = "sap-clean" | "sbts-custom" | "modern";

interface ThemeContextType {
  currentTheme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  isDarkMode: boolean;
  setIsDarkMode: (isDark: boolean) => void;
  availableThemes: ThemeName[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemeName;
}

/**
 * ThemeProvider - توفير سياق الثيمات لكل التطبيق
 * يدير:
 * - الثيم الحالي (SAP Clean, SBTS Custom, Modern)
 * - وضع Dark Mode
 * - حفظ الاختيار في localStorage
 * - تطبيق الثيم على DOM
 */
export function ThemeProvider({
  children,
  defaultTheme = "sbts-custom",
}: ThemeProviderProps) {
  const [currentTheme, setCurrentThemeState] = useState<ThemeName>(defaultTheme);
  const [isDarkMode, setIsDarkModeState] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // تحميل الثيم المحفوظ من localStorage عند التحميل الأول
  useEffect(() => {
    const savedTheme = localStorage.getItem("sbts-theme") as ThemeName | null;
    const savedDarkMode = localStorage.getItem("sbts-dark-mode") === "true";

    if (savedTheme && ["sap-clean", "sbts-custom", "modern"].includes(savedTheme)) {
      setCurrentThemeState(savedTheme);
    }

    setIsDarkModeState(savedDarkMode);
    setIsLoaded(true);
  }, []);

  // تطبيق الثيم على DOM
  useEffect(() => {
    if (!isLoaded) return;

    const root = document.documentElement;

    // إزالة جميع فئات الثيمات السابقة
    root.classList.remove("theme-sap-clean", "theme-sbts-custom", "theme-modern");
    root.classList.remove("dark");

    // إضافة فئة الثيم الجديد
    root.classList.add(`theme-${currentTheme}`);

    // إضافة فئة Dark Mode إذا كانت مفعلة
    if (isDarkMode) {
      root.classList.add("dark");
    }

    // حفظ الاختيار في localStorage
    localStorage.setItem("sbts-theme", currentTheme);
    localStorage.setItem("sbts-dark-mode", isDarkMode.toString());
  }, [currentTheme, isDarkMode, isLoaded]);

  const setTheme = (theme: ThemeName) => {
    setCurrentThemeState(theme);
  };

  const setIsDarkMode = (isDark: boolean) => {
    setIsDarkModeState(isDark);
  };

  const value: ThemeContextType = {
    currentTheme,
    setTheme,
    isDarkMode,
    setIsDarkMode,
    availableThemes: ["sap-clean", "sbts-custom", "modern"],
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * useTheme Hook - للوصول إلى سياق الثيمات
 * استخدام:
 * const { currentTheme, setTheme, isDarkMode } = useTheme();
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
