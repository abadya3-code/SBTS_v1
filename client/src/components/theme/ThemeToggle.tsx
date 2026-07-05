import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { Palette, Moon, Sun, Monitor } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

/**
 * ThemeToggle - مكون لتبديل الثيمات
 */
export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  showLabel = false,
}) => {
  const { currentTheme, setTheme, isDarkMode, setIsDarkMode, availableThemes } =
    useTheme();

  const themeLabels: Record<string, string> = {
    'sap-clean': 'SAP Clean',
    'sbts-custom': 'SBTS Custom',
    'modern': 'Modern',
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={className}
          title="Change theme"
        >
          <Palette className="h-4 w-4" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Palette className="h-4 w-4" />
          Theme Settings
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <div className="px-2 py-1.5">
          <p className="text-xs font-semibold text-muted-foreground mb-2">
            Select Theme
          </p>
          {availableThemes.map((theme) => (
            <DropdownMenuCheckboxItem
              key={theme}
              checked={currentTheme === theme}
              onCheckedChange={() => setTheme(theme)}
              className="flex items-center gap-2"
            >
              <span>{themeLabels[theme]}</span>
            </DropdownMenuCheckboxItem>
          ))}
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuCheckboxItem
          checked={isDarkMode}
          onCheckedChange={setIsDarkMode}
          className="flex items-center gap-2"
        >
          {isDarkMode ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4" />
          )}
          <span>Dark Mode</span>
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ThemeToggle;
