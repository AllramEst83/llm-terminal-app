export function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result 
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '0, 255, 65'; // Default to classic green
}

export function applyThemeToDocument(theme: { accent: string; headerBg: string }): void {
  document.documentElement.style.setProperty('--scrollbar-thumb-color', theme.accent);
  document.documentElement.style.setProperty('--scrollbar-track-color', theme.headerBg);
  document.documentElement.style.setProperty('--crt-glow-rgb', hexToRgb(theme.accent));
}

