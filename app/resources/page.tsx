'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaFileAlt, FaEye, FaLock, FaUserPlus, FaPlay, FaCrown, FaClock } from 'react-icons/fa';
import { MdCategory, MdVideoLibrary } from 'react-icons/md';

interface Resource {
  id: number;
  uuid: string;
  title: string;
  description: string | null;
  fileName: string;
  fileSize: string | null;
  pageCount: number;
  createdAt: string;
}

interface Video {
  id: number;
  uuid: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  duration: string | null;
  category: string | null;
  tags: string | null;
  views: number;
  isPremium: boolean;
  previewDuration: number;
  createdAt: string;
}

export default function PublicResourcesPage() {
  const router = useRouter();
  const [resources, setResources] = useState<Resource[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pdfs' | 'videos'>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch both resources and videos in parallel
      const [resourcesResponse, videosResponse] = await Promise.all([
        fetch('/api/resources'),
        fetch('/api/videos')
      ]);
      
      if (resourcesResponse.ok) {
        const resourcesData = await resourcesResponse.json();
        setResources(resourcesData.resources || []);
      }
      
      if (videosResponse.ok) {
        const videosData = await videosResponse.json();
        setVideos(videosData.videos || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResourceClick = (resourceId: string) => {
    // Redirect to login with return URL
    router.push(`/login?redirect=/dashboard/resources/view/${resourceId}`);
  };

  const handleVideoClick = (videoId: string) => {
    // Redirect to public video watch page
    router.push(`/videos/watch/${videoId}`);
  };

  const formatFileSize = (size: string | null) => {
    if (!size) return 'Unknown size';
    return size;
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
          <p className="text-gray-600">Loading resources...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Study Resources
              </h1>
              <p className="text-gray-600">Access comprehensive study materials and videos to boost your TET preparation</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/login')}
                className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition flex items-center gap-2"
              >
                Login
              </button>
              <button
                onClick={() => router.push('/register')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
              >
                <FaUserPlus />
                Get Access
              </button>
            </div>
          </div>
          
          {/* Preview info banner */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-400 p-4 rounded-lg mb-6">
            <div className="flex items-center gap-2 mb-1">
              <FaLock className="text-yellow-600" />
              <p className="text-yellow-800 font-semibold">Preview Mode</p>
            </div>
            <p className="text-yellow-700 text-sm">
              You can preview all content below. Get full access to unlock complete educational materials and resources!
            </p>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-6">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition ${
                activeTab === 'all' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              All Resources ({resources.length + videos.length})
            </button>
            <button
              onClick={() => setActiveTab('pdfs')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition ${
                activeTab === 'pdfs' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              PDFs ({resources.length})
            </button>
            <button
              onClick={() => setActiveTab('videos')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition ${
                activeTab === 'videos' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Videos ({videos.length})
            </button>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* PDF Resources */}
          {(activeTab === 'all' || activeTab === 'pdfs') && resources.map((resource) => (
            <div
              key={`pdf-${resource.id}`}
              onClick={() => handleResourceClick(resource.uuid)}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer overflow-hidden border group"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FaFileAlt className="text-red-500 text-xl" />
                    <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-xs font-medium">
                      PDF
                    </span>
                  </div>
                  <FaLock className="text-gray-400" />
                </div>
                
                <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {resource.title}
                </h3>
                
                {resource.description && (
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {resource.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <span>{resource.pageCount} pages</span>
                  <span>{formatFileSize(resource.fileSize)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {formatDate(resource.createdAt)}
                  </span>
                  <div className="flex items-center gap-1 text-blue-500 hover:text-blue-600">
                    <FaEye />
                    <span className="text-sm">Preview</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Video Resources */}
          {(activeTab === 'all' || activeTab === 'videos') && videos.map((video) => (
            <div
              key={`video-${video.id}`}
              onClick={() => handleVideoClick(video.uuid)}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer overflow-hidden border group"
            >
              {/* Video Thumbnail */}
              <div className="relative aspect-video bg-gray-200 overflow-hidden">
                {video.thumbnailUrl ? (
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                    <MdVideoLibrary className="text-white text-4xl" />
                  </div>
                )}
                
                {/* Play overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="bg-white bg-opacity-90 rounded-full p-3">
                    <FaPlay className="text-blue-600 text-xl ml-1" />
                  </div>
                </div>

                {/* Premium badge */}
                {video.isPremium && (
                  <div className="absolute top-2 right-2">
                    <span className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      <FaCrown />
                      Premium
                    </span>
                  </div>
                )}

                {/* Preview indicator */}
                <div className="absolute bottom-2 left-2">
                  <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                    Preview: {video.previewDuration}s
                  </span>
                </div>

                {/* Duration */}
                {video.duration && (
                  <div className="absolute bottom-2 right-2">
                    <span className="bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                      {video.duration}
                    </span>
                  </div>
                )}
              </div>

              {/* Video Content */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {video.title}
                </h3>
                
                {video.description && (
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {video.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    {video.category && (
                      <span className="flex items-center gap-1">
                        <MdCategory />
                        {video.category}
                      </span>
                    )}
                  </div>
                  <span className="flex items-center gap-1">
                    <FaClock />
                    {formatDate(video.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No content found */}
        {((activeTab === 'all' && resources.length === 0 && videos.length === 0) ||
          (activeTab === 'pdfs' && resources.length === 0) ||
          (activeTab === 'videos' && videos.length === 0)) && !loading && (
          <div className="text-center py-12">
            {activeTab === 'videos' ? (
              <MdVideoLibrary className="text-6xl text-gray-300 mx-auto mb-4" />
            ) : (
              <FaFileAlt className="text-6xl text-gray-300 mx-auto mb-4" />
            )}
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No {activeTab === 'all' ? 'resources' : activeTab} found
            </h3>
            <p className="text-gray-500">
              No {activeTab === 'all' ? 'content' : activeTab} is available at the moment
            </p>
          </div>
        )}
      </div>
    </div>
  );
}