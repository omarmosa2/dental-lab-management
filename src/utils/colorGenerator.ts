/**
 * Advanced Color Generator
 * Generates complete theme palettes from base colors
 */

export interface HSL {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
}

export interface RGB {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
}

/**
 * Convert HEX to RGB
 */
export function hexToRgb(hex: string): RGB {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    throw new Error('Invalid hex color');
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

/**
 * Convert RGB to HEX
 */
export function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => {
    const hex = Math.round(n).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

/**
 * Convert RGB to HSL
 */
export function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Convert HSL to RGB
 */
export function hslToRgb(hsl: HSL): RGB {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

/**
 * Convert HEX to HSL
 */
export function hexToHsl(hex: string): HSL {
  return rgbToHsl(hexToRgb(hex));
}

/**
 * Convert HSL to HEX
 */
export function hslToHex(hsl: HSL): string {
  return rgbToHex(hslToRgb(hsl));
}

/**
 * Adjust lightness of a color
 */
export function adjustLightness(hex: string, amount: number): string {
  const hsl = hexToHsl(hex);
  hsl.l = Math.max(0, Math.min(100, hsl.l + amount));
  return hslToHex(hsl);
}

/**
 * Adjust saturation of a color
 */
export function adjustSaturation(hex: string, amount: number): string {
  const hsl = hexToHsl(hex);
  hsl.s = Math.max(0, Math.min(100, hsl.s + amount));
  return hslToHex(hsl);
}

/**
 * Get luminance of a color (0-1)
 */
export function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(val => {
    const v = val / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Get contrast ratio between two colors
 */
export function getContrastRatio(color1: string, color2: string): number {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if color is dark
 */
export function isDark(hex: string): boolean {
  return getLuminance(hex) < 0.5;
}

/**
 * Generate hover state color
 */
export function generateHoverColor(hex: string, mode: 'light' | 'dark'): string {
  if (mode === 'light') {
    return adjustLightness(hex, -10);
  } else {
    return adjustLightness(hex, 10);
  }
}

/**
 * Generate active state color
 */
export function generateActiveColor(hex: string, mode: 'light' | 'dark'): string {
  if (mode === 'light') {
    return adjustLightness(hex, -20);
  } else {
    return adjustLightness(hex, 20);
  }
}

/**
 * Generate text color based on background
 */
export function generateTextColor(backgroundColor: string): string {
  return isDark(backgroundColor) ? '#f1f5f9' : '#111827';
}

/**
 * Generate secondary text color
 */
export function generateSecondaryTextColor(backgroundColor: string): string {
  return isDark(backgroundColor) ? '#cbd5e1' : '#4b5563';
}

/**
 * Generate muted text color
 */
export function generateMutedTextColor(backgroundColor: string): string {
  return isDark(backgroundColor) ? '#64748b' : '#9ca3af';
}

/**
 * Generate surface color from background
 */
export function generateSurfaceColor(backgroundColor: string, mode: 'light' | 'dark'): string {
  if (mode === 'light') {
    return adjustLightness(backgroundColor, 5);
  } else {
    return adjustLightness(backgroundColor, 10);
  }
}

/**
 * Generate border color
 */
export function generateBorderColor(backgroundColor: string, mode: 'light' | 'dark'): string {
  if (mode === 'light') {
    return adjustLightness(backgroundColor, -10);
  } else {
    return adjustLightness(backgroundColor, 20);
  }
}

/**
 * Generate complete theme colors from base colors
 */
export interface ThemeGeneratorInput {
  primary: string;
  secondary: string;
  background: string;
  mode: 'light' | 'dark';
}

export interface GeneratedThemeColors {
  primary: string;
  primaryHover: string;
  primaryActive: string;
  
  secondary: string;
  secondaryHover: string;
  secondaryActive: string;
  
  success: string;
  warning: string;
  error: string;
  info: string;
  
  background: string;
  surface: string;
  surfaceHover: string;
  border: string;
  
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  
  accent: string;
  highlight: string;
}

export function generateThemeColors(input: ThemeGeneratorInput): GeneratedThemeColors {
  const { primary, secondary, background, mode } = input;
  
  // Generate primary variations
  const primaryHover = generateHoverColor(primary, mode);
  const primaryActive = generateActiveColor(primary, mode);
  
  // Generate secondary variations
  const secondaryHover = generateHoverColor(secondary, mode);
  const secondaryActive = generateActiveColor(secondary, mode);
  
  // Generate status colors based on mode
  const success = mode === 'light' ? '#10b981' : '#22c55e';
  const warning = mode === 'light' ? '#f59e0b' : '#eab308';
  const error = mode === 'light' ? '#ef4444' : '#f87171';
  const info = mode === 'light' ? '#3b82f6' : '#60a5fa';
  
  // Generate surface and border
  const surface = generateSurfaceColor(background, mode);
  const surfaceHover = mode === 'light' 
    ? adjustLightness(surface, -5)
    : adjustLightness(surface, 10);
  const border = generateBorderColor(background, mode);
  
  // Generate text colors
  const textPrimary = generateTextColor(background);
  const textSecondary = generateSecondaryTextColor(background);
  const textMuted = generateMutedTextColor(background);
  
  // Generate accent and highlight
  const accent = adjustLightness(secondary, mode === 'light' ? 10 : -10);
  const highlight = mode === 'light'
    ? adjustLightness(primary, 40)
    : adjustLightness(primary, -30);
  
  return {
    primary,
    primaryHover,
    primaryActive,
    
    secondary,
    secondaryHover,
    secondaryActive,
    
    success,
    warning,
    error,
    info,
    
    background,
    surface,
    surfaceHover,
    border,
    
    textPrimary,
    textSecondary,
    textMuted,
    
    accent,
    highlight,
  };
}

/**
 * Convert light theme to dark theme
 */
export function convertToDarkTheme(lightColors: GeneratedThemeColors): GeneratedThemeColors {
  // Use the primary and secondary from light theme
  const primary = lightColors.primary;
  const secondary = lightColors.secondary;
  
  // Generate dark background
  const background = '#0f172a';
  
  return generateThemeColors({
    primary,
    secondary,
    background,
    mode: 'dark',
  });
}

/**
 * Convert dark theme to light theme
 */
export function convertToLightTheme(darkColors: GeneratedThemeColors): GeneratedThemeColors {
  // Use the primary and secondary from dark theme
  const primary = darkColors.primary;
  const secondary = darkColors.secondary;
  
  // Generate light background
  const background = '#f9fafb';
  
  return generateThemeColors({
    primary,
    secondary,
    background,
    mode: 'light',
  });
}