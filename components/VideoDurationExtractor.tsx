"use client";

import { useState, useRef } from "react";
import { FaPlay, FaSync, FaCheck, FaClock } from "react-icons/fa";

interface Video {
  id: number;
  uuid: string;
  title: string;
  duration: string | null;
  videoUrl: string;
  videoType: string;
}

interface VideoDurationExtractorProps {
  onComplete?: () => void;
}

export default function VideoDurationExtractor({ onComplete }: VideoDurationExtractorProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState<Record<number, boolean>>({});
  const [completed, setCompleted] = useState<Record<number, boolean>>({});
  const [errors, setErrors] = useState<Record<number, string>>({});
  const videoRefs = useRef<Record<number, HTMLVideoElement | null>>({});

  const fetchVideosNeedingUpdate = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/videos/extract-duration');
      const data = await response.json();
      
      if (data.success) {
        setVideos(data.videos);
        setCompleted({});
        setErrors({});
      }
    } catch (error) {
      console.error('Failed to fetch videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const extractAndUpdateDuration = async (video: Video) => {
    setProcessing(prev => ({ ...prev, [video.id]: true }));
    setErrors(prev => ({ ...prev, [video.id]: '' }));

    try {
      // Create video element to extract duration
      const videoElement = document.createElement('video');
      videoElement.crossOrigin = 'anonymous';
      videoElement.preload = 'metadata';

      const videoUrl = `/api/videos/${video.uuid}/stream`;
      
      const duration = await new Promise<number>((resolve, reject) => {
        videoElement.onloadedmetadata = () => {
          if (videoElement.duration && isFinite(videoElement.duration)) {
            resolve(videoElement.duration);
          } else {
            reject(new Error('Invalid duration'));
          }
        };
        
        videoElement.onerror = () => {
          reject(new Error('Failed to load video'));
        };

        // Timeout after 10 seconds
        setTimeout(() => {
          reject(new Error('Timeout loading video metadata'));
        }, 10000);

        videoElement.src = videoUrl;
      });

      // Update database
      const response = await fetch('/api/admin/videos/extract-duration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: video.id, duration })
      });

      const data = await response.json();

      if (data.success) {
        setCompleted(prev => ({ ...prev, [video.id]: true }));
        setVideos(prev => prev.map(v => 
          v.id === video.id ? { ...v, duration: data.video.duration } : v
        ));
      } else {
        throw new Error(data.error || 'Failed to update duration');
      }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setErrors(prev => ({ ...prev, [video.id]: errorMsg }));
    } finally {
      setProcessing(prev => ({ ...prev, [video.id]: false }));
    }
  };

  const processAllVideos = async () => {
    for (const video of videos) {
      if (!completed[video.id] && !processing[video.id]) {
        await extractAndUpdateDuration(video);
        // Small delay between processing
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    if (onComplete) {
      onComplete();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center">
          <FaClock className="mr-2 text-blue-500" />
          Video Duration Extractor
        </h2>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchVideosNeedingUpdate}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center space-x-2"
          >
            <FaSync className={`${loading ? 'animate-spin' : ''}`} />
            <span>Scan Videos</span>
          </button>
          
          {videos.length > 0 && (
            <button
              onClick={processAllVideos}
              disabled={Object.values(processing).some(Boolean)}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center space-x-2"
            >
              <FaPlay />
              <span>Process All</span>
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Scanning for videos...</p>
        </div>
      )}

      {videos.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          <FaCheck className="text-4xl mx-auto mb-4 text-green-500" />
          <p>No videos need duration updates!</p>
        </div>
      )}

      {videos.length > 0 && (
        <div className="space-y-4">
          <p className="text-gray-600 mb-4">
            Found {videos.length} videos that need duration updates
          </p>
          
          <div className="max-h-96 overflow-y-auto space-y-3">
            {videos.map((video) => (
              <div key={video.id} className="border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
                  <div className="lg:col-span-2 min-w-0">
                    <h3 className="font-medium text-gray-800 truncate">{video.title}</h3>
                    <p className="text-sm text-gray-500">
                      ID: {video.id} | Current: {video.duration || 'No duration'}
                    </p>
                  </div>
                  
                  <div className="flex justify-end lg:justify-start">
                    <button
                      onClick={() => extractAndUpdateDuration(video)}
                      disabled={processing[video.id] || completed[video.id]}
                      className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-20 text-center"
                    >
                      {processing[video.id] ? '...' : completed[video.id] ? '✓' : 'Extract'}
                    </button>
                  </div>
                </div>
                
                {/* Status indicators */}
                {(processing[video.id] || completed[video.id] || errors[video.id]) && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    {processing[video.id] && (
                      <div className="flex items-center space-x-2 text-blue-600">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm">Processing...</span>
                      </div>
                    )}
                    
                    {completed[video.id] && (
                      <div className="flex items-center space-x-2 text-green-600">
                        <FaCheck />
                        <span className="text-sm">Updated successfully</span>
                      </div>
                    )}
                    
                    {errors[video.id] && (
                      <div className="text-red-600 text-sm">
                        <strong>Error:</strong> {errors[video.id]}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}