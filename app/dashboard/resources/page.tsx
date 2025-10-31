"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FiFile, FiEye, FiAlertCircle } from "react-icons/fi";
import Link from "next/link";

interface Resource {
  id: number;
  uuid: string;
  title: string;
  description: string;
  fileName: string;
  fileSize: string;
  createdAt: string;
}

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const response = await fetch("/api/resources");

        if (response.status === 401) {
          router.push("/login");
          return;
        }

        if (response.ok) {
          const data = await response.json();
          setResources(data.resources || []);
        } else {
          const errorData = await response.json();
          setError(errorData.error || "Failed to load resources");
        }
      } catch (error) {
        console.error("Error fetching resources:", error);
        setError("Failed to load resources. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, [router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center space-y-4"
        >
          <div className="relative w-20 h-20">
            <motion.div
              className="absolute inset-0 border-4 border-primary rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              style={{ borderTopColor: "transparent" }}
            />
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-primary text-lg font-semibold"
          >
            Loading resources...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">
            Study Resources
          </h1>
          <p className="text-gray-600">
            Access your study materials and PDF resources
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-xl p-6 text-center"
        >
          <FiAlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => {
              setError("");
              setLoading(true);
              window.location.reload();
            }}
            className="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors font-medium"
          >
            Retry
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-3xl font-bold text-primary mb-2">
          Study Resources
        </h1>
        <p className="text-gray-600">
          Access your study materials and PDF resources
        </p>
      </motion.div>

      {/* Resources Grid */}
      {resources.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-12 text-center"
        >
          <FiFile className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Resources Available
          </h3>
          <p className="text-gray-600">
            Study materials will appear here once uploaded by admin.
          </p>
        </motion.div>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-between"
          >
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold text-primary">{resources.length}</span> resource{resources.length !== 1 ? 's' : ''}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((resource, index) => (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-secondary-gray rounded-lg group-hover:scale-110 transition-transform">
                      <FiFile className="w-8 h-8 text-primary" />
                    </div>
                    <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      #{resource.id}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
                    {resource.title}
                  </h3>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-2 min-h-[40px]">
                    {resource.description || "No description available"}
                  </p>

                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4 pb-4 border-b border-gray-200">
                    <div>
                      <p className="font-medium text-gray-700">
                        {resource.fileSize}
                      </p>
                      <p className="text-xs">File Size</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-700">
                        {new Date(resource.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        })}
                      </p>
                      <p className="text-xs">Added</p>
                    </div>
                  </div>

                  <Link
                    href={`/dashboard/resources/view/${resource.uuid}`}
                    className="flex items-center justify-center space-x-2 w-full bg-primary hover:bg-primary-dark text-white py-3 px-4 rounded-lg transition-colors font-medium group-hover:shadow-lg"
                  >
                    <FiEye className="w-4 h-4" />
                    <span>View Resource</span>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
