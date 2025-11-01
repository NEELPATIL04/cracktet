"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FiFile, FiEye, FiAlertCircle } from "react-icons/fi";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";

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
  const { t } = useLanguage();
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ scale: 1.2, opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="relative w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64"
        >
          <Image
            src="/images/circle-logo.jpeg"
            alt="CrackTET Logo"
            fill
            className="object-contain"
            priority
          />
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full overflow-y-auto">
        <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary mb-2">
              {t.resources.title}
            </h1>
            <p className="text-sm md:text-base text-gray-600">
              {t.resources.subtitle}
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-xl p-4 md:p-6 text-center"
          >
            <FiAlertCircle className="w-10 h-10 md:w-12 md:h-12 text-red-600 mx-auto mb-4" />
            <p className="text-sm md:text-base text-red-600 mb-4">{error}</p>
            <button
              onClick={() => {
                setError("");
                setLoading(true);
                window.location.reload();
              }}
              className="px-4 md:px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors font-medium text-sm md:text-base"
            >
              {t.resources.retry}
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary mb-2">
            {t.resources.title}
          </h1>
          <p className="text-sm md:text-base text-gray-600">
            {t.resources.subtitle}
          </p>
        </motion.div>

        {/* Resources Grid */}
        {resources.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-8 md:p-12 text-center"
          >
            <FiFile className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
              {t.resources.noResources}
            </h3>
            <p className="text-sm md:text-base text-gray-600">
              {t.resources.noResourcesMessage}
            </p>
          </motion.div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-between"
            >
              <p className="text-xs md:text-sm text-gray-600">
                {t.resources.showing} <span className="font-semibold text-primary">{resources.length}</span> {resources.length !== 1 ? t.resources.resources : t.resources.resource}
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
            {resources.map((resource, index) => (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="bg-white rounded-lg md:rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group"
              >
                <div className="p-4 md:p-6">
                  <div className="flex items-start justify-between mb-3 md:mb-4">
                    <div className="p-2 md:p-3 bg-gray-100 rounded-lg group-hover:scale-110 transition-transform">
                      <FiFile className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                    </div>
                    <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      #{resource.id}
                    </span>
                  </div>

                  <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
                    {resource.title}
                  </h3>

                  <p className="text-xs md:text-sm text-gray-600 mb-3 md:mb-4 line-clamp-2 min-h-[32px] md:min-h-[40px]">
                    {resource.description || "No description available"}
                  </p>

                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3 md:mb-4 pb-3 md:pb-4 border-b border-gray-200">
                    <div>
                      <p className="font-medium text-gray-700 text-xs md:text-sm">
                        {resource.fileSize}
                      </p>
                      <p className="text-xs">{t.resources.fileSize}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-700 text-xs md:text-sm">
                        {new Date(resource.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        })}
                      </p>
                      <p className="text-xs">{t.resources.added}</p>
                    </div>
                  </div>

                  <Link
                    href={`/dashboard/resources/view/${resource.uuid}`}
                    className="flex items-center justify-center space-x-2 w-full bg-primary hover:bg-primary-dark text-white py-2 md:py-3 px-3 md:px-4 rounded-lg transition-colors font-medium text-sm md:text-base group-hover:shadow-lg"
                  >
                    <FiEye className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    <span>{t.resources.viewResource}</span>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}
      </div>
    </div>
  );
}
