import React from "react";
import { useTheme, type FontScale } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Palette, Moon, Sun, Type } from "lucide-react";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = "",
  showLabel = false,
}) => {
  const {
    currentTheme,
    setTheme,
    isDarkMode,
    setIsDarkMode,
    fontScale,
    setFontScale,
    availableThemes,
  } = useTheme();

  const themeLabels: Record<string, string> = {
    "sap-clean": "SAP Clean",
    "sbts-custom": "SBTS Industrial",
    modern: "Modern Executive",
  };

  const fontLabels: Record<FontScale, string> = {
    compact: "Compact",
    comfortable: "Comfortable",
    large: "Large",
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={showLabel ? "default" : "icon"}
          className={className}
          title="Appearance settings"
        >
          <Palette className="h-4 w-4" />
          {showLabel && <span className="ml-2">Appearance</span>}
          <span className="sr-only">Appearance settings</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Palette className="h-4 w-4" />
          Theme
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {availableThemes.map(theme => (
          <DropdownMenuCheckboxItem
            key={theme}
            checked={currentTheme === theme}
            onCheckedChange={() => setTheme(theme)}
          >
            {themeLabels[theme]}
          </DropdownMenuCheckboxItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
          checked={isDarkMode}
          onCheckedChange={setIsDarkMode}
        >
          {isDarkMode ? (
            <Moon className="mr-2 h-4 w-4" />
          ) : (
            <Sun className="mr-2 h-4 w-4" />
          )}
          Dark Mode
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground">
          <Type className="h-4 w-4" /> Font Size
        </DropdownMenuLabel>
        {(["compact", "comfortable", "large"] as FontScale[]).map(scale => (
          <DropdownMenuCheckboxItem
            key={scale}
            checked={fontScale === scale}
            onCheckedChange={() => setFontScale(scale)}
          >
            {fontLabels[scale]}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ThemeToggle;
