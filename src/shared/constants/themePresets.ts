import type { ThemeConfig } from '../types/theme.types';

/**
 * Theme Presets
 * Pre-configured professional themes for the application
 */

export const THEME_PRESETS: ThemeConfig[] = [
  // Light Theme (Default)
  {
    id: 'light',
    name: 'فاتح',
    nameEn: 'Light',
    description: 'الثيم الفاتح الافتراضي',
    mode: 'light',
    customizable: false,
    colors: {
      primary: '#2563eb',
      primaryHover: '#1d4ed8',
      primaryActive: '#1e40af',
      
      secondary: '#7c3aed',
      secondaryHover: '#6d28d9',
      secondaryActive: '#5b21b6',
      
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
      
      background: '#f9fafb',
      surface: '#ffffff',
      surfaceHover: '#f3f4f6',
      border: '#e5e7eb',
      
      textPrimary: '#111827',
      textSecondary: '#4b5563',
      textMuted: '#9ca3af',
      
      accent: '#8b5cf6',
      highlight: '#fef3c7',
    },
  },
  
  // Dark Theme (Default)
  {
    id: 'dark',
    name: 'داكن',
    nameEn: 'Dark',
    description: 'الثيم الداكن الافتراضي',
    mode: 'dark',
    customizable: false,
    colors: {
      primary: '#3b82f6',
      primaryHover: '#2563eb',
      primaryActive: '#1d4ed8',
      
      secondary: '#8b5cf6',
      secondaryHover: '#7c3aed',
      secondaryActive: '#6d28d9',
      
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
      
      background: '#0f172a',
      surface: '#1e293b',
      surfaceHover: '#334155',
      border: '#475569',
      
      textPrimary: '#f1f5f9',
      textSecondary: '#cbd5e1',
      textMuted: '#64748b',
      
      accent: '#a78bfa',
      highlight: '#422006',
    },
  },
  
  // High Contrast Theme (WCAG AAA)
  {
    id: 'high-contrast',
    name: 'تباين عالي',
    nameEn: 'High Contrast',
    description: 'ثيم بتباين عالي للوضوح الأفضل (WCAG AAA)',
    mode: 'high-contrast',
    customizable: false,
    colors: {
      primary: '#0000ff',
      primaryHover: '#0000cc',
      primaryActive: '#000099',
      
      secondary: '#800080',
      secondaryHover: '#660066',
      secondaryActive: '#4d004d',
      
      success: '#008000',
      warning: '#ff8c00',
      error: '#ff0000',
      info: '#0000ff',
      
      background: '#ffffff',
      surface: '#ffffff',
      surfaceHover: '#f0f0f0',
      border: '#000000',
      
      textPrimary: '#000000',
      textSecondary: '#000000',
      textMuted: '#333333',
      
      accent: '#ff00ff',
      highlight: '#ffff00',
    },
  },
  
  // Ocean Blue Theme (Medical/Professional)
  {
    id: 'ocean-blue',
    name: 'أزرق المحيط',
    nameEn: 'Ocean Blue',
    description: 'ثيم أزرق طبي احترافي',
    mode: 'light',
    customizable: true,
    colors: {
      primary: '#0077be',
      primaryHover: '#005a8f',
      primaryActive: '#004570',
      
      secondary: '#00a8e8',
      secondaryHover: '#0087ba',
      secondaryActive: '#00668c',
      
      success: '#00c9a7',
      warning: '#ffb627',
      error: '#ff6b6b',
      info: '#4fc3f7',
      
      background: '#f0f8ff',
      surface: '#ffffff',
      surfaceHover: '#e6f3ff',
      border: '#b3d9f2',
      
      textPrimary: '#003d5c',
      textSecondary: '#005a8f',
      textMuted: '#7fb3d5',
      
      accent: '#00d4ff',
      highlight: '#cceeff',
    },
  },
  
  // Forest Green Theme (Calm/Natural)
  {
    id: 'forest-green',
    name: 'أخضر الغابة',
    nameEn: 'Forest Green',
    description: 'ثيم أخضر هادئ وطبيعي',
    mode: 'light',
    customizable: true,
    colors: {
      primary: '#2d6a4f',
      primaryHover: '#1b4332',
      primaryActive: '#081c15',
      
      secondary: '#52b788',
      secondaryHover: '#40916c',
      secondaryActive: '#2d6a4f',
      
      success: '#74c69d',
      warning: '#f4a261',
      error: '#e76f51',
      info: '#4a90a4',
      
      background: '#f1faee',
      surface: '#ffffff',
      surfaceHover: '#d8f3dc',
      border: '#95d5b2',
      
      textPrimary: '#081c15',
      textSecondary: '#1b4332',
      textMuted: '#52b788',
      
      accent: '#74c69d',
      highlight: '#d8f3dc',
    },
  },
  
  // Sunset Orange Theme (Warm/Energetic)
  {
    id: 'sunset-orange',
    name: 'برتقالي الغروب',
    nameEn: 'Sunset Orange',
    description: 'ثيم برتقالي دافئ ونشيط',
    mode: 'light',
    customizable: true,
    colors: {
      primary: '#ff6b35',
      primaryHover: '#e55a2b',
      primaryActive: '#cc4921',
      
      secondary: '#f7931e',
      secondaryHover: '#de7f0f',
      secondaryActive: '#c56b00',
      
      success: '#6ab04c',
      warning: '#f9ca24',
      error: '#eb4d4b',
      info: '#4834d4',
      
      background: '#fff8f0',
      surface: '#ffffff',
      surfaceHover: '#ffe8d6',
      border: '#ffd4b3',
      
      textPrimary: '#4a2c2a',
      textSecondary: '#8b4513',
      textMuted: '#cd853f',
      
      accent: '#ffa07a',
      highlight: '#ffe4cc',
    },
  },
  
  // Professional Gray Theme (Corporate/Minimal)
  {
    id: 'professional-gray',
    name: 'رمادي احترافي',
    nameEn: 'Professional Gray',
    description: 'ثيم رمادي احترافي وأنيق',
    mode: 'light',
    customizable: true,
    colors: {
      primary: '#4a5568',
      primaryHover: '#2d3748',
      primaryActive: '#1a202c',
      
      secondary: '#718096',
      secondaryHover: '#4a5568',
      secondaryActive: '#2d3748',
      
      success: '#48bb78',
      warning: '#ed8936',
      error: '#f56565',
      info: '#4299e1',
      
      background: '#f7fafc',
      surface: '#ffffff',
      surfaceHover: '#edf2f7',
      border: '#cbd5e0',
      
      textPrimary: '#1a202c',
      textSecondary: '#2d3748',
      textMuted: '#718096',
      
      accent: '#667eea',
      highlight: '#e6fffa',
    },
  },
  
  // Purple Dream Theme (Creative/Modern)
  {
    id: 'purple-dream',
    name: 'حلم بنفسجي',
    nameEn: 'Purple Dream',
    description: 'ثيم بنفسجي إبداعي وعصري',
    mode: 'dark',
    customizable: true,
    colors: {
      primary: '#9333ea',
      primaryHover: '#7e22ce',
      primaryActive: '#6b21a8',
      
      secondary: '#c084fc',
      secondaryHover: '#a855f7',
      secondaryActive: '#9333ea',
      
      success: '#22c55e',
      warning: '#eab308',
      error: '#ef4444',
      info: '#3b82f6',
      
      background: '#1e1b2e',
      surface: '#2d2640',
      surfaceHover: '#3d3352',
      border: '#4d4064',
      
      textPrimary: '#f3e8ff',
      textSecondary: '#e9d5ff',
      textMuted: '#c4b5fd',
      
      accent: '#d8b4fe',
      highlight: '#4c1d95',
    },
  },
];

// Helper function to get theme by ID
export function getThemeById(id: string): ThemeConfig | undefined {
  return THEME_PRESETS.find(theme => theme.id === id);
}

// Helper function to get themes by mode
export function getThemesByMode(mode: 'light' | 'dark' | 'high-contrast'): ThemeConfig[] {
  return THEME_PRESETS.filter(theme => theme.mode === mode);
}

// Default theme IDs
export const DEFAULT_LIGHT_THEME = 'light';
export const DEFAULT_DARK_THEME = 'dark';
export const DEFAULT_HIGH_CONTRAST_THEME = 'high-contrast';