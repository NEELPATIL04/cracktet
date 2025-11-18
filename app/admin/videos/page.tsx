'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '../components/AdminLayout';
import { FaPlus, FaEdit, FaTrash, FaEye, FaEyeSlash, FaVideo, FaUpload, FaYoutube, FaClock } from 'react-icons/fa';
import { MdVideoLibrary } from 'react-icons/md';
import VideoDurationExtractor from '@/components/VideoDurationExtractor';

interface Video {
  id: number;
  uuid: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  videoUrl: string;
  videoType: string;
  duration: string | null;
  category: string | null;
  tags: string | null;
  views: number;
  isActive: boolean;
  isPremium: boolean;
  previewDuration: number;
  sortOrder: number;
  createdAt: string;
}

export default function AdminVideosPage() {
  const router = useRouter();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDurationExtractor, setShowDurationExtractor] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    videoUrl: '',
    videoType: 'youtube',
    category: '',
    tags: '',
    isPremium: false,
    previewDuration: 20,
    sortOrder: 0,
  });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const response = await fetch('/api/admin/videos');
      if (response.ok) {
        const data = await response.json();
        setVideos(data.videos);
      } else if (response.status === 401) {
        router.push('/admin/login');
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/admin/videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowAddModal(false);
        setFormData({
          title: '',
          description: '',
          videoUrl: '',
          videoType: 'youtube',
          category: '',
          tags: '',
          isPremium: false,
          previewDuration: 20,
          sortOrder: 0,
        });
        fetchVideos();
      }
    } catch (error) {
      console.error('Error adding video:', error);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!uploadFile) return;

    const uploadFormData = new FormData();
    uploadFormData.append('video', uploadFile);
    uploadFormData.append('title', formData.title);
    uploadFormData.append('description', formData.description);
    uploadFormData.append('category', formData.category);
    uploadFormData.append('tags', formData.tags);
    uploadFormData.append('isPremium', formData.isPremium.toString());
    uploadFormData.append('previewDuration', formData.previewDuration.toString());
    uploadFormData.append('sortOrder', formData.sortOrder.toString());
    uploadFormData.append('watermark', 'true');

    setUploading(true);
    setUploadProgress(0);

    try {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          setUploadProgress(percentComplete);
        }
      });

      xhr.addEventListener('load', async () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          
          // If thumbnail file is provided, upload it separately
          if (thumbnailFile && response.video) {
            try {
              const thumbnailFormData = new FormData();
              thumbnailFormData.append('thumbnail', thumbnailFile);
              
              await fetch(`/api/admin/videos/${response.video.uuid}/thumbnail`, {
                method: 'POST',
                body: thumbnailFormData
              });
            } catch (error) {
              console.error('Error uploading thumbnail:', error);
            }
          }
          
          setShowUploadModal(false);
          setUploadFile(null);
          setThumbnailFile(null);
          setFormData({
            title: '',
            description: '',
            videoUrl: '',
            videoType: 'youtube',
            category: '',
            tags: '',
            isPremium: false,
            previewDuration: 20,
            sortOrder: 0,
          });
          fetchVideos();
        }
        setUploading(false);
      });

      xhr.addEventListener('error', () => {
        console.error('Upload failed');
        setUploading(false);
      });

      xhr.open('POST', '/api/admin/videos/upload');
      xhr.send(uploadFormData);
    } catch (error) {
      console.error('Error uploading video:', error);
      setUploading(false);
    }
  };

  const toggleVideoStatus = async (videoId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/videos/${videoId}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        fetchVideos();
      }
    } catch (error) {
      console.error('Error toggling video status:', error);
    }
  };

  const deleteVideo = async (videoId: string) => {
    if (!confirm('Are you sure you want to delete this video?')) return;

    try {
      const response = await fetch(`/api/admin/videos/${videoId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchVideos();
      }
    } catch (error) {
      console.error('Error deleting video:', error);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MdVideoLibrary className="text-blue-500" />
            Video Management
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
            >
              <FaYoutube />
              Add External Video
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
            >
              <FaUpload />
              Upload Video
            </button>
            <button
              onClick={() => setShowDurationExtractor(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
            >
              <FaClock />
              Fix Durations
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thumbnail
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Premium
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Preview (sec)
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {videos.map((video) => (
                    <tr key={video.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="w-16 h-9 rounded overflow-hidden bg-gray-100">
                          {video.thumbnailUrl ? (
                            <img
                              src={video.thumbnailUrl}
                              alt={video.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Show fallback icon if thumbnail fails to load
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const fallback = document.createElement('div');
                                fallback.className = 'w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600';
                                fallback.innerHTML = '<svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M4 4h16v16H4z"/></svg>';
                                target.parentNode?.appendChild(fallback);
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                              <MdVideoLibrary className="text-white text-sm" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{video.title}</div>
                          {video.description && (
                            <div className="text-xs text-gray-500 truncate max-w-xs">
                              {video.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          video.videoType === 'upload' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {video.videoType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {video.category || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {video.duration || '-'}
                      </td>
                      <td className="px-4 py-3">
                        {video.isPremium ? (
                          <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                            Premium
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                            Free
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {video.previewDuration}s
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleVideoStatus(video.uuid, video.isActive)}
                          className={`p-1 rounded ${
                            video.isActive
                              ? 'text-green-600 hover:bg-green-100'
                              : 'text-gray-400 hover:bg-gray-100'
                          }`}
                        >
                          {video.isActive ? <FaEye /> : <FaEyeSlash />}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => deleteVideo(video.uuid)}
                            className="text-red-600 hover:bg-red-100 p-1 rounded"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add External Video Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">Add External Video</h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Video Type *
                  </label>
                  <select
                    value={formData.videoType}
                    onChange={(e) => setFormData({ ...formData, videoType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="youtube">YouTube</option>
                    <option value="vimeo">Vimeo</option>
                    <option value="embed">Embed URL</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Video URL *
                  </label>
                  <input
                    type="url"
                    value={formData.videoUrl}
                    onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://youtube.com/watch?v=..."
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="tag1, tag2, tag3"
                  />
                </div>

                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isPremium}
                      onChange={(e) => setFormData({ ...formData, isPremium: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Premium Content</span>
                  </label>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Add Video
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Upload Video Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">Upload Video</h2>
              <form onSubmit={handleUpload}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Video File *
                  </label>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  {uploadFile && (
                    <p className="text-sm text-gray-500 mt-1">
                      Selected: {uploadFile.name} ({(uploadFile.size / (1024 * 1024)).toFixed(2)} MB)
                    </p>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thumbnail Image (Optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {thumbnailFile && (
                    <p className="text-sm text-gray-500 mt-1">
                      Selected: {thumbnailFile.name} ({(thumbnailFile.size / (1024 * 1024)).toFixed(2)} MB)
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    Recommended: 1280x720 pixels, JPEG/PNG/WebP, max 5MB
                  </p>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="tag1, tag2, tag3"
                  />
                </div>

                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isPremium}
                      onChange={(e) => setFormData({ ...formData, isPremium: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Premium Content</span>
                  </label>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preview Duration (seconds)
                  </label>
                  <input
                    type="number"
                    value={formData.previewDuration}
                    onChange={(e) => setFormData({ ...formData, previewDuration: parseInt(e.target.value) || 20 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="5"
                    max="300"
                    placeholder="20"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    How many seconds non-premium users can watch (5-300 seconds)
                  </p>
                </div>

                {uploading && (
                  <div className="mb-4">
                    <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-500 h-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Uploading and processing... {uploadProgress.toFixed(0)}%
                    </p>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUploadModal(false);
                      setUploadFile(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    disabled={uploading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={uploading || !uploadFile}
                  >
                    {uploading ? 'Uploading...' : 'Upload Video'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Duration Extractor Modal */}
        {showDurationExtractor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-bold">Fix Video Durations</h2>
                <button
                  onClick={() => setShowDurationExtractor(false)}
                  className="text-gray-500 hover:text-gray-700 text-xl font-bold"
                >
                  ×
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <VideoDurationExtractor 
                  onComplete={() => {
                    fetchVideos(); // Refresh the video list
                    setShowDurationExtractor(false);
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}