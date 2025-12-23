import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { ThemeConfig, ThemeContextType } from '../shared/types/theme.types';
import { THEME_PRESETS, DEFAULT_LIGHT_THEME, DEFAULT_DARK_THEME } from '../shared/constants/themePresets';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const CUSTOM_THEMES_KEY = 'customThemes';
const CURRENT_THEME_KEY = 'currentThemeId';
const AUTO_THEME_KEY = 'autoTheme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Load custom themes from localStorage
  const [customThemes, setCustomThemes] = useState<ThemeConfig[]>(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_THEMES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Auto theme state
  const [autoTheme, setAutoThemeState] = useState(() => {
    return localStorage.getItem(AUTO_THEME_KEY) === 'true';
  });

  // Current theme state
  const [currentTheme, setCurrentThemeState] = useState<ThemeConfig>(() => {
    // Check if auto theme is enabled
    if (localStorage.getItem(AUTO_THEME_KEY) === 'true') {
      const hour = new Date().getHours();
      const themeId = (hour >= 18 || hour < 6) ? DEFAULT_DARK_THEME : DEFAULT_LIGHT_THEME;
      return THEME_PRESETS.find(t => t.id === themeId) || THEME_PRESETS[0];
    }

    // Check localStorage for saved theme
    const savedThemeId = localStorage.getItem(CURRENT_THEME_KEY);
    if (savedThemeId) {
      // Check in presets first
      const preset = THEME_PRESETS.find(t => t.id === savedThemeId);
      if (preset) return preset;
      
      // Check in custom themes
      const saved = localStorage.getItem(CUSTOM_THEMES_KEY);
      if (saved) {
        const customs: ThemeConfig[] = JSON.parse(saved);
        const custom = customs.find(t => t.id === savedThemeId);
        if (custom) return custom;
      }
    }
    
    // Check system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return THEME_PRESETS.find(t => t.id === DEFAULT_DARK_THEME) || THEME_PRESETS[1];
    }
    
    // Default to light theme
    return THEME_PRESETS[0];
  });

  // Apply theme to DOM
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    
    // Add smooth transition
    body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
    
    // Apply theme mode class
    body.classList.remove('dark', 'high-contrast');
    if (currentTheme.mode === 'dark') {
      body.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else if (currentTheme.mode === 'high-contrast') {
      body.classList.add('high-contrast');
      root.style.colorScheme = 'light';
    } else {
      root.style.colorScheme = 'light';
    }
    
    // Apply CSS variables for colors
    const colors = currentTheme.colors;
    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-primary-hover', colors.primaryHover);
    root.style.setProperty('--color-primary-active', colors.primaryActive);
    
    root.style.setProperty('--color-secondary', colors.secondary);
    root.style.setProperty('--color-secondary-hover', colors.secondaryHover);
    root.style.setProperty('--color-secondary-active', colors.secondaryActive);
    
    root.style.setProperty('--color-success', colors.success);
    root.style.setProperty('--color-warning', colors.warning);
    root.style.setProperty('--color-error', colors.error);
    root.style.setProperty('--color-info', colors.info);
    
    root.style.setProperty('--color-background', colors.background);
    root.style.setProperty('--color-surface', colors.surface);
    root.style.setProperty('--color-surface-hover', colors.surfaceHover);
    root.style.setProperty('--color-border', colors.border);
    
    root.style.setProperty('--color-text-primary', colors.textPrimary);
    root.style.setProperty('--color-text-secondary', colors.textSecondary);
    root.style.setProperty('--color-text-muted', colors.textMuted);
    
    root.style.setProperty('--color-accent', colors.accent);
    root.style.setProperty('--color-highlight', colors.highlight);
    
    // Save to localStorage if not auto theme
    if (!autoTheme) {
      localStorage.setItem(CURRENT_THEME_KEY, currentTheme.id);
    }
  }, [currentTheme, autoTheme]);

  // Auto theme effect
  useEffect(() => {
    if (!autoTheme) return;

    const updateTheme = () => {
      const hour = new Date().getHours();
      const themeId = (hour >= 18 || hour < 6) ? DEFAULT_DARK_THEME : DEFAULT_LIGHT_THEME;
      const theme = THEME_PRESETS.find(t => t.id === themeId);
      if (theme) {
        setCurrentThemeState(theme);
      }
    };

    // Update immediately
    updateTheme();

    // Check every hour
    const interval = setInterval(updateTheme, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [autoTheme]);

  // Set theme by ID
  const setTheme = (themeId: string) => {
    setAutoThemeState(false);
    localStorage.setItem(AUTO_THEME_KEY, 'false');
    
    // Find in presets
    let theme = THEME_PRESETS.find(t => t.id === themeId);
    
    // Find in custom themes
    if (!theme) {
      theme = customThemes.find(t => t.id === themeId);
    }
    
    if (theme) {
      setCurrentThemeState(theme);
    }
  };

  // Set custom theme directly
  const setCustomTheme = (theme: ThemeConfig) => {
    setAutoThemeState(false);
    localStorage.setItem(AUTO_THEME_KEY, 'false');
    setCurrentThemeState(theme);
  };

  // Legacy toggle theme (for backward compatibility)
  const toggleTheme = () => {
    setAutoThemeState(false);
    localStorage.setItem(AUTO_THEME_KEY, 'false');
    
    const newThemeId = currentTheme.mode === 'light' ? DEFAULT_DARK_THEME : DEFAULT_LIGHT_THEME;
    const theme = THEME_PRESETS.find(t => t.id === newThemeId);
    if (theme) {
      setCurrentThemeState(theme);
    }
  };

  // Set auto theme
  const setAutoTheme = (enabled: boolean) => {
    setAutoThemeState(enabled);
    localStorage.setItem(AUTO_THEME_KEY, enabled.toString());
    
    if (enabled) {
      const hour = new Date().getHours();
      const themeId = (hour >= 18 || hour < 6) ? DEFAULT_DARK_THEME : DEFAULT_LIGHT_THEME;
      const theme = THEME_PRESETS.find(t => t.id === themeId);
      if (theme) {
        setCurrentThemeState(theme);
      }
    }
  };

  // Save custom theme
  const saveCustomTheme = async (theme: ThemeConfig) => {
    const updatedCustomThemes = [...customThemes.filter(t => t.id !== theme.id), theme];
    setCustomThemes(updatedCustomThemes);
    localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(updatedCustomThemes));
    
    // Set as current theme
    setCurrentThemeState(theme);
  };

  // Delete custom theme
  const deleteCustomTheme = async (themeId: string) => {
    const updatedCustomThemes = customThemes.filter(t => t.id !== themeId);
    setCustomThemes(updatedCustomThemes);
    localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(updatedCustomThemes));
    
    // If deleted theme was current, switch to default
    if (currentTheme.id === themeId) {
      setCurrentThemeState(THEME_PRESETS[0]);
    }
  };

  // Export theme
  const exportTheme = async (themeId: string) => {
    const theme = [...THEME_PRESETS, ...customThemes].find(t => t.id === themeId);
    if (!theme) return;
    
    const exportData = {
      version: '1.0',
      theme,
      exportedAt: Date.now(),
      exportedBy: 'Dental Lab Management System',
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `theme-${theme.id}-${Date.now()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  // Import theme
  const importTheme = async (filePath: string) => {
    // This would be implemented with file picker
    // For now, we'll use a file input
    console.log('Import theme from:', filePath);
  };

  const value: ThemeContextType = {
    currentTheme,
    setTheme,
    setCustomTheme,
    theme: currentTheme.mode === 'dark' ? 'dark' : 'light', // Legacy support
    toggleTheme,
    autoTheme,
    setAutoTheme,
    availableThemes: THEME_PRESETS,
    customThemes,
    saveCustomTheme,
    deleteCustomTheme,
    exportTheme,
    importTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}