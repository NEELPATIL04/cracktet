'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaPlay, FaCrown, FaClock, FaTag, FaUserPlus, FaLock } from 'react-icons/fa';
import { MdVideoLibrary, MdCategory } from 'react-icons/md';

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

export default function PublicVideosPage() {
  const router = useRouter();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const response = await fetch('/api/videos'); // Use public endpoint
      
      if (response.ok) {
        const data = await response.json();
        setVideos(data.videos || []);
        
        const uniqueCategories = Array.from(
          new Set((data.videos || [])
            .map((v: Video) => v.category)
            .filter(Boolean))
        ) as string[];
        setCategories(uniqueCategories);
      } else {
        console.error('Failed to fetch videos:', response.status, await response.text());
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVideos = videos.filter(video => {
    const matchesCategory = selectedCategory === 'all' || video.category === selectedCategory;
    const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          video.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          video.tags?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleVideoClick = (videoUuid: string) => {
    // Redirect to public video watch page
    router.push(`/videos/watch/${videoUuid}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    if (diffDays <= 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays <= 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading videos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header with signup prompt */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                <MdVideoLibrary className="text-blue-500" />
                Video Library
              </h1>
              <p className="text-gray-600">Watch preview videos and unlock full access with a free account</p>
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
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-400 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <FaLock className="text-yellow-600" />
              <p className="text-yellow-800 font-semibold">Preview Mode</p>
            </div>
            <p className="text-yellow-700 text-sm">
              You can watch preview clips of all videos. Get access to unlock full access to our educational content!
            </p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search videos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="md:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Videos Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredVideos.map((video) => (
            <div
              key={video.id}
              onClick={() => handleVideoClick(video.uuid)}
              className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border group"
            >
              {/* Thumbnail */}
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


                {/* Duration */}
                {video.duration && (
                  <div className="absolute bottom-2 right-2">
                    <span className="bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                      {video.duration}
                    </span>
                  </div>
                )}
              </div>

              {/* Content */}
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

        {/* No videos found */}
        {filteredVideos.length === 0 && !loading && (
          <div className="text-center py-12">
            <MdVideoLibrary className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No videos found</h3>
            <p className="text-gray-500">
              {searchTerm || selectedCategory !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'No videos are available at the moment'}
            </p>
          </div>
        )}

        {/* Bottom CTA */}
        {filteredVideos.length > 0 && (
          <div className="mt-12 bg-blue-50 rounded-xl p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Ready for Full Access?
            </h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Get access to unlock complete videos, access study resources, and track your learning progress.
            </p>
            <button
              onClick={() => router.push('/register')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition flex items-center gap-2 mx-auto"
            >
              <FaUserPlus />
              Get Access Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}