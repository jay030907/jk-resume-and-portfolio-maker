import type { CSSProperties } from 'react';
import {
  AccentColor,
  FontStyleId,
  PortfolioTheme,
  WallpaperPreset,
} from '../types/portfolio';
import { FONT_STYLE_OPTIONS } from '../data/presets';
import { sanitizeUrl } from './exportHtml';

const ACCENT_RGB: Record<AccentColor, string> = {
  blue: '37, 99, 235',
  emerald: '5, 150, 105',
  rose: '225, 29, 72',
  amber: '217, 119, 6',
  slate: '15, 23, 42',
};

export function getFontConfig(fontStyle: FontStyleId = 'jakarta') {
  return FONT_STYLE_OPTIONS.find((f) => f.id === fontStyle) || FONT_STYLE_OPTIONS[0];
}

export function getPortfolioWallpaperStyle(
  theme: PortfolioTheme,
  wallpaper: WallpaperPreset = 'clean',
  customWallpaperUrl?: string,
  accentColor: AccentColor = 'blue'
): CSSProperties {
  const isDark = theme === 'monograph';
  const isPaper = theme === 'paper';
  const rgb = ACCENT_RGB[accentColor] || ACCENT_RGB.blue;

  if (wallpaper === 'custom' && customWallpaperUrl) {
    const safeImg = sanitizeUrl(customWallpaperUrl, true);
    if (safeImg && safeImg !== '#') {
      const scrim = isDark
        ? 'rgba(5, 5, 7, 0.78)'
        : isPaper
          ? 'rgba(250, 248, 245, 0.85)'
          : 'rgba(255, 255, 255, 0.84)';
      return {
        backgroundImage: `linear-gradient(${scrim}, ${scrim}), url("${safeImg}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    }
  }

  switch (wallpaper) {
    case 'blueprint': {
      const line = isDark
        ? 'rgba(255, 255, 255, 0.06)'
        : `rgba(${rgb}, 0.08)`;
      return {
        backgroundImage: `linear-gradient(to right, ${line} 1px, transparent 1px), linear-gradient(to bottom, ${line} 1px, transparent 1px)`,
        backgroundSize: '32px 32px',
      };
    }
    case 'studio-gradient': {
      const glowA = isDark ? `rgba(${rgb}, 0.22)` : `rgba(${rgb}, 0.12)`;
      const glowB = isDark ? 'rgba(148, 163, 184, 0.08)' : `rgba(${rgb}, 0.05)`;
      return {
        backgroundImage: `radial-gradient(circle at 12% 8%, ${glowA} 0%, transparent 48%), radial-gradient(circle at 88% 28%, ${glowB} 0%, transparent 45%)`,
      };
    }
    case 'contour': {
      const dot = isDark
        ? 'rgba(255, 255, 255, 0.11)'
        : isPaper
          ? 'rgba(87, 83, 78, 0.14)'
          : 'rgba(15, 23, 42, 0.11)';
      return {
        backgroundImage: `radial-gradient(${dot} 1.15px, transparent 1.15px)`,
        backgroundSize: '20px 20px',
      };
    }
    case 'warm-linen': {
      const thread = isDark
        ? 'rgba(255, 255, 255, 0.04)'
        : 'rgba(120, 113, 108, 0.07)';
      return {
        backgroundImage: `repeating-linear-gradient(45deg, ${thread} 0px, ${thread} 1px, transparent 1px, transparent 10px)`,
      };
    }
    case 'obsidian-mesh': {
      const meshA = isDark ? 'rgba(16, 185, 129, 0.16)' : `rgba(${rgb}, 0.14)`;
      const meshB = isDark ? 'rgba(59, 130, 246, 0.18)' : 'rgba(99, 102, 241, 0.10)';
      const meshC = isDark ? 'rgba(244, 63, 94, 0.10)' : 'rgba(14, 165, 233, 0.08)';
      return {
        backgroundImage: `radial-gradient(at 15% 15%, ${meshA} 0px, transparent 50%), radial-gradient(at 85% 20%, ${meshB} 0px, transparent 50%), radial-gradient(at 50% 85%, ${meshC} 0px, transparent 55%)`,
      };
    }
    case 'clean':
    default:
      return {};
  }
}

export function buildWallpaperCssRule(
  theme: PortfolioTheme,
  wallpaper: WallpaperPreset = 'clean',
  customWallpaperUrl?: string,
  accentColor: AccentColor = 'blue'
): string {
  const style = getPortfolioWallpaperStyle(theme, wallpaper, customWallpaperUrl, accentColor);
  const parts: string[] = [];
  if (style.backgroundImage) parts.push(`background-image: ${style.backgroundImage};`);
  if (style.backgroundSize) parts.push(`background-size: ${style.backgroundSize};`);
  if (style.backgroundPosition) parts.push(`background-position: ${style.backgroundPosition};`);
  return parts.join('\n      ');
}
