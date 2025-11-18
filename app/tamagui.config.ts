import { createTamagui } from 'tamagui'
import { defaultConfig } from '@tamagui/config/v4'

// Psychologically designed gaming colors - elegant, addictive, premium feel
const gamingColors = {
  // Deep luxurious purples - evoke mystery, premium, sophistication
  royalPurple: '#6B46C1',
  royalPurple2: '#7C3AED',
  royalPurple3: '#8B5CF6',
  deepPurple: '#553C9A',
  darkPurple: '#44337A',
  
  // Rich emerald greens - success, winning, growth
  emerald: '#10B981',
  emerald2: '#34D399',
  deepEmerald: '#059669',
  darkEmerald: '#047857',
  
  // Warm gold accents - luxury, rewards, achievement
  gold: '#F59E0B',
  gold2: '#FBBF24',
  richGold: '#D97706',
  deepGold: '#B45309',
  
  // Crimson reds - excitement, energy, high stakes
  crimson: '#DC2626',
  crimson2: '#F87171',
  deepCrimson: '#B91C1C',
  darkCrimson: '#991B1B',
  
  // Electric blues - trust, focus, calm confidence
  electric: '#3B82F6',
  electric2: '#60A5FA',
  deepElectric: '#2563EB',
  darkElectric: '#1D4ED8',
  
  // Sophisticated neutrals - balance, elegance
  slate: '#1E293B',
  deepSlate: '#0F172A',
  charcoal: '#111827',
  silver: '#94A3B8',
  pearl: '#F1F5F9',
  white: '#FFFFFF',
}

export const config = createTamagui({
  ...defaultConfig,
  themes: {
    light: {
      background: gamingColors.pearl,
      backgroundHover: '#E2E8F0',
      backgroundPress: '#CBD5E1',
      backgroundFocus: gamingColors.pearl,
      backgroundStrong: gamingColors.white,
      backgroundTransparent: 'rgba(255,255,255,0)',
      color: gamingColors.charcoal,
      colorHover: gamingColors.slate,
      colorPress: gamingColors.deepSlate,
      colorFocus: gamingColors.charcoal,
      colorTransparent: 'rgba(17,24,39,0)',
      borderColor: '#E2E8F0',
      borderColorHover: gamingColors.silver,
      borderColorFocus: gamingColors.royalPurple,
      borderColorPress: gamingColors.deepPurple,
      placeholderColor: gamingColors.silver,
      primary: gamingColors.royalPurple,
      secondary: gamingColors.emerald,
      accent: gamingColors.gold,
      success: gamingColors.emerald,
      warning: gamingColors.gold,
      error: gamingColors.crimson,
      info: gamingColors.electric,
    },
    dark: {
      background: gamingColors.deepSlate,
      backgroundHover: gamingColors.slate,
      backgroundPress: '#334155',
      backgroundFocus: gamingColors.deepSlate,
      backgroundStrong: gamingColors.charcoal,
      backgroundTransparent: 'rgba(15,23,42,0)',
      color: gamingColors.pearl,
      colorHover: gamingColors.white,
      colorPress: gamingColors.silver,
      colorFocus: gamingColors.pearl,
      colorTransparent: 'rgba(241,245,249,0)',
      borderColor: '#334155',
      borderColorHover: '#475569',
      borderColorFocus: gamingColors.royalPurple,
      borderColorPress: gamingColors.deepPurple,
      placeholderColor: '#64748B',
      primary: gamingColors.royalPurple3,
      secondary: gamingColors.emerald2,
      accent: gamingColors.gold2,
      success: gamingColors.emerald2,
      warning: gamingColors.gold2,
      error: gamingColors.crimson2,
      info: gamingColors.electric2,
    },
  },
})

export default config

export type Conf = typeof config

declare module 'tamagui' {
  interface TamaguiCustomConfig extends Conf {}
}
