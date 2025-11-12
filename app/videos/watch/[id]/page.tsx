'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import SecureVideoPlayer from '@/components/SecureVideoPlayer';
import { FaArrowLeft, FaCrown, FaClock, FaTag, FaShare, FaUserPlus, FaLock } from 'react-icons/fa';
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
  isPremium: boolean;
  views: number;
}

export default function PublicWatchVideoPage() {
  const router = useRouter();
  const params = useParams();
  const videoId = params.id as string;

  const [video, setVideo] = useState<Video | null>(null);
  const [relatedVideos, setRelatedVideos] = useState<RelatedVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (videoId) {
      fetchVideoDetails();
    }
  }, [videoId]);

  const fetchVideoDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/user/videos/${videoId}`);
      
      if (response.ok) {
        const data = await response.json();
        setVideo(data.video);
        setRelatedVideos(data.relatedVideos || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load video');
      }
    } catch (err) {
      setError('An error occurred while loading the video');
    } finally {
      setLoading(false);
    }
  };

  const handleBackClick = () => {
    router.push('/videos');
  };

  const handleRelatedVideoClick = (relatedVideoId: string) => {
    router.push(`/videos/watch/${relatedVideoId}`);
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Video Not Available</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={handleBackClick}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition"
          >
            Back to Videos
          </button>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Video not found</p>
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
              
              {/* Preview mode banner for public users */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-400 p-4 mx-4 md:mx-6 mt-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-yellow-800 font-semibold">Free Preview Mode</p>
                    <p className="text-yellow-700 text-sm mt-1">
                      You&apos;re watching a {video.previewDuration}-second preview. Sign up for free to access the full video!
                    </p>
                  </div>
                  <button 
                    onClick={() => router.push('/register')}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition whitespace-nowrap text-sm sm:text-base"
                  >
                    <FaUserPlus />
                    <span className="hidden sm:inline">Sign Up Free</span>
                    <span className="sm:hidden">Sign Up</span>
                  </button>
                </div>
              </div>
              
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

                {/* Sign up CTA */}
                <div className="mt-6 bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <FaLock className="text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-800">Want to watch the full video?</h3>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">
                    Sign up for free to unlock complete access to this video and our entire educational library.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => router.push('/register')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
                    >
                      <FaUserPlus />
                      Sign Up Free
                    </button>
                    <button
                      onClick={() => router.push('/login')}
                      className="text-blue-600 hover:text-blue-700 px-4 py-2 transition"
                    >
                      Already have an account? Login
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-base md:text-lg font-semibold text-gray-800 mb-4">More Videos</h2>
              
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