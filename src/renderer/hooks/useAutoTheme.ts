import { useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * Hook to automatically switch theme based on time of day
 * @param enabled - Whether auto theme is enabled
 */
export function useAutoTheme(enabled: boolean) {
  const { setTheme } = useTheme();

  useEffect(() => {
    if (!enabled) return;

    const updateTheme = () => {
      const hour = new Date().getHours();
      
      // Dark mode from 6 PM to 6 AM
      if (hour >= 18 || hour < 6) {
        setTheme('dark');
      } else {
        setTheme('light');
      }
    };

    // Update immediately
    updateTheme();

    // Check every hour
    const interval = setInterval(updateTheme, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [enabled, setTheme]);
}