export interface VideoConfig {
  id: string; // YouTube video ID (e.g. pmq4iY8_cSE)
  title?: string;
  subtitle?: string;
  watermarkText?: string;
  startSeconds?: number;
  endSeconds?: number;
  autoPlay?: boolean;
  loop?: boolean;
  preventSeek?: boolean; // For tests/quizzes
  showControls?: boolean;
  cropScale?: number; // Zoom percentage to crop YouTube borders (e.g. 1.25)
}

export interface PlayerControlsState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  currentQuality: string;
  availableQualities: string[];
  isFullscreen: boolean;
  isBuffering: boolean;
  hasError: boolean;
  errorMessage?: string;
}

export interface SecuritySettings {
  blockRightClick: boolean;
  floatingWatermark: boolean;
  obscureUrl: boolean;
  blockKeyboardInspect: boolean;
  cropYouTubeBorders: boolean; // Crops top avatar/title and bottom YouTube elements
  disableCaptions: boolean; // Disables CC / subtitles
}

