'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import SecureVideoPlayer from '@/components/SecureVideoPlayer';
import { FaArrowLeft, FaCrown, FaClock, FaTag, FaShare } from 'react-icons/fa';
import { MdVideoLibrary } from 'react-icons/md';

interface Video {
  uuid: string;
  title: string;
  description: string | null;
  category: string | null;
  tags: string | null;
  views: number;
  isPremium: boolean;
  duration: string | null;
  createdAt: string;
  videoUrl: string;
  videoType: string;
  thumbnailUrl: string | null;
  isPreviewMode: boolean;
  previewDuration: number | null;
  hasPremiumAccess: boolean;
}

interface RelatedVideo {
  uuid: string;
  title: string;
  thumbnailUrl: string | null;
  duration: string | null;
  views: number;
  isPremium: boolean;
}

export default function WatchVideoPage() {
  const router = useRouter();
  const params = useParams();
  const videoId = params.id as string;
  
  const [video, setVideo] = useState<Video | null>(null);
  const [relatedVideos, setRelatedVideos] = useState<RelatedVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVideoDetails();
  }, [videoId]);

  const fetchVideoDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/user/videos/${videoId}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('Failed to load video');
      }
      
      const data = await response.json();
      setVideo(data.video);
      setRelatedVideos(data.relatedVideos || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load video');
    } finally {
      setLoading(false);
    }
  };

  const handleBackClick = () => {
    router.push('/dashboard/videos');
  };

  const handleRelatedVideoClick = (relatedVideoId: string) => {
    router.push(`/dashboard/videos/watch/${relatedVideoId}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading video...</p>
        </div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <MdVideoLibrary className="text-6xl text-gray-300 mx-auto mb-4" />
          <p className="text-red-500 text-lg mb-4">{error || 'Video not found'}</p>
          <button
            onClick={handleBackClick}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            Back to Videos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-3 md:px-4 py-4 md:py-6">
        <button
          onClick={handleBackClick}
          className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-800 transition"
        >
          <FaArrowLeft />
          Back to Videos
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <SecureVideoPlayer
                videoId={videoId}
                title={video.title}
                autoPlay={false}
                showControls={true}
                isPreviewMode={video.isPreviewMode}
                previewDuration={video.previewDuration}
              />
              
              {video.isPreviewMode && (
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-400 p-4 mx-4 md:mx-6 mt-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-yellow-800 font-semibold">Preview Mode</p>
                      <p className="text-yellow-700 text-sm mt-1">
                        You&apos;re watching a {video.previewDuration}-second preview of this premium video
                      </p>
                    </div>
                    <button 
                      onClick={() => router.push('/pricing')}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition whitespace-nowrap text-sm sm:text-base"
                    >
                      <FaCrown />
                      <span className="hidden sm:inline">Upgrade to Premium</span>
                      <span className="sm:hidden">Upgrade</span>
                    </button>
                  </div>
                </div>
              )}
              
              <div className="p-4 md:p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 pr-4">
                    <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">
                      {video.title}
                    </h1>
                    {video.isPremium && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                        <FaCrown />
                        Premium Content
                      </span>
                    )}
                  </div>
                  <button className="p-2 text-gray-500 hover:text-gray-700 transition flex-shrink-0">
                    <FaShare />
                  </button>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 md:gap-4 text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <FaClock />
                    <span className="text-xs md:text-sm">{formatDate(video.createdAt)}</span>
                  </div>
                  {video.duration && (
                    <div className="flex items-center gap-1">
                      <MdVideoLibrary />
                      <span className="text-xs md:text-sm">{video.duration}</span>
                    </div>
                  )}
                </div>
                
                {video.description && (
                  <div className="prose max-w-none">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Description</h3>
                    <p className="text-gray-600 whitespace-pre-wrap">{video.description}</p>
                  </div>
                )}
                
                {video.tags && (
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {video.tags.split(',').map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm"
                        >
                          <FaTag className="text-gray-400" />
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-base md:text-lg font-semibold text-gray-800 mb-4">Related Videos</h2>
              
              {relatedVideos.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No related videos</p>
              ) : (
                <div className="space-y-3">
                  {relatedVideos.map((relatedVideo) => (
                    <div
                      key={relatedVideo.uuid}
                      onClick={() => handleRelatedVideoClick(relatedVideo.uuid)}
                      className="flex gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition"
                    >
                      <div className="w-32 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                        {relatedVideo.thumbnailUrl ? (
                          <img
                            src={relatedVideo.thumbnailUrl}
                            alt={relatedVideo.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                            <MdVideoLibrary className="text-white text-xl" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-800 text-sm line-clamp-2 mb-1">
                          {relatedVideo.title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          {relatedVideo.isPremium && (
                            <span className="flex items-center gap-1 text-yellow-600">
                              <FaCrown />
                              Premium
                            </span>
                          )}
                          {relatedVideo.duration && (
                            <span>{relatedVideo.duration}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}