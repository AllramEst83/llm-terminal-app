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
  userCardBg?: string;
  aiCardBg?: string;
  systemCardBg?: string;
}

export type ThemeName = 
  | 'pastel'
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
    pastel: {
      name: 'Pastel Glow',
      background: '#0F1115',
      text: '#F3F6FC',
      accent: '#8BD4FF',
      prompt: '#9BE8CF',
      headerBg: '#181D25',
      headerText: '#F7FBFF',
      system: '#AFC7FF',
      ai: '#E8B5FF',
      userCardBg: '#1D2C27',
      aiCardBg: '#231A2C',
      systemCardBg: '#1A2433'
    },
    classic: { 
      name: 'Classic', 
      background: '#0B0F0C', 
      text: '#D4FFD9', 
      accent: '#4CFF7A', 
      prompt: '#98FFB3', 
      headerBg: '#132018', 
      headerText: '#E0FFE3', 
      system: '#A4F4C7',
      ai: '#8ADFFF',
      userCardBg: '#14261C',
      aiCardBg: '#142429',
      systemCardBg: '#1A2220'
    },
    amber: { 
      name: 'Amber', 
      background: '#120A04', 
      text: '#FFE5C2', 
      accent: '#FFB347', 
      prompt: '#FFC472', 
      headerBg: '#2A1408', 
      headerText: '#FFEED6', 
      system: '#FFD98E',
      ai: '#FF8F70',
      userCardBg: '#2B1A10',
      aiCardBg: '#2B1410',
      systemCardBg: '#261A0F'
    },
    'mono-blue': { 
      name: 'Monochrome Blue', 
      background: '#040A12', 
      text: '#D4F0FF', 
      accent: '#55C2FF', 
      prompt: '#7FD6FF', 
      headerBg: '#0B1D2D', 
      headerText: '#E6F7FF', 
      system: '#9FD2FF',
      ai: '#6EE7FF',
      userCardBg: '#112535',
      aiCardBg: '#0F2432',
      systemCardBg: '#0F1E32'
    },
    hacker: { 
      name: 'Hacker', 
      background: '#050805', 
      text: '#D8FFDB', 
      accent: '#7CFF8C', 
      prompt: '#A8FFC0', 
      headerBg: '#101810', 
      headerText: '#EBFFEE', 
      system: '#B5FFCD',
      ai: '#7CFFE9',
      userCardBg: '#132417',
      aiCardBg: '#122422',
      systemCardBg: '#112118'
    },
    vt100: { 
      name: 'VT100', 
      background: '#050505', 
      text: '#F5F5F5', 
      accent: '#94F2FF', 
      prompt: '#E2FF94', 
      headerBg: '#1A1A1A', 
      headerText: '#FDFDFD', 
      system: '#C5F36A',
      ai: '#7FE7FF',
      userCardBg: '#131313',
      aiCardBg: '#111A1D',
      systemCardBg: '#171311'
    },
    unicorn: { 
      name: '80s Unicorn', 
      background: '#220022', 
      text: '#FEE5FF', 
      accent: '#FFB3D9', 
      prompt: '#FFCCE9', 
      headerBg: '#2B1C44', 
      headerText: '#FFF3FF', 
      system: '#BDE0FF',
      ai: '#FF9FE5',
      userCardBg: '#361236',
      aiCardBg: '#331636',
      systemCardBg: '#2D1C3E'
    },
    dos: { 
      name: 'DOS', 
      background: '#030356', 
      text: '#F6F6FF', 
      accent: '#92B0FF', 
      prompt: '#FADD5C', 
      headerBg: '#06067A', 
      headerText: '#FFFFFF', 
      system: '#F6E177',
      ai: '#8ED7FF',
      userCardBg: '#11116A',
      aiCardBg: '#0B136C',
      systemCardBg: '#1B1B6D'
    },
    cga: { 
      name: 'CGA', 
      background: '#050505', 
      text: '#E3F9FF', 
      accent: '#FF9BFA', 
      prompt: '#FFB6FF', 
      headerBg: '#1C1C1C', 
      headerText: '#FDF6FF', 
      system: '#FFB0FF',
      ai: '#8BFFB8',
      userCardBg: '#161616',
      aiCardBg: '#132516',
      systemCardBg: '#261427'
    },
    'rose-pine': { 
      name: 'Rosé Pine', 
      background: '#1A1522', 
      text: '#F5EFFC', 
      accent: '#F6B5D4', 
      prompt: '#D9C8FF', 
      headerBg: '#251E34', 
      headerText: '#FCE8F5', 
      system: '#BFD8FF',
      ai: '#FFE39F',
      userCardBg: '#231B31',
      aiCardBg: '#261B2C',
      systemCardBg: '#1F2034'
    },
    'harvest-70s': { 
      name: '70s Harvest', 
      background: '#1F170A', 
      text: '#FFEED1', 
      accent: '#E0A96D', 
      prompt: '#FFCC85', 
      headerBg: '#2A1F12', 
      headerText: '#FFF4DE', 
      system: '#B1E6B1',
      ai: '#FF9BCB',
      userCardBg: '#2E2214',
      aiCardBg: '#2E1A16',
      systemCardBg: '#261F14'
    },
    'neon-80s': { 
      name: '80s Neon', 
      background: '#09060F', 
      text: '#F2E9FF', 
      accent: '#FF8DF2', 
      prompt: '#FFEB77', 
      headerBg: '#140F26', 
      headerText: '#FDF2FF', 
      system: '#A7FFCD',
      ai: '#FF9FD5',
      userCardBg: '#191024',
      aiCardBg: '#1A0F1F',
      systemCardBg: '#101A1B'
    },
    'synthwave-80s': { 
      name: '80s Synthwave', 
      background: '#0A0815', 
      text: '#FFE6FC', 
      accent: '#9B8CFF', 
      prompt: '#FF89CD', 
      headerBg: '#150F2B', 
      headerText: '#F9EAFE', 
      system: '#C7B3FF',
      ai: '#FFD484',
      userCardBg: '#1C1332',
      aiCardBg: '#1B0F28',
      systemCardBg: '#160F2F'
    },
  };

  static readonly DEFAULT_THEME_NAME: ThemeName = 'pastel';

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

