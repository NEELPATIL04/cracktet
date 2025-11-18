"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import AdminLayout from "../components/AdminLayout";
import { FaFileAlt, FaSpinner, FaTrash, FaUpload, FaEye, FaEyeSlash, FaImage } from "react-icons/fa";

interface Resource {
  id: number;
  uuid: string;
  title: string;
  description: string;
  fileName: string;
  fileSize: string;
  pageCount: number;
  isActive: boolean;
  isPremium: boolean;
  previewPages: number;
  createdAt: string;
}

export default function AdminResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [convertingId, setConvertingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    file: null as File | null,
    isPremium: false,
    previewPages: 3,
  });
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      const response = await fetch("/api/admin/resources");
      if (response.ok) {
        const data = await response.json();
        setResources(data.resources);
      }
    } catch (error) {
      console.error("Error fetching resources:", error);
      setError("Failed to load resources");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === "application/pdf") {
        setFormData({ ...formData, file });
      } else {
        alert("Please select a PDF file");
        e.target.value = "";
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.file || !formData.title) {
      setError("Please fill in all required fields");
      return;
    }

    setUploading(true);
    setUploadSuccess("");
    setError("");

    const uploadFormData = new FormData();
    uploadFormData.append("file", formData.file);
    uploadFormData.append("title", formData.title);
    uploadFormData.append("description", formData.description);
    uploadFormData.append("isPremium", formData.isPremium.toString());
    uploadFormData.append("previewPages", formData.previewPages.toString());

    try {
      const response = await fetch("/api/admin/resources/upload", {
        method: "POST",
        body: uploadFormData,
      });

      if (response.ok) {
        setUploadSuccess("Resource uploaded successfully!");
        setFormData({ title: "", description: "", file: null, isPremium: false, previewPages: 3 });
        fetchResources();
        setTimeout(() => {
          setShowUploadModal(false);
          setUploadSuccess("");
        }, 2000);
      } else {
        const data = await response.json();
        setError(data.error || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      setError("Failed to upload resource");
    } finally {
      setUploading(false);
    }
  };

  const handleToggleActive = async (id: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/resources/${id}/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        fetchResources();
      }
    } catch (error) {
      console.error("Error toggling resource:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this resource? This action cannot be undone.")) {
      return;
    }

    setDeletingId(id);
    try {
      const response = await fetch(`/api/admin/resources/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setResources((prev) => prev.filter((r) => r.id !== id));
        alert("Resource deleted successfully!");
      } else {
        alert("Failed to delete resource");
      }
    } catch (error) {
      console.error("Error deleting resource:", error);
      alert("Failed to delete resource");
    } finally {
      setDeletingId(null);
    }
  };

  const handleConvertToImages = async (id: number, uuid: string) => {
    if (!confirm("This will convert the PDF to images for mobile viewing. Continue?")) {
      return;
    }

    setConvertingId(id);
    try {
      const response = await fetch(`/api/admin/convert-to-images/${uuid}`, {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Successfully converted ${data.converted || 0} pages to images!`);
      } else {
        alert(`Failed to convert images: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error converting to images:", error);
      alert("Failed to convert to images");
    } finally {
      setConvertingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <AdminLayout>
      {/* Upload Modal */}
      {showUploadModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowUploadModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-primary flex items-center">
                <FaUpload className="mr-3" /> Upload PDF Resource
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {uploadSuccess && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-600">{uploadSuccess}</p>
              </div>
            )}

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                  placeholder="Enter resource title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                  placeholder="Enter description (optional)"
                />
              </div>


              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PDF File *
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  required
                  onChange={handleFileChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                />
                {formData.file && (
                  <p className="text-sm text-gray-600 mt-2">
                    Selected: {formData.file.name} ({(formData.file.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              {/* Premium Settings */}
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-lg font-medium text-gray-900 mb-3">Access Settings</h4>
                
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    id="isPremium"
                    checked={formData.isPremium}
                    onChange={(e) => setFormData({ ...formData, isPremium: e.target.checked })}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label htmlFor="isPremium" className="ml-2 block text-sm text-gray-700">
                    Premium Content (requires paid access)
                  </label>
                </div>

                {formData.isPremium && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preview Pages (for non-premium users) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={formData.previewPages}
                      onChange={(e) => setFormData({ ...formData, previewPages: parseInt(e.target.value) || 3 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                      placeholder="Number of pages to show in preview"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Non-premium users will only see the first {formData.previewPages} pages
                    </p>
                  </div>
                )}
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  {uploading ? (
                    <span className="flex items-center justify-center">
                      <FaSpinner className="animate-spin mr-2" />
                      Uploading...
                    </span>
                  ) : (
                    "Upload Resource"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}

      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">Resources Management</h1>
          <p className="text-gray-600">Upload and manage PDF study materials</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          <FaUpload />
          <span>Upload PDF</span>
        </button>
      </div>

      {loading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <FaSpinner className="text-5xl text-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading resources...</p>
        </motion.div>
      ) : error ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-red-50 border border-red-200 rounded-lg p-6 text-center"
        >
          <p className="text-red-600">{error}</p>
        </motion.div>
      ) : resources.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-lg shadow-lg p-12 text-center"
        >
          <FaFileAlt className="text-6xl text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No resources uploaded yet</p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-xl shadow-md overflow-hidden"
        >
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-primary text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Title</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">File Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Size</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Pages</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Access</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Uploaded At</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {resources.map((resource, index) => (
                  <motion.tr
                    key={resource.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-gray-900">{resource.id}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{resource.title}</div>
                      {resource.description && (
                        <div className="text-sm text-gray-500">{resource.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{resource.fileName}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{resource.fileSize}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{resource.pageCount}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            resource.isPremium
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {resource.isPremium ? "Premium" : "Free"}
                        </span>
                        {resource.isPremium && (
                          <span className="text-xs text-gray-500">
                            Preview: {resource.previewPages} pages
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          resource.isActive
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {resource.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{formatDate(resource.createdAt)}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleToggleActive(resource.id, resource.isActive)}
                          className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                          title={resource.isActive ? "Deactivate" : "Activate"}
                        >
                          {resource.isActive ? <FaEyeSlash /> : <FaEye />}
                        </button>
                        <button
                          onClick={() => handleConvertToImages(resource.id, resource.uuid)}
                          disabled={convertingId === resource.id}
                          className="inline-flex items-center px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Convert to Images for Mobile"
                        >
                          {convertingId === resource.id ? (
                            <FaSpinner className="animate-spin" />
                          ) : (
                            <FaImage />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(resource.id)}
                          disabled={deletingId === resource.id}
                          className="inline-flex items-center px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deletingId === resource.id ? (
                            <FaSpinner className="animate-spin" />
                          ) : (
                            <FaTrash />
                          )}
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-200">
            {resources.map((resource, index) => (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-lg text-gray-900">{resource.title}</h3>
                  <span className="bg-primary text-white px-3 py-1 rounded-full text-xs font-semibold">
                    ID: {resource.id}
                  </span>
                </div>
                {resource.description && (
                  <p className="text-sm text-gray-600 mb-3">{resource.description}</p>
                )}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">File:</span>
                    <span className="text-gray-900 font-medium">{resource.fileName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Size:</span>
                    <span className="text-gray-900 font-medium">{resource.fileSize}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pages:</span>
                    <span className="text-gray-900 font-medium">{resource.pageCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Access:</span>
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          resource.isPremium
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {resource.isPremium ? "Premium" : "Free"}
                      </span>
                      {resource.isPremium && (
                        <span className="text-xs text-gray-500">
                          Preview: {resource.previewPages} pages
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Status:</span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        resource.isActive
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {resource.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Uploaded:</span>
                    <span className="text-gray-900 font-medium">{formatDate(resource.createdAt)}</span>
                  </div>
                </div>
                <div className="mt-4 flex space-x-2">
                  <button
                    onClick={() => handleToggleActive(resource.id, resource.isActive)}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    {resource.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    onClick={() => handleDelete(resource.id)}
                    disabled={deletingId === resource.id}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deletingId === resource.id ? (
                      <FaSpinner className="animate-spin" />
                    ) : (
                      <>
                        <FaTrash className="mr-2" />
                        Delete
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Summary */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              Total Resources: <span className="font-semibold text-primary">{resources.length}</span>
            </p>
          </div>
        </motion.div>
      )}
    </AdminLayout>
  );
}
