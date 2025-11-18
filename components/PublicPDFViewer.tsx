"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiZoomIn, FiZoomOut, FiUser, FiCreditCard } from "react-icons/fi";
import { useLanguage } from "@/contexts/LanguageContext";

interface PublicPDFViewerProps {
  pdfUrl: string;
  resourceTitle: string;
  pageCount: number;
  previewPages: number;
  resourceId: string;
}

export default function PublicPDFViewer({
  pdfUrl,
  resourceTitle,
  pageCount,
  previewPages,
  resourceId,
}: PublicPDFViewerProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const [scale, setScale] = useState(100);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    console.log("🔄 PublicPDFViewer mounted for resource:", resourceId);
    console.log(`📄 Preview: ${previewPages} pages of ${pageCount} total`);
  }, [resourceId, previewPages, pageCount]);

  const handleZoomIn = () => {
    const newScale = Math.min(scale + 25, 200);
    setScale(newScale);
    updateIframeZoom(newScale);
  };

  const handleZoomOut = () => {
    const newScale = Math.max(scale - 25, 50);
    setScale(newScale);
    updateIframeZoom(newScale);
  };

  const updateIframeZoom = (newScale: number) => {
    if (iframeRef.current?.contentDocument) {
      const iframeDoc = iframeRef.current.contentDocument;
      iframeDoc.body.style.zoom = `${newScale}%`;
    }
  };

  const handleIframeLoad = () => {
    console.log("✅ Preview PDF loaded successfully");
    setLoading(false);
    updateIframeZoom(scale);
  };

  const handleIframeError = () => {
    console.error("❌ Failed to load preview PDF");
    setError("Failed to load PDF preview");
    setLoading(false);
  };

  const handleUpgrade = () => {
    router.push("/register");
  };

  const handleLogin = () => {
    router.push("/login");
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiArrowLeft />
            <span>Back</span>
          </button>
          <div>
            <h1 className="text-lg font-semibold text-gray-800 truncate max-w-md">
              {resourceTitle}
            </h1>
            <p className="text-sm text-gray-500">
              Preview Mode - {previewPages} of {pageCount} pages
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Zoom Controls */}
          <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={handleZoomOut}
              className="p-2 hover:bg-gray-200 rounded transition-colors"
              disabled={scale <= 50}
            >
              <FiZoomOut className="w-4 h-4" />
            </button>
            <span className="px-2 text-sm font-medium min-w-12 text-center">
              {scale}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-2 hover:bg-gray-200 rounded transition-colors"
              disabled={scale >= 200}
            >
              <FiZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Action Buttons */}
          <button
            onClick={handleLogin}
            className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center space-x-2"
          >
            <FiUser className="w-4 h-4" />
            <span>Login</span>
          </button>
          <button
            onClick={handleUpgrade}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center space-x-2"
          >
            <FiCreditCard className="w-4 h-4" />
            <span>Get Full Access</span>
          </button>
        </div>
      </div>

      {/* Preview Banner */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-b border-yellow-200 px-4 py-3">
        <div className="flex items-center justify-center space-x-2">
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
          <p className="text-yellow-800 font-medium text-center">
            🔒 Preview Mode: Viewing {previewPages} of {pageCount} pages. 
            <span className="font-semibold ml-1">Register to access all content!</span>
          </p>
        </div>
      </div>

      {/* PDF Container */}
      <div className="flex-1 relative bg-gray-200">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading preview...</p>
            </div>
          </div>
        )}

        {error ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center max-w-md px-6">
              <div className="text-6xl mb-4">📄</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Preview Unavailable
              </h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            src={pdfUrl}
            className="w-full h-full border-0"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            title={`Preview: ${resourceTitle}`}
            style={{
              backgroundColor: "#f8f9fa",
              border: "none",
              outline: "none",
            }}
          />
        )}
      </div>

      {/* Upgrade Prompt Footer */}
      <div className="bg-white border-t border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary bg-opacity-10 rounded-full flex items-center justify-center">
              <FiCreditCard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-gray-800">
                Want to see all {pageCount} pages?
              </p>
              <p className="text-sm text-gray-600">
                Join thousands of students preparing for Maharashtra TET
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleLogin}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Already have an account?
            </button>
            <button
              onClick={handleUpgrade}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium"
            >
              Register Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}