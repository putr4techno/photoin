import { ColorThemeKey } from '../types';

export interface ThemeConfig {
  key: ColorThemeKey;
  name: string;
  previewHex: string;
  accentHex: string;
  textAccent: string;
  textHeading: string;
  borderAccent: string;
  borderSubtle: string;
  bgBadge: string;
  buttonGradient: string;
  buttonText: string;
  shadowGlow: string;
  glowBg: string;
}

export const THEMES: Record<ColorThemeKey, ThemeConfig> = {
  gold: {
    key: 'gold',
    name: 'Royal Gold (Emas Mewah)',
    previewHex: '#d4af37',
    accentHex: '#d4af37',
    textAccent: 'text-amber-300',
    textHeading: 'from-amber-100 via-yellow-200 to-amber-300',
    borderAccent: 'border-amber-500/40',
    borderSubtle: 'border-amber-500/20',
    bgBadge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    buttonGradient: 'from-amber-500 via-yellow-400 to-amber-600',
    buttonText: 'text-slate-950',
    shadowGlow: 'shadow-amber-500/25',
    glowBg: 'bg-amber-500/10',
  },
  rose: {
    key: 'rose',
    name: 'Rose Gold & Blush',
    previewHex: '#fb7185',
    accentHex: '#f43f5e',
    textAccent: 'text-rose-300',
    textHeading: 'from-rose-100 via-pink-200 to-rose-300',
    borderAccent: 'border-rose-500/40',
    borderSubtle: 'border-rose-500/20',
    bgBadge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    buttonGradient: 'from-rose-500 via-pink-400 to-rose-600',
    buttonText: 'text-white',
    shadowGlow: 'shadow-rose-500/25',
    glowBg: 'bg-rose-500/10',
  },
  emerald: {
    key: 'emerald',
    name: 'Emerald Luxury (Hijau Zamrud)',
    previewHex: '#10b981',
    accentHex: '#10b981',
    textAccent: 'text-emerald-300',
    textHeading: 'from-emerald-100 via-teal-200 to-emerald-300',
    borderAccent: 'border-emerald-500/40',
    borderSubtle: 'border-emerald-500/20',
    bgBadge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    buttonGradient: 'from-emerald-500 via-teal-400 to-emerald-600',
    buttonText: 'text-slate-950',
    shadowGlow: 'shadow-emerald-500/25',
    glowBg: 'bg-emerald-500/10',
  },
  sapphire: {
    key: 'sapphire',
    name: 'Midnight Sapphire (Biru Safir)',
    previewHex: '#3b82f6',
    accentHex: '#3b82f6',
    textAccent: 'text-blue-300',
    textHeading: 'from-blue-100 via-sky-200 to-blue-300',
    borderAccent: 'border-blue-500/40',
    borderSubtle: 'border-blue-500/20',
    bgBadge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    buttonGradient: 'from-blue-500 via-sky-400 to-blue-600',
    buttonText: 'text-white',
    shadowGlow: 'shadow-blue-500/25',
    glowBg: 'bg-blue-500/10',
  },
  purple: {
    key: 'purple',
    name: 'Amethyst Lavender (Ungu Glamour)',
    previewHex: '#c084fc',
    accentHex: '#a855f7',
    textAccent: 'text-purple-300',
    textHeading: 'from-purple-100 via-fuchsia-200 to-purple-300',
    borderAccent: 'border-purple-500/40',
    borderSubtle: 'border-purple-500/20',
    bgBadge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    buttonGradient: 'from-purple-500 via-fuchsia-400 to-purple-600',
    buttonText: 'text-white',
    shadowGlow: 'shadow-purple-500/25',
    glowBg: 'bg-purple-500/10',
  },
  ruby: {
    key: 'ruby',
    name: 'Ruby Romance (Merah Delima)',
    previewHex: '#f43f5e',
    accentHex: '#e11d48',
    textAccent: 'text-red-300',
    textHeading: 'from-red-100 via-rose-200 to-red-300',
    borderAccent: 'border-red-500/40',
    borderSubtle: 'border-red-500/20',
    bgBadge: 'bg-red-500/20 text-red-300 border-red-500/30',
    buttonGradient: 'from-red-600 via-rose-500 to-red-700',
    buttonText: 'text-white',
    shadowGlow: 'shadow-red-500/25',
    glowBg: 'bg-red-500/10',
  },
  silver: {
    key: 'silver',
    name: 'Silver Monochrome (Perak Modern)',
    previewHex: '#cbd5e1',
    accentHex: '#94a3b8',
    textAccent: 'text-slate-200',
    textHeading: 'from-slate-100 via-gray-200 to-slate-300',
    borderAccent: 'border-slate-400/40',
    borderSubtle: 'border-slate-500/20',
    bgBadge: 'bg-slate-400/20 text-slate-200 border-slate-400/30',
    buttonGradient: 'from-slate-300 via-white to-slate-400',
    buttonText: 'text-slate-950',
    shadowGlow: 'shadow-slate-400/25',
    glowBg: 'bg-slate-400/10',
  },
};

export function getTheme(key?: ColorThemeKey): ThemeConfig {
  if (!key || !THEMES[key]) return THEMES.gold;
  return THEMES[key];
}
