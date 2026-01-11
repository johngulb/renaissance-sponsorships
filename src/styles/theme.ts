import { DefaultTheme } from 'styled-components';

declare module 'styled-components' {
  export interface DefaultTheme {
    // Colors
    background: string;
    backgroundAlt: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    border: string;
    borderLight: string;
    surface: string;
    surfaceHover: string;
    accent: string;
    accentGold: string;
    shadow: string;
    shadowMd: string;
    overlay: string;
    // Status colors
    success: string;
    successBg: string;
    warning: string;
    warningBg: string;
    error: string;
    errorBg: string;
    // Spacing
    spacing: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
      xxl: string;
    };
    // Border radius
    radius: {
      sm: string;
      md: string;
      lg: string;
      full: string;
    };
    // Deprecated - for backwards compatibility
    borderRadius: string;
  }
}

// Renaissance City - Light Theme (Minimal & Professional)
export const lightTheme: DefaultTheme = {
  // Colors
  background: '#FAFAF9',
  backgroundAlt: '#F5F5F4',
  text: '#1C1917',
  textSecondary: '#57534E',
  textMuted: '#A8A29E',
  border: '#E7E5E4',
  borderLight: '#F5F5F4',
  surface: '#FFFFFF',
  surfaceHover: '#FAFAF9',
  accent: '#92400E',
  accentGold: '#B45309',
  shadow: 'rgba(0, 0, 0, 0.04)',
  shadowMd: 'rgba(0, 0, 0, 0.08)',
  overlay: 'rgba(0, 0, 0, 0.5)',
  // Status
  success: '#15803D',
  successBg: '#F0FDF4',
  warning: '#CA8A04',
  warningBg: '#FEFCE8',
  error: '#DC2626',
  errorBg: '#FEF2F2',
  // Spacing
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    xxl: '3rem',
  },
  // Border radius
  radius: {
    sm: '6px',
    md: '8px',
    lg: '12px',
    full: '9999px',
  },
  // Deprecated
  borderRadius: '8px',
};

// Renaissance City - Dark Theme (Minimal & Professional)
export const darkTheme: DefaultTheme = {
  // Colors
  background: '#0C0A09',
  backgroundAlt: '#1C1917',
  text: '#FAFAF9',
  textSecondary: '#A8A29E',
  textMuted: '#78716C',
  border: '#292524',
  borderLight: '#1C1917',
  surface: '#1C1917',
  surfaceHover: '#292524',
  accent: '#F59E0B',
  accentGold: '#D97706',
  shadow: 'rgba(0, 0, 0, 0.2)',
  shadowMd: 'rgba(0, 0, 0, 0.3)',
  overlay: 'rgba(0, 0, 0, 0.75)',
  // Status
  success: '#22C55E',
  successBg: '#052E16',
  warning: '#FACC15',
  warningBg: '#422006',
  error: '#EF4444',
  errorBg: '#450A0A',
  // Spacing
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    xxl: '3rem',
  },
  // Border radius
  radius: {
    sm: '6px',
    md: '8px',
    lg: '12px',
    full: '9999px',
  },
  // Deprecated
  borderRadius: '8px',
};
