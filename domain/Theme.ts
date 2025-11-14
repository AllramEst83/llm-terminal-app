export interface ThemeColors {
  name: string;
  background: string;
  text: string;
  accent: string;
  prompt: string;
  headerBg: string;
  headerText: string;
  system: string;
  ai: string;
}

export type ThemeName = 
  | 'classic' 
  | 'amber' 
  | 'mono-blue' 
  | 'hacker' 
  | 'vt100' 
  | 'unicorn' 
  | 'dos' 
  | 'cga' 
  | 'rose-pine'
  | 'harvest-70s'
  | 'neon-80s'
  | 'synthwave-80s';

export class Theme {
  private static readonly THEMES: Record<ThemeName, ThemeColors> = {
    classic: { 
      name: 'Classic', 
      background: '#0D0D0D', 
      text: '#00FF41', 
      accent: '#00A800', 
      prompt: '#00A800', 
      headerBg: '#4A4A4A', 
      headerText: '#00FF41', 
      system: '#00FF41',
      ai: '#00FFFF' 
    },
    amber: { 
      name: 'Amber', 
      background: '#1A0B00', 
      text: '#FFB000', 
      accent: '#FFB000', 
      prompt: '#FFB000', 
      headerBg: '#4A2B00', 
      headerText: '#FFD061', 
      system: '#FFB000',
      ai: '#FF4500' 
    },
    'mono-blue': { 
      name: 'Monochrome Blue', 
      background: '#000D1A', 
      text: '#00BFFF', 
      accent: '#00BFFF', 
      prompt: '#00BFFF', 
      headerBg: '#002C4A', 
      headerText: '#61D9FF', 
      system: '#00BFFF',
      ai: '#00FFFF' 
    },
    hacker: { 
      name: 'Hacker', 
      background: '#000000', 
      text: '#39FF14', 
      accent: '#39FF14', 
      prompt: '#39FF14', 
      headerBg: '#333333', 
      headerText: '#39FF14', 
      system: '#39FF14',
      ai: '#00FFFF' 
    },
    vt100: { 
      name: 'VT100', 
      background: '#000000', 
      text: '#FFFFFF', 
      accent: '#CCCCCC', 
      prompt: '#FFFFFF', 
      headerBg: '#4A4A4A', 
      headerText: '#FFFFFF', 
      system: '#FFFFFF',
      ai: '#00FFFF' 
    },
    unicorn: { 
      name: '80s Unicorn', 
      background: '#2c002c', 
      text: '#ff79c6', 
      accent: '#8be9fd', 
      prompt: '#ff79c6', 
      headerBg: '#1d1f4d', 
      headerText: '#f1fa8c', 
      system: '#8be9fd',
      ai: '#FF79C6' 
    },
    dos: { 
      name: 'DOS', 
      background: '#0000A8', 
      text: '#FFFFFF', 
      accent: '#CCCCCC', 
      prompt: '#FFFF00', 
      headerBg: '#000080', 
      headerText: '#FFFFFF', 
      system: '#FFFF00',
      ai: '#00FFFF' 
    },
    cga: { 
      name: 'CGA', 
      background: '#000000', 
      text: '#55FFFF', 
      accent: '#FF55FF', 
      prompt: '#FFFFFF', 
      headerBg: '#555555', 
      headerText: '#FFFFFF', 
      system: '#FF55FF',
      ai: '#55FF55' 
    },
    'rose-pine': { 
      name: 'Rosé Pine', 
      background: '#191724', 
      text: '#e0def4', 
      accent: '#eb6f92', 
      prompt: '#c4a7e7', 
      headerBg: '#26233a', 
      headerText: '#f0c6c6', 
      system: '#9ccfd8',
      ai: '#FFD700' 
    },
    'harvest-70s': { 
      name: '70s Harvest', 
      background: '#2A1F0A', 
      text: '#D4AF37', 
      accent: '#8B6914', 
      prompt: '#FFA500', 
      headerBg: '#4A3A1A', 
      headerText: '#FFD700', 
      system: '#90EE90',
      ai: '#FF1493' 
    },
    'neon-80s': { 
      name: '80s Neon', 
      background: '#0A0A0A', 
      text: '#00FFFF', 
      accent: '#FF00FF', 
      prompt: '#FFFF00', 
      headerBg: '#1A0A2A', 
      headerText: '#FF00FF', 
      system: '#00FF00',
      ai: '#FF1493' 
    },
    'synthwave-80s': { 
      name: '80s Synthwave', 
      background: '#0D0221', 
      text: '#FF006E', 
      accent: '#00F5FF', 
      prompt: '#FF006E', 
      headerBg: '#1A0B3A', 
      headerText: '#00F5FF', 
      system: '#8338EC',
      ai: '#FFBE0B' 
    },
  };

  static readonly DEFAULT_THEME_NAME: ThemeName = 'classic';

  static getAllThemes(): Record<ThemeName, ThemeColors> {
    return { ...this.THEMES };
  }

  static getTheme(name: ThemeName): ThemeColors {
    return this.THEMES[name] || this.THEMES[this.DEFAULT_THEME_NAME];
  }

  static getDefaultTheme(): ThemeColors {
    return this.THEMES[this.DEFAULT_THEME_NAME];
  }

  static isValidThemeName(name: string): name is ThemeName {
    return name in this.THEMES;
  }

  static getThemeNames(): ThemeName[] {
    return Object.keys(this.THEMES) as ThemeName[];
  }
}

