/**
 * SAP Clean Theme
 * Professional light theme focused on clarity, dense enterprise screens, and stable contrast.
 */
export const sapCleanTheme = {
  name: 'sap-clean',
  label: 'SAP Clean',
  description: 'Professional enterprise theme with clean surfaces and strong readability',
  isDarkMode: false,

  colors: {
    primary: '#0F6CBD',
    primaryLight: '#3B82F6',
    primaryDark: '#0B4F8A',

    secondary: '#475569',
    secondaryLight: '#94A3B8',
    secondaryDark: '#334155',

    accent: '#0891B2',
    accentLight: '#22D3EE',
    accentDark: '#0E7490',

    background: '#F8FAFC',
    surface: '#FFFFFF',
    border: '#D9E2EC',
    text: '#0F172A',
    textLight: '#475569',
    textLighter: '#94A3B8',

    success: '#16A34A',
    successLight: '#86EFAC',
    successDark: '#15803D',

    warning: '#D97706',
    warningLight: '#FCD34D',
    warningDark: '#B45309',

    error: '#DC2626',
    errorLight: '#FCA5A5',
    errorDark: '#991B1B',

    info: '#2563EB',
    infoLight: '#93C5FD',
    infoDark: '#1D4ED8',
  },

  typography: {
    fontFamily: "'Inter', 'Segoe UI', 'Arial', sans-serif",
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
  },

  borderRadius: {
    sm: '0.375rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
  },

  shadows: {
    sm: '0 1px 2px 0 rgb(15 23 42 / 0.05)',
    md: '0 4px 10px -2px rgb(15 23 42 / 0.12)',
    lg: '0 14px 32px -16px rgb(15 23 42 / 0.28)',
  },
} as const;

export type SapCleanTheme = typeof sapCleanTheme;
