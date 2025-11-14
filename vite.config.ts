import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';

export default defineConfig(({ mode, command }) => {
    const env = loadEnv(mode, '.', '');
    
    // Increment version on production builds before reading it
    const isProductionBuild = command === 'build' || process.env.NODE_ENV === 'production';
    if (isProductionBuild) {
      try {
        const versionPath = path.resolve(__dirname, 'version.json');
        if (fs.existsSync(versionPath)) {
          const versionData = JSON.parse(fs.readFileSync(versionPath, 'utf-8'));
          // Increment build number
          versionData.build = (versionData.build || 0) + 1;
          // Write back to file
          fs.writeFileSync(versionPath, JSON.stringify(versionData, null, 2) + '\n');
          console.log(`Version: ${versionData.version} (Build ${versionData.build})`);
        }
      } catch (error) {
        console.warn('Could not read/update version.json:', error);
      }
    }
    
    // Read version info (after incrementing if production build)
    let appVersion = '1.0.0';
    let buildNumber = 1;
    try {
      const versionPath = path.resolve(__dirname, 'version.json');
      if (fs.existsSync(versionPath)) {
        const versionData = JSON.parse(fs.readFileSync(versionPath, 'utf-8'));
        appVersion = versionData.version || appVersion;
        buildNumber = versionData.build || buildNumber;
      }
    } catch (error) {
      console.warn('Could not read version.json:', error);
    }
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'import.meta.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion),
        'import.meta.env.VITE_APP_BUILD': JSON.stringify(buildNumber.toString())
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
