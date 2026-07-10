import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemeName = "sap-clean" | "sbts-custom" | "modern";
export type FontScale = "compact" | "comfortable" | "large";

interface ThemeContextType {
  currentTheme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  isDarkMode: boolean;
  setIsDarkMode: (isDark: boolean) => void;
  fontScale: FontScale;
  setFontScale: (scale: FontScale) => void;
  availableThemes: ThemeName[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemeName;
}

const validThemes: ThemeName[] = ["sap-clean", "sbts-custom", "modern"];
const validFontScales: FontScale[] = ["compact", "comfortable", "large"];

export function ThemeProvider({
  children,
  defaultTheme = "sbts-custom",
}: ThemeProviderProps) {
  const [currentTheme, setCurrentThemeState] =
    useState<ThemeName>(defaultTheme);
  const [isDarkMode, setIsDarkModeState] = useState(false);
  const [fontScale, setFontScaleState] = useState<FontScale>("comfortable");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("sbts-theme") as ThemeName | null;
    const savedDarkMode = localStorage.getItem("sbts-dark-mode") === "true";
    const savedFontScale = localStorage.getItem(
      "sbts-font-scale"
    ) as FontScale | null;

    if (savedTheme && validThemes.includes(savedTheme))
      setCurrentThemeState(savedTheme);
    if (savedFontScale && validFontScales.includes(savedFontScale))
      setFontScaleState(savedFontScale);
    setIsDarkModeState(savedDarkMode);
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    const root = document.documentElement;
    root.classList.remove(
      "theme-sap-clean",
      "theme-sbts-custom",
      "theme-modern",
      "dark",
      "font-compact",
      "font-comfortable",
      "font-large"
    );
    root.classList.add(`theme-${currentTheme}`);
    root.classList.add(`font-${fontScale}`);
    if (isDarkMode) root.classList.add("dark");

    localStorage.setItem("sbts-theme", currentTheme);
    localStorage.setItem("sbts-dark-mode", String(isDarkMode));
    localStorage.setItem("sbts-font-scale", fontScale);
  }, [currentTheme, isDarkMode, fontScale, isLoaded]);

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        setTheme: setCurrentThemeState,
        isDarkMode,
        setIsDarkMode: setIsDarkModeState,
        fontScale,
        setFontScale: setFontScaleState,
        availableThemes: validThemes,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
