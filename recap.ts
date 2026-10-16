export type AspectRatio = '9:16' | '16:9' | '1:1' | '3:4';
export type Resolution = '1080p' | '720p' | '480p';
export type SubtitleLanguage = 'none' | 'burmese' | 'english' | 'bilingual';
export type SubtitlePosition = 'bottom' | 'center' | 'top';
export type VoiceTone = 'dramatic' | 'thriller' | 'deep' | 'energetic' | 'female';
export type BgmStyle = 'suspense' | 'action' | 'drama' | 'mystery' | 'chill';

export interface VideoMetadata {
  file: File;
  objectUrl: string;
  name: string;
  sizeBytes: number;
  duration: number; // in seconds
  width: number;
  height: number;
  aspectRatio: string;
}

export interface SceneSegment {
  id: string;
  startTime: number;
  endTime: number;
  titleMy: string;
  titleEn: string;
  scriptMy: string;
  scriptEn: string;
  emotionalBeat?: string;
  selected?: boolean;
}

export interface RecapSettings {
  // Video settings
  durationPreset: '1' | '3' | '5' | '10' | '15' | '20' | 'custom';
  customDurationMinutes: number;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  enableBlurBox: boolean;
  blurBoxIntensity: number; // 5 - 30
  blurBoxPosition: 'bottom-bar' | 'top-bar' | 'background-pillarbox';

  // Voice settings
  narrationLanguage: 'burmese' | 'english';
  voiceTone: VoiceTone;
  speechSpeed: number; // 0.8 - 1.5
  enableBgm: boolean;
  bgmStyle: BgmStyle;
  bgmVolume: number; // 0 - 100
  originalVideoVolume: number; // 0 - 100

  // Effects settings
  subtitleLang: SubtitleLanguage;
  subtitleFontSize: number; // 16 - 36
  subtitleColor: string;
  subtitleOutline: boolean;
  subtitlePosition: SubtitlePosition;
  enableWatermark: boolean;
  watermarkText: string;
  watermarkImage?: string; // base64 or blob url
  watermarkOpacity: number; // 20 - 100
  watermarkPosition: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export interface RenderProgress {
  status: 'idle' | 'analyzing' | 'scripting' | 'rendering' | 'encoding' | 'completed' | 'error';
  progressPercent: number;
  currentSceneIndex: number;
  totalScenes: number;
  message: string;
  messageMy: string;
  estimatedSecondsRemaining: number;
  error?: string;
  downloadUrl?: string;
  outputSizeMb?: number;
}

export type RecapLength = 'short' | 'medium' | 'long';

export interface ViralPackage {
  titles: Array<{ burmese: string; english: string; type?: string }>;
  thumbnailTexts: Array<{ burmese: string; english: string }>;
  viralHooks: string[];
  youtubeDescription: string;
  tags: string;
  hashtags: string;
  tiktokCaption: string;
  facebookPost: string;
}

export interface SavedScript {
  id: string;
  title: string;
  createdAt: number;
  durationMinutes: number;
  language: string;
  fullScriptText: string;
  scenes: SceneSegment[];
  logline: string;
}

