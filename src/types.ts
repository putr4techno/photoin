export type ColorThemeKey = 'gold' | 'rose' | 'emerald' | 'sapphire' | 'purple' | 'ruby' | 'silver';

export interface EventConfig {
  category: string;
  title: string;
  date: string;
  quote: string;
  vendorName: string;
  bannerUrl: string;
  logoUrl?: string;
  themeColor: ColorThemeKey;
  adminPin: string;
  clientPin: string;
  autoUploadDrive: boolean;
  driveUploadMethod: 'oauth' | 'apps_script';
  appsScriptUrl?: string;
  driveFolderId?: string;
  driveFolderName: string;
}

export type AdminRole = 'super' | 'client';

export type FrameTheme = 'floral' | 'polaroid' | 'celebration' | 'custom';

export interface FrameTemplate {
  id: string;
  name: string;
  theme: FrameTheme;
  description: string;
  badge: string;
  enabled: boolean;
  aspectRatio: '4:5' | '9:16' | '1:1';
  primaryColor: string;
  secondaryColor: string;
  customOverlayUrl?: string;
}

export interface CapturedPhoto {
  id: string;
  timestamp: number;
  dataUrl: string;
  frameId: string;
  frameName: string;
  driveFileId?: string;
  driveWebViewLink?: string;
  driveUploadStatus: 'idle' | 'uploading' | 'success' | 'error';
  errorMessage?: string;
}

export type ScreenState = 'welcome' | 'frame-select' | 'camera' | 'result';
