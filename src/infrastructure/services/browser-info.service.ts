import type { BrowserInfo } from '../../domain/entities/browser-info';

export class BrowserInfoService {
  static async getBrowserInfo(): Promise<BrowserInfo> {
    let ipAddress: string | undefined;
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      ipAddress = data.ip;
    } catch (error) {
      console.warn('Failed to fetch IP address:', error);
    }

    const screen = window.screen;
    const navigator = window.navigator;

    return {
      ipAddress,
      language: navigator.language,
      languages: Array.from(navigator.languages || []),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneOffset: new Date().getTimezoneOffset(),
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      screenResolution: `${screen.width}x${screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      colorDepth: screen.colorDepth,
      pixelRatio: window.devicePixelRatio || 1,
      cookieEnabled: navigator.cookieEnabled,
      online: navigator.onLine,
      hardwareConcurrency: navigator.hardwareConcurrency || 0,
      deviceMemory: (navigator as unknown).deviceMemory,
      maxTouchPoints: navigator.maxTouchPoints || 0,
      doNotTrack: navigator.doNotTrack || null,
      vendor: navigator.vendor,
      vendorSub: navigator.vendorSub,
      product: navigator.product,
      productSub: navigator.productSub,
      appName: navigator.appName,
      appVersion: navigator.appVersion,
      appCodeName: navigator.appCodeName,
    };
  }

  static formatBrowserInfo(info: BrowserInfo): string {
    const lines: string[] = [
      '## BROWSER INFORMATION',
      '',
      '### Network',
      `- **IP Address:** ${info.ipAddress || 'Unable to fetch'}`,
      `- **Online Status:** ${info.online ? 'Online' : 'Offline'}`,
      '',
      '### Localization',
      `- **Language:** ${info.language}`,
      `- **Languages:** ${info.languages.join(', ')}`,
      `- **Timezone:** ${info.timezone}`,
      `- **Timezone Offset:** ${info.timezoneOffset} minutes`,
      '',
      '### Display',
      `- **Screen Resolution:** ${info.screenResolution}`,
      `- **Viewport Size:** ${info.viewportSize}`,
      `- **Color Depth:** ${info.colorDepth} bits`,
      `- **Pixel Ratio:** ${info.pixelRatio}`,
      '',
      '### Browser',
      `- **User Agent:** ${info.userAgent}`,
      `- **Platform:** ${info.platform}`,
      `- **Vendor:** ${info.vendor}`,
      `- **App Name:** ${info.appName}`,
      `- **App Version:** ${info.appVersion}`,
      '',
      '### Capabilities',
      `- **Cookies Enabled:** ${info.cookieEnabled ? 'Yes' : 'No'}`,
      `- **Max Touch Points:** ${info.maxTouchPoints}`,
      `- **Do Not Track:** ${info.doNotTrack || 'Not set'}`,
      '',
      '### Hardware',
      `- **CPU Cores:** ${info.hardwareConcurrency}`,
    ];

    if (info.deviceMemory) {
      lines.push(`- **Device Memory:** ${info.deviceMemory} GB`);
    }

    return lines.join('\n');
  }
}

