/**
 * Themes Index
 * Central export point for available application themes.
 */

export { sapCleanTheme, type SapCleanTheme } from './sapClean';
export { sbtsCustomTheme, type SbtsCustomTheme } from './sbtsCustom';
export { modernTheme, type ModernTheme } from './modern';

import { sapCleanTheme } from './sapClean';
import { sbtsCustomTheme } from './sbtsCustom';
import { modernTheme } from './modern';

export const themesMap = {
  'sap-clean': sapCleanTheme,
  'sbts-custom': sbtsCustomTheme,
  'modern': modernTheme,
} as const;

export const availableThemes = [
  {
    id: 'sap-clean',
    name: 'SAP Clean',
    description: 'Professional and classic enterprise theme',
    theme: sapCleanTheme,
  },
  {
    id: 'sbts-custom',
    name: 'SBTS Industrial',
    description: 'Industrial command-center theme for maintenance operations',
    theme: sbtsCustomTheme,
  },
  {
    id: 'modern',
    name: 'Modern Executive',
    description: 'Contemporary dark-ready executive theme',
    theme: modernTheme,
  },
] as const;

export type AvailableThemeId = typeof availableThemes[number]['id'];
