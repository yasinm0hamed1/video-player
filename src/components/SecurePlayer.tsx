import React, { useEffect, useRef, useState, useCallback } from 'react';
import { VideoConfig, PlayerControlsState, SecuritySettings } from '../types';
import { formatTime } from '../utils/youtube';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  RotateCcw, 
  RotateCw, 
  ShieldCheck, 
  AlertCircle,
  Gauge,
  Sliders,
  Settings,
  Check
} from 'lucide-react';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

// Map YouTube internal quality keys to clean user-friendly labels
const QUALITY_LABELS: Record<string, string> = {
  highres: '4K / 8K (عالية جداً)',
  hd2160: '4K (2160p)',
  hd1440: '2K (1440p)',
  hd1080: '1080p (Full HD)',
  hd720: '720p (HD)',
  large: '480p (SD)',
  medium: '360p',
  small: '240p',
  tiny: '144p',
  auto: 'تلقائي (Auto)',
  default: 'تلقائي (Auto)',
};

const ALL_STANDARD_QUALITIES = [
  { key: 'auto', label: 'تلقائي (Auto)' },
  { key: 'hd1080', label: '1080p (Full HD)' },
  { key: 'hd720', label: '720p (HD)' },
  { key: 'large', label: '480p (SD)' },
  { key: 'medium', label: '360p' },
  { key: 'small', label: '240p' },
  { key: 'tiny', label: '144p' },
];

interface SecurePlayerProps {
  config: VideoConfig;
  security?: SecuritySettings;
  className?: string;
  onEnded?: () => void;
}

export const SecurePlayer: React.FC<SecurePlayerProps> = ({
  config,
  security = {
    blockRightClick: true,
    floatingWatermark: false,
    obscureUrl: true,
    blockKeyboardInspect: true,
    cropYouTubeBorders: true,
    disableCaptions: true,
  },
  className = '',
  onEnded
}) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const playerHostRef = useRef<HTMLDivElement>(null);
  const playerInstanceRef = useRef<any>(null);

  const [playerState, setPlayerState] = useState<PlayerControlsState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 100,
    isMuted: false,
    playbackRate: 1,
    currentQuality: 'auto',
    availableQualities: [],
    isFullscreen: false,
    isBuffering: true,
    hasError: false,
  });

  const [isReady, setIsReady] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPreviewVal, setSeekPreviewVal] = useState<number | null>(null);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const controlsTimeoutRef = useRef<any>(null);

  // Helper to disable captions and native subtitles
  const suppressYouTubeCaptions = useCallback((player: any) => {
    if (!player) return;
    try {
      if (typeof player.unloadModule === 'function') {
        player.unloadModule('captions');
        player.unloadModule('cc');
      }
      if (typeof player.setOption === 'function') {
        player.setOption('captions', 'track', {});
        player.setOption('cc', 'track', {});
        player.setOption('captions', 'reload', false);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Initialize or reload YouTube player when video ID changes
  useEffect(() => {
    let isMounted = true;
    let timerId: any = null;

    function createPlayer() {
      if (!window.YT || !window.YT.Player || !playerHostRef.current) return;

      if (playerInstanceRef.current && typeof playerInstanceRef.current.destroy === 'function') {
        try {
          playerInstanceRef.current.destroy();
        } catch (e) {}
        playerInstanceRef.current = null;
      }

      setIsReady(false);
      setPlayerState((prev) => ({
        ...prev,
        isBuffering: true,
        hasError: false,
        errorMessage: undefined,
        currentTime: 0,
      }));

      if (playerHostRef.current) {
        playerHostRef.current.innerHTML = '<div id="yt-player-target"></div>';
      }

      // Stringent YouTube parameters to strip controls, branding, recommendations & captions
      const playerVars: any = {
        controls: 0,
        disablekb: 1,
        modestbranding: 1,
        rel: 0,
        iv_load_policy: 3, // disables annotations
        cc_load_policy: 0, // disables closed captions
        cc_lang_pref: 'none',
        fs: 0,
        playsinline: 1,
        autoplay: config.autoPlay ? 1 : 0,
        origin: window.location.origin,
      };

      if (config.startSeconds && config.startSeconds > 0) {
        playerVars.start = Math.floor(config.startSeconds);
      }
      if (config.endSeconds && config.endSeconds > 0) {
        playerVars.end = Math.floor(config.endSeconds);
      }

      try {
        const player = new window.YT.Player('yt-player-target', {
          videoId: config.id,
          width: '100%',
          height: '100%',
          playerVars,
          events: {
            onReady: (event: any) => {
              if (!isMounted) return;
              setIsReady(true);
              suppressYouTubeCaptions(event.target);
              const duration = event.target.getDuration() || 0;
              let currentQ = 'auto';
              let availQ: string[] = [];
              try {
                if (typeof event.target.getPlaybackQuality === 'function') {
                  currentQ = event.target.getPlaybackQuality() || 'auto';
                }
                if (typeof event.target.getAvailableQualityLevels === 'function') {
                  availQ = event.target.getAvailableQualityLevels() || [];
                }
              } catch (e) {}

              setPlayerState((prev) => ({
                ...prev,
                duration,
                isBuffering: false,
                currentQuality: currentQ,
                availableQualities: availQ,
              }));
              event.target.setVolume(100);
              if (config.autoPlay) {
                event.target.playVideo();
              }
            },
            onStateChange: (event: any) => {
              if (!isMounted) return;
              const YT_STATE = window.YT.PlayerState;

              // Read available qualities whenever video starts playing or state changes
              let currentQ = playerState.currentQuality;
              let availQ = playerState.availableQualities;
              try {
                if (typeof event.target.getPlaybackQuality === 'function') {
                  const q = event.target.getPlaybackQuality();
                  if (q && q !== 'unknown') currentQ = q;
                }
                if (typeof event.target.getAvailableQualityLevels === 'function') {
                  const aq = event.target.getAvailableQualityLevels();
                  if (aq && aq.length > 0) availQ = aq;
                }
              } catch (e) {}

              if (event.data === YT_STATE.PLAYING) {
                suppressYouTubeCaptions(event.target);
                const dur = event.target.getDuration() || 0;
                setPlayerState((prev) => ({
                  ...prev,
                  isPlaying: true,
                  isBuffering: false,
                  duration: dur > 0 ? dur : prev.duration,
                  currentQuality: currentQ,
                  availableQualities: availQ.length > 0 ? availQ : prev.availableQualities,
                }));
              } else if (event.data === YT_STATE.PAUSED) {
                setPlayerState((prev) => ({
                  ...prev,
                  isPlaying: false,
                  isBuffering: false,
                  currentQuality: currentQ,
                  availableQualities: availQ.length > 0 ? availQ : prev.availableQualities,
                }));
              } else if (event.data === YT_STATE.BUFFERING) {
                setPlayerState((prev) => ({
                  ...prev,
                  isBuffering: true,
                }));
              } else if (event.data === YT_STATE.ENDED) {
                setPlayerState((prev) => ({
                  ...prev,
                  isPlaying: false,
                  isBuffering: false,
                  currentTime: prev.duration,
                }));
                if (config.loop) {
                  event.target.seekTo(config.startSeconds || 0, true);
                  event.target.playVideo();
                } else if (onEnded) {
                  onEnded();
                }
              }
            },
            onError: (err: any) => {
              if (!isMounted) return;
              console.error('YouTube Player Error code:', err.data);
              let msg = 'تعذر تشغيل الفيديو.';
              if (err.data === 101 || err.data === 150) {
                msg = 'صاحب هذا الفيديو منع تضمينه (Embedding) في المواقع الخارجية.';
              } else if (err.data === 2) {
                msg = 'رابط أو معرّف الفيديو غير صالح.';
              } else if (err.data === 100) {
                msg = 'الفيديو غير متاح أو تم حذفه.';
              }
              setPlayerState((prev) => ({
                ...prev,
                hasError: true,
                errorMessage: msg,
                isBuffering: false,
              }));
            },
          },
        });

        playerInstanceRef.current = player;
      } catch (err) {
        console.error('Failed to init YT player:', err);
      }
    }

    if (!window.YT || !window.YT.Player) {
      const existingScript = document.getElementById('youtube-iframe-api');
      if (!existingScript) {
        const tag = document.createElement('script');
        tag.id = 'youtube-iframe-api';
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
      }

      window.onYouTubeIframeAPIReady = () => {
        if (isMounted) createPlayer();
      };
    } else {
      createPlayer();
    }

    timerId = setInterval(() => {
      if (playerInstanceRef.current && isMounted && !isSeeking) {
        try {
          if (typeof playerInstanceRef.current.getCurrentTime === 'function') {
            const cur = playerInstanceRef.current.getCurrentTime() || 0;
            const dur = playerInstanceRef.current.getDuration() || 0;
            setPlayerState((prev) => {
              if (Math.abs(prev.currentTime - cur) < 0.25 && prev.duration === dur) {
                return prev;
              }
              return {
                ...prev,
                currentTime: cur,
                duration: dur > 0 ? dur : prev.duration,
              };
            });
          }
        } catch (e) {}
      }
    }, 300);

    return () => {
      isMounted = false;
      clearInterval(timerId);
      if (playerInstanceRef.current && typeof playerInstanceRef.current.destroy === 'function') {
        try {
          playerInstanceRef.current.destroy();
        } catch (e) {}
      }
    };
  }, [config.id, config.startSeconds, config.endSeconds, config.loop, suppressYouTubeCaptions]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = Boolean(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement
      );
      setPlayerState((prev) => ({ ...prev, isFullscreen: isFs }));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Controls auto-hide when playing
  const handleMouseMove = () => {
    setControlsVisible(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (playerState.isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setControlsVisible(false);
        setShowSpeedMenu(false);
        setShowQualityMenu(false);
      }, 2800);
    }
  };

  const handleMouseLeave = () => {
    if (playerState.isPlaying) {
      setControlsVisible(false);
      setShowSpeedMenu(false);
      setShowQualityMenu(false);
    }
  };

  const togglePlay = useCallback(() => {
    if (!isReady || !playerInstanceRef.current) return;
    try {
      const state = playerInstanceRef.current.getPlayerState();
      if (state === window.YT.PlayerState.PLAYING) {
        playerInstanceRef.current.pauseVideo();
        setControlsVisible(true);
      } else {
        playerInstanceRef.current.playVideo();
        handleMouseMove();
      }
    } catch (e) {
      console.warn('Error toggling play:', e);
    }
  }, [isReady]);

  const seekRelative = useCallback((secondsOffset: number) => {
    if (!isReady || !playerInstanceRef.current || config.preventSeek) return;
    try {
      const cur = playerInstanceRef.current.getCurrentTime() || 0;
      const dur = playerState.duration || 1;
      const target = Math.max(0, Math.min(dur, cur + secondsOffset));
      playerInstanceRef.current.seekTo(target, true);
      setPlayerState((prev) => ({ ...prev, currentTime: target }));
    } catch (e) {}
  }, [isReady, playerState.duration, config.preventSeek]);

  const handleVolumeChange = (newVal: number) => {
    if (!isReady || !playerInstanceRef.current) return;
    try {
      playerInstanceRef.current.setVolume(newVal);
      const isMuted = newVal === 0;
      if (isMuted) {
        playerInstanceRef.current.mute();
      } else {
        playerInstanceRef.current.unMute();
      }
      setPlayerState((prev) => ({
        ...prev,
        volume: newVal,
        isMuted,
      }));
    } catch (e) {}
  };

  const toggleMute = () => {
    if (!isReady || !playerInstanceRef.current) return;
    try {
      if (playerState.isMuted) {
        playerInstanceRef.current.unMute();
        const restoreVol = playerState.volume > 0 ? playerState.volume : 80;
        playerInstanceRef.current.setVolume(restoreVol);
        setPlayerState((prev) => ({ ...prev, isMuted: false, volume: restoreVol }));
      } else {
        playerInstanceRef.current.mute();
        setPlayerState((prev) => ({ ...prev, isMuted: true }));
      }
    } catch (e) {}
  };

  const handleSpeedChange = (speed: number) => {
    if (!isReady || !playerInstanceRef.current) return;
    try {
      playerInstanceRef.current.setPlaybackRate(speed);
      setPlayerState((prev) => ({ ...prev, playbackRate: speed }));
      setShowSpeedMenu(false);
    } catch (e) {}
  };

  const handleQualityChange = (quality: string) => {
    if (!isReady || !playerInstanceRef.current) return;
    try {
      if (typeof playerInstanceRef.current.setPlaybackQuality === 'function') {
        playerInstanceRef.current.setPlaybackQuality(quality);
      }
      if (typeof playerInstanceRef.current.setPlaybackQualityRange === 'function') {
        playerInstanceRef.current.setPlaybackQualityRange(quality, quality);
      }
      setPlayerState((prev) => ({ ...prev, currentQuality: quality }));
      setShowQualityMenu(false);
    } catch (e) {
      console.warn('Could not set playback quality:', e);
    }
  };

  const toggleFullscreen = () => {
    if (!stageRef.current) return;
    try {
      if (!playerState.isFullscreen) {
        if (stageRef.current.requestFullscreen) {
          stageRef.current.requestFullscreen();
        } else if ((stageRef.current as any).webkitRequestFullscreen) {
          (stageRef.current as any).webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          (document as any).webkitExitFullscreen();
        }
      }
    } catch (e) {
      console.warn('Fullscreen error:', e);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
      return;
    }

    if (e.key === ' ' || e.key === 'k') {
      e.preventDefault();
      togglePlay();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      seekRelative(5);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      seekRelative(-5);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      handleVolumeChange(Math.min(100, playerState.volume + 10));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      handleVolumeChange(Math.max(0, playerState.volume - 10));
    } else if (e.key === 'm' || e.key === 'M') {
      e.preventDefault();
      toggleMute();
    } else if (e.key === 'f' || e.key === 'F') {
      e.preventDefault();
      toggleFullscreen();
    }
  };

  const currentPercent = playerState.duration > 0
    ? (playerState.currentTime / playerState.duration) * 100
    : 0;

  // Zoom calculation to eliminate YouTube top/bottom bar (channel avatar, CC, title, watch on YT)
  const isCroppingActive = security.cropYouTubeBorders !== false;
  const zoomFactor = isCroppingActive ? (config.cropScale || 1.28) : 1;

  return (
    <div
      className={`player-wrapper select-none ${className}`}
      onContextMenu={(e) => {
        if (security.blockRightClick) {
          e.preventDefault();
        }
      }}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      dir="rtl"
    >
      {/* Stage: The complete 16:9 Video Canvas containing everything inside */}
      <div
        ref={stageRef}
        className="stage relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl group"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* Error overlay */}
        {playerState.hasError && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center p-6 bg-black/90 text-center text-white">
            <AlertCircle className="w-12 h-12 text-amber-400 mb-3" />
            <h4 className="text-lg font-bold mb-1">تعذر تشغيل هذا الفيديو</h4>
            <p className="text-sm text-stone-300 max-w-md mb-4 leading-relaxed">
              {playerState.errorMessage || 'تأكد من أن الفيديو متاح ومسموح بتضمينه (Embed) في المواقع الخارجية.'}
            </p>
            <div className="text-xs bg-stone-800/80 border border-stone-700 text-stone-400 rounded-lg px-3 py-2">
              ملاحظة: بعض مقاطع يوتيوب الرسمية للموسيقى أو المقيدة بحقوق ملكية تمنع التشغيل في واجهات مخصصة.
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {!isReady && !playerState.hasError && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black text-stone-300 gap-3">
            <div className="w-10 h-10 border-3 border-[var(--beige-3)] border-t-[var(--accent)] rounded-full animate-spin"></div>
            <span className="text-xs sm:text-sm font-medium tracking-wide">جارِ تهيئة المشغل الآمن…</span>
          </div>
        )}

        {/* YouTube Iframe Host with Dynamic Border Crop */}
        {/* The scale factor pushes YouTube's top header (avatar/title) and bottom badges completely outside the overflow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center">
          <div
            ref={playerHostRef}
            id="yt-frame-host"
            style={{
              transform: `scale(${zoomFactor})`,
              transformOrigin: 'center center',
              width: '100%',
              height: '100%',
            }}
            className="pointer-events-none transition-transform duration-300"
          />
        </div>

        {/* TOP Gradient Mask: Hides any residual edge artifacts */}
        <div className="absolute top-0 inset-x-0 h-14 bg-gradient-to-b from-black/80 via-black/20 to-transparent pointer-events-none z-10" />

        {/* Optional Custom Watermark Badge inside video */}
        <div className={`absolute top-3 right-4 z-20 flex items-center gap-2 pointer-events-none transition-opacity duration-300 ${
          controlsVisible || !playerState.isPlaying ? 'opacity-100' : 'opacity-40'
        }`}>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-sm border border-white/10 text-white/90 text-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span className="font-medium truncate max-w-[200px]">
              {config.watermarkText || config.title || 'مشاهدة آمنة'}
            </span>
          </div>
        </div>

        {/* Floating moving dynamic watermark badge if enabled */}
        {security.floatingWatermark && (
          <div className="absolute bottom-20 left-4 z-15 pointer-events-none opacity-40 text-[11px] font-mono tracking-wider text-white select-none">
            {config.watermarkText || 'SECURE-VIEW'} • {new Date().toLocaleTimeString('ar-EG')}
          </div>
        )}

        {/* CRITICAL SHIELD: Transparent layer intercepting ALL clicks, touches, and context menus */}
        {/* Covers the entire stage behind the controls so users never touch YouTube iframe */}
        <div
          className="shield absolute inset-0 z-10 cursor-pointer bg-transparent"
          onClick={togglePlay}
          onDoubleClick={toggleFullscreen}
          onContextMenu={(e) => e.preventDefault()}
          title="انقر للتشغيل أو الإيقاف • نقرتين لملء الشاشة"
        />

        {/* Center Big Play Button (shown when paused or cued) */}
        {!playerState.isPlaying && isReady && !playerState.hasError && (
          <div className="center-btn absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              className="pointer-events-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center backdrop-blur-md border border-white/20 transition-all duration-200 transform hover:scale-108 active:scale-95 shadow-2xl"
              aria-label="تشغيل الفيديو"
            >
              <Play className="w-7 h-7 sm:w-9 sm:h-9 fill-white translate-x-[-1px]" />
            </button>
          </div>
        )}

        {/* ALL CONTROLS ARE DIRECTLY INSIDE THE VIDEO STAGE */}
        <div
          className={`controls-inside absolute bottom-0 inset-x-0 z-30 bg-gradient-to-t from-black/95 via-black/70 to-transparent pt-12 pb-3.5 px-3 sm:px-5 transition-all duration-300 ${
            controlsVisible || !playerState.isPlaying
              ? 'opacity-100 translate-y-0 pointer-events-auto'
              : 'opacity-0 translate-y-2 pointer-events-none'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Progress / Seek Row */}
          <div className="seek-row flex items-center gap-3 mb-2">
            <span className="time text-xs font-mono text-white/90 min-w-[42px] text-center select-none">
              {formatTime(isSeeking && seekPreviewVal !== null ? (seekPreviewVal / 100) * playerState.duration : playerState.currentTime)}
            </span>

            <div className="relative flex-1 flex items-center group/seek py-1">
              <input
                type="range"
                min="0"
                max="100"
                step="0.1"
                disabled={config.preventSeek || !isReady}
                value={isSeeking && seekPreviewVal !== null ? seekPreviewVal : currentPercent}
                onMouseDown={() => setIsSeeking(true)}
                onTouchStart={() => setIsSeeking(true)}
                onChange={(e) => setSeekPreviewVal(parseFloat(e.target.value))}
                onMouseUp={() => {
                  if (seekPreviewVal !== null && playerInstanceRef.current) {
                    const targetSec = (seekPreviewVal / 100) * playerState.duration;
                    playerInstanceRef.current.seekTo(targetSec, true);
                  }
                  setIsSeeking(false);
                  setSeekPreviewVal(null);
                }}
                onTouchEnd={() => {
                  if (seekPreviewVal !== null && playerInstanceRef.current) {
                    const targetSec = (seekPreviewVal / 100) * playerState.duration;
                    playerInstanceRef.current.seekTo(targetSec, true);
                  }
                  setIsSeeking(false);
                  setSeekPreviewVal(null);
                }}
                className="w-full h-1.5 sm:h-2 rounded-full cursor-pointer bg-white/25 accent-[var(--accent)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                title={config.preventSeek ? 'التقديم والتأخير معطل في هذا الفيديو' : 'شريط التقدم'}
              />
            </div>

            <span className="time text-xs font-mono text-white/70 min-w-[42px] text-center select-none">
              {formatTime(playerState.duration)}
            </span>
          </div>

          {/* Buttons Row */}
          <div className="buttons-row flex items-center justify-between text-white">
            {/* Primary Controls (Right-to-Left: Play, Skip, Volume) */}
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              {/* Play / Pause */}
              <button
                type="button"
                onClick={togglePlay}
                disabled={!isReady}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition text-white disabled:opacity-40"
                aria-label={playerState.isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
                title={playerState.isPlaying ? 'إيقاف مؤقت (Space)' : 'تشغيل (Space)'}
              >
                {playerState.isPlaying ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current" />
                )}
              </button>

              {/* Rewind 10s */}
              <button
                type="button"
                onClick={() => seekRelative(-10)}
                disabled={!isReady || config.preventSeek}
                className="p-2 rounded-xl hover:bg-white/15 active:scale-95 transition text-white/90 disabled:opacity-40"
                title="رجوع 10 ثوانٍ"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Forward 10s */}
              <button
                type="button"
                onClick={() => seekRelative(10)}
                disabled={!isReady || config.preventSeek}
                className="p-2 rounded-xl hover:bg-white/15 active:scale-95 transition text-white/90 disabled:opacity-40"
                title="تقديم 10 ثوانٍ"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              {/* Volume & Mute */}
              <div className="flex items-center gap-1.5 mr-1 sm:mr-3 group/vol">
                <button
                  type="button"
                  onClick={toggleMute}
                  disabled={!isReady}
                  className="p-2 rounded-xl hover:bg-white/15 active:scale-95 transition text-white/90"
                  title={playerState.isMuted ? 'إلغاء كتم الصوت (M)' : 'كتم الصوت (M)'}
                >
                  {playerState.isMuted || playerState.volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-rose-400" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>

                <input
                  type="range"
                  min="0"
                  max="100"
                  value={playerState.isMuted ? 0 : playerState.volume}
                  onChange={(e) => handleVolumeChange(parseInt(e.target.value, 10))}
                  className="w-16 sm:w-20 h-1.5 accent-[var(--accent)] bg-white/30 rounded-full"
                  title={`مستوى الصوت: ${playerState.isMuted ? 0 : playerState.volume}%`}
                />
              </div>
            </div>

            {/* Secondary Controls (Quality, Playback Rate & Fullscreen) */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Quality Settings Dropdown Menu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowQualityMenu(!showQualityMenu);
                    setShowSpeedMenu(false);
                  }}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-xl flex items-center gap-1.5 text-white transition-colors ${
                    showQualityMenu ? 'bg-white/25 text-[var(--accent)]' : 'bg-white/10 hover:bg-white/20'
                  }`}
                  title="جودة الفيديو"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span className="font-mono text-[11px]">
                    {playerState.currentQuality === 'auto'
                      ? 'تلقائي'
                      : QUALITY_LABELS[playerState.currentQuality]
                      ? QUALITY_LABELS[playerState.currentQuality].split(' ')[0]
                      : playerState.currentQuality}
                  </span>
                </button>

                {showQualityMenu && (
                  <div
                    className="absolute bottom-full left-0 mb-2 py-1.5 bg-stone-900/95 border border-white/15 backdrop-blur-md rounded-xl shadow-2xl z-40 min-w-[150px] max-h-60 overflow-y-auto flex flex-col text-white"
                    dir="rtl"
                  >
                    <div className="px-3 py-1 text-[10px] font-bold text-stone-400 border-b border-white/10 mb-1">
                      اختيار جودة العرض:
                    </div>
                    {/* Render available qualities from YouTube if present, otherwise standard list */}
                    {(playerState.availableQualities && playerState.availableQualities.length > 0
                      ? ['auto', ...playerState.availableQualities.filter((q) => q !== 'auto' && q !== 'unknown')]
                      : ALL_STANDARD_QUALITIES.map((q) => q.key)
                    ).map((qKey) => {
                      const isSelected = playerState.currentQuality === qKey;
                      const label = QUALITY_LABELS[qKey] || qKey;
                      return (
                        <button
                          key={qKey}
                          type="button"
                          onClick={() => handleQualityChange(qKey)}
                          className={`px-3 py-1.5 text-xs text-right hover:bg-white/15 transition-colors flex items-center justify-between gap-2 ${
                            isSelected
                              ? 'font-bold text-[var(--accent)] bg-white/10'
                              : 'text-stone-200'
                          }`}
                        >
                          <span className="truncate">{label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Speed Dropdown Menu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowSpeedMenu(!showSpeedMenu);
                    setShowQualityMenu(false);
                  }}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-xl flex items-center gap-1 text-white transition-colors ${
                    showSpeedMenu ? 'bg-white/25 text-[var(--accent)]' : 'bg-white/10 hover:bg-white/20'
                  }`}
                  title="سرعة التشغيل"
                >
                  <Gauge className="w-3.5 h-3.5" />
                  <span className="font-mono">{playerState.playbackRate}x</span>
                </button>

                {showSpeedMenu && (
                  <div className="absolute bottom-full left-0 mb-2 py-1 bg-stone-900/95 border border-white/15 backdrop-blur-md rounded-xl shadow-2xl z-40 min-w-[95px] flex flex-col text-white">
                    <div className="px-3 py-1 text-[10px] font-bold text-stone-400 border-b border-white/10 mb-1">
                      سرعة التشغيل:
                    </div>
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((spd) => (
                      <button
                        key={spd}
                        type="button"
                        onClick={() => handleSpeedChange(spd)}
                        className={`px-3 py-1.5 text-xs text-right hover:bg-white/15 font-mono transition-colors flex items-center justify-between ${
                          playerState.playbackRate === spd
                            ? 'font-bold text-[var(--accent)] bg-white/10'
                            : 'text-stone-200'
                        }`}
                      >
                        <span>{spd}x {spd === 1 && '(عادي)'}</span>
                        {playerState.playbackRate === spd && <Check className="w-3 h-3 text-[var(--accent)]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Fullscreen Button */}
              <button
                type="button"
                onClick={toggleFullscreen}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition text-white"
                aria-label="ملء الشاشة"
                title="ملء الشاشة (F)"
              >
                {playerState.isFullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
