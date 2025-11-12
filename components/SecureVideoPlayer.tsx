'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { FaPlay, FaPause, FaExpand, FaCompress, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';
import { MdSettings, MdSpeed } from 'react-icons/md';

interface SecureVideoPlayerProps {
  videoId: string;
  title?: string;
  autoPlay?: boolean;
  showControls?: boolean;
  isPreviewMode?: boolean;
  previewDuration?: number | null;
}

export default function SecureVideoPlayer({ 
  videoId, 
  title = "Video", 
  autoPlay = false,
  showControls = true,
  isPreviewMode = false,
  previewDuration = null
}: SecureVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [showWatermark] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasFullAccess, setHasFullAccess] = useState(false);
  const [isPreviewOnly, setIsPreviewOnly] = useState(false);
  const [previewDurationState, setPreviewDurationState] = useState(20);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [timeLimit, setTimeLimit] = useState<number | null>(null);

  useEffect(() => {
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    
    const preventKeys = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
      }
      if (e.key === 'F12') {
        e.preventDefault();
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) {
        e.preventDefault();
      }
    };
    
    document.addEventListener('keydown', preventKeys);
    
    const style = document.createElement('style');
    style.textContent = `
      video::-webkit-media-controls-enclosure {
        display: none !important;
      }
      video::-webkit-media-controls {
        display: none !important;
      }
      video {
        pointer-events: none;
      }
      .video-overlay {
        pointer-events: auto;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.removeEventListener('contextmenu', (e) => e.preventDefault());
      document.removeEventListener('keydown', preventKeys);
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    };
  }, []);

  useEffect(() => {
    const fetchStreamUrl = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/videos/${videoId}/access-token`);
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to get video access (${response.status}): ${errorText}`);
        }
        const data = await response.json();
        setStreamUrl(data.streamUrl);
        setIsAuthenticated(data.isAuthenticated || false);
        setHasFullAccess(data.hasFullAccess || false);
        
        // Use props or API data for preview mode
        const apiPreviewMode = data.isPreviewOnly || false;
        const apiPreviewDuration = data.previewDuration || 20;
        const finalPreviewMode = isPreviewMode || apiPreviewMode;
        const finalPreviewDuration = previewDuration || apiPreviewDuration;
        
        setIsPreviewOnly(finalPreviewMode);
        setPreviewDurationState(finalPreviewDuration);
        
        // Set time limit for preview users
        if (finalPreviewMode) {
          setTimeLimit(finalPreviewDuration);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load video');
        setIsLoading(false);
      }
    };

    fetchStreamUrl();
  }, [videoId, isPreviewMode, previewDuration]);

  useEffect(() => {
    if (!streamUrl || !videoRef.current) return;

    const video = videoRef.current;
    
    // Check if it's a direct MP4 stream endpoint
    if (streamUrl.includes('/stream?')) {
      // Direct MP4 streaming
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        setIsLoading(false);
      });
      video.addEventListener('error', (e) => {
        setError('Failed to load video');
        setIsLoading(false);
      });
    } else if (streamUrl.includes('.m3u8')) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          backBufferLength: 90,
          maxBufferLength: 30,
          maxMaxBufferLength: 600,
          maxBufferSize: 60 * 1000 * 1000, // 60 MB
          maxBufferHole: 0.5,
          startLevel: -1, // Auto start level
          autoStartLoad: true,
          debug: false,
          xhrSetup: function(xhr: XMLHttpRequest, url: string) {
            // Add token to XHR requests if needed
            xhr.withCredentials = false;
          }
        });

        hls.loadSource(streamUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
            setIsLoading(false);
          if (autoPlay) {
            video.play().catch(console.error);
          }
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                setError('Failed to load video stream');
                setIsLoading(false);
                break;
            }
          }
        });

        hlsRef.current = hls;
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari)
        video.src = streamUrl;
        video.addEventListener('loadedmetadata', () => {
          setIsLoading(false);
        });
      } else {
        setError('HLS not supported in this browser');
        setIsLoading(false);
      }
    } else {
      // Direct video URL (not HLS)
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        setIsLoading(false);
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [streamUrl, autoPlay]);

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current) return;
    const currentVideoTime = videoRef.current.currentTime;
    setCurrentTime(currentVideoTime);
    
    // Check if preview time limit is reached
    if (timeLimit && currentVideoTime >= timeLimit) {
      videoRef.current.pause();
      setShowUpgradePrompt(true);
    }
  }, [timeLimit]);

  const handleLoadedMetadata = useCallback(() => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
  }, []);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const newTime = parseFloat(e.target.value);
    
    // Prevent seeking beyond preview limit for preview users
    if (timeLimit && newTime > timeLimit) {
      setShowUpgradePrompt(true);
      return;
    }
    
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }, [timeLimit]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const newVolume = parseFloat(e.target.value);
    videoRef.current.volume = newVolume;
    setVolume(newVolume);
  }, []);

  const changePlaybackRate = useCallback((rate: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = rate;
    setPlaybackRate(rate);
    setShowSpeedMenu(false);
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className="bg-gray-900 rounded-lg p-8 text-center">
        <p className="text-red-500 text-lg">{error}</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="relative bg-black rounded-lg overflow-hidden group"
      style={{ aspectRatio: '16/9' }}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-20">
          <div className="text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent mx-auto mb-4"></div>
            <p>Loading video...</p>
          </div>
        </div>
      )}

      {showWatermark && (
        <div className="absolute top-4 right-4 z-30 pointer-events-none select-none">
          <div className="text-white/30 text-lg font-bold">CrackTET</div>
        </div>
      )}

      {showUpgradePrompt && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-40 p-4">
          <div className="bg-white rounded-lg p-4 md:p-6 max-w-sm md:max-w-md w-full text-center">
            <h3 className="text-base md:text-lg font-bold text-gray-800 mb-2">
              {isAuthenticated ? "Premium Content" : "Preview Ended"}
            </h3>
            <p className="text-gray-600 mb-4 text-sm md:text-base">
              {isAuthenticated 
                ? "This is premium content. Upgrade to continue watching."
                : "Sign up to continue watching this video and unlock all content."
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <button
                onClick={() => {
                  setShowUpgradePrompt(false);
                  if (videoRef.current) {
                    videoRef.current.currentTime = 0;
                    setCurrentTime(0);
                    videoRef.current.pause();
                    setIsPlaying(false);
                  }
                  // Exit fullscreen if currently in fullscreen
                  if (document.fullscreenElement) {
                    document.exitFullscreen();
                    setIsFullscreen(false);
                  }
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 text-sm md:text-base w-full sm:w-auto"
              >
                Close
              </button>
              <button
                onClick={() => window.location.href = isAuthenticated ? '/pricing' : '/register'}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm md:text-base w-full sm:w-auto"
              >
                {isAuthenticated ? "Upgrade Now" : "Sign Up"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isPreviewOnly && !showUpgradePrompt && (
        <div className="absolute top-4 left-4 z-30">
          <div className="bg-red-500/90 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
            Preview: {Math.max(0, Math.round((timeLimit || 0) - currentTime))}s
          </div>
        </div>
      )}

      <video
        ref={videoRef}
        className="w-full h-full"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        playsInline
        controlsList="nodownload"
      />

      <div 
        className="video-overlay absolute inset-0 z-10"
        onClick={togglePlay}
      />

      {showControls && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="mb-2">
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${(currentTime / duration) * 100}%, #4b5563 ${(currentTime / duration) * 100}%, #4b5563 100%)`
              }}
            />
          </div>

          <div className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-4">
              <button
                onClick={togglePlay}
                className="p-2 hover:bg-white/20 rounded transition"
              >
                {isPlaying ? <FaPause /> : <FaPlay />}
              </button>

              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleMute}
                  className="p-2 hover:bg-white/20 rounded transition"
                >
                  {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <span className="text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <button
                  onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                  className="p-2 hover:bg-white/20 rounded transition flex items-center space-x-1"
                >
                  <MdSpeed />
                  <span className="text-sm">{playbackRate}x</span>
                </button>
                {showSpeedMenu && (
                  <div className="absolute bottom-full right-0 mb-2 bg-gray-800 rounded shadow-lg">
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                      <button
                        key={rate}
                        onClick={() => changePlaybackRate(rate)}
                        className={`block w-full px-4 py-2 text-left hover:bg-gray-700 ${playbackRate === rate ? 'text-red-500' : ''}`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={toggleFullscreen}
                className="p-2 hover:bg-white/20 rounded transition"
              >
                {isFullscreen ? <FaCompress /> : <FaExpand />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}