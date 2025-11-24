export interface BrowserInfo {
  ipAddress?: string;
  language: string;
  languages: string[];
  timezone: string;
  timezoneOffset: number;
  userAgent: string;
  platform: string;
  screenResolution: string;
  viewportSize: string;
  colorDepth: number;
  pixelRatio: number;
  cookieEnabled: boolean;
  online: boolean;
  hardwareConcurrency: number;
  deviceMemory?: number;
  maxTouchPoints: number;
  doNotTrack: string | null;
  vendor: string;
  vendorSub: string;
  product: string;
  productSub: string;
  appName: string;
  appVersion: string;
  appCodeName: string;
}

