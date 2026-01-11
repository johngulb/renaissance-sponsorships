import { DefaultTheme } from 'styled-components';

declare module 'styled-components' {
  export interface DefaultTheme {
    background: string;
    backgroundAlt: string;
    text: string;
    textSecondary: string;
    border: string;
    borderRadius: string;
    surface: string;
    accent: string;
    shadow: string;
    overlay: string;
  }
}

export const lightTheme: DefaultTheme = {
  background: '#ffffff',
  backgroundAlt: '#f5f5f5',
  text: '#1c1c1e',
  textSecondary: '#666666',
  border: '#e0e0e0',
  borderRadius: '8px',
  surface: '#f5f5f5',
  accent: '#ff7a59',
  shadow: 'rgba(0, 0, 0, 0.1)',
  overlay: 'rgba(0, 0, 0, 0.5)',
};

export const darkTheme: DefaultTheme = {
  background: '#1c1c1e',
  backgroundAlt: '#676767',
  text: '#ffffff',
  textSecondary: '#a0a0a0',
  border: '#2c2c2e',
  borderRadius: '8px',
  surface: '#2c2c2e',
  accent: '#ff7a59',
  shadow: 'rgba(0, 0, 0, 0.3)',
  overlay: 'rgba(0, 0, 0, 0.7)',
};
