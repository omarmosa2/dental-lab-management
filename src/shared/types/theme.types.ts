/**
 * Theme Types
 * Defines the structure and types for the advanced theming system
 */

export type ThemeMode = 'light' | 'dark' | 'high-contrast';

export interface ThemeColors {
  // Primary colors
  primary: string;
  primaryHover: string;
  primaryActive: string;
  
  // Secondary colors
  secondary: string;
  secondaryHover: string;
  secondaryActive: string;
  
  // Status colors
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // Neutral colors
  background: string;
  surface: string;
  surfaceHover: string;
  border: string;
  
  // Text colors
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  
  // Special
  accent: string;
  highlight: string;
}

export interface ThemeConfig {
  id: string;
  name: string;
  nameEn: string;
  description?: string;
  mode: ThemeMode;
  colors: ThemeColors;
  customizable: boolean;
  author?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface CustomTheme extends ThemeConfig {
  customizable: true;
  baseTheme: string; // ID of the theme this was based on
}

export interface ThemeContextType {
  // Current theme
  currentTheme: ThemeConfig;
  
  // Theme management
  setTheme: (themeId: string) => void;
  setCustomTheme: (theme: ThemeConfig) => void;
  
  // Legacy support
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  
  // Auto theme
  autoTheme: boolean;
  setAutoTheme: (enabled: boolean) => void;
  
  // Available themes
  availableThemes: ThemeConfig[];
  customThemes: ThemeConfig[];
  
  // Theme operations
  saveCustomTheme: (theme: ThemeConfig) => Promise<void>;
  deleteCustomTheme: (themeId: string) => Promise<void>;
  exportTheme: (themeId: string) => Promise<void>;
  importTheme: (filePath: string) => Promise<void>;
}

export interface ThemeExport {
  version: string;
  theme: ThemeConfig;
  exportedAt: number;
  exportedBy: string;
}