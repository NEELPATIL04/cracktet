"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiChevronLeft, FiChevronRight } from "react-icons/fi";

interface MobilePDFViewerProps {
  pdfUrl: string;
  resourceTitle: string;
  userName: string;
  userEmail: string;
  userMobile: string;
  pageCount: number;
  resourceId: string;
}

export default function MobilePDFViewer({
  pdfUrl,
  resourceTitle,
  userName,
  userEmail,
  userMobile,
  pageCount,
  resourceId,
}: MobilePDFViewerProps) {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPageUrl, setCurrentPageUrl] = useState("");

  // Load specific page for mobile
  const loadPage = async (pageNum: number) => {
    try {
      setLoading(true);
      console.log(`📱 Loading mobile page ${pageNum} for resource ${resourceId}`);
      
      const response = await fetch(`/api/resources/${resourceId}/page/${pageNum}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setCurrentPageUrl(url);
      setLoading(false);
      
      console.log(`✅ Mobile page ${pageNum} loaded successfully`);
    } catch (err) {
      console.error(`❌ Error loading mobile page ${pageNum}:`, err);
      setError(err instanceof Error ? err.message : "Failed to load page");
      setLoading(false);
    }
  };

  // Load current page on mount or page change
  useEffect(() => {
    loadPage(currentPage);
    
    // Cleanup previous page URL
    return () => {
      if (currentPageUrl) {
        URL.revokeObjectURL(currentPageUrl);
      }
    };
  }, [currentPage, resourceId]);

  // Navigation functions
  const nextPage = () => {
    if (currentPage < pageCount) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Security measures for mobile
  useEffect(() => {
    const disableContextMenu = (e: Event) => {
      e.preventDefault();
      return false;
    };

    const disableKeyShortcuts = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && (e.key === 's' || e.key === 'p' || e.key === 'a' || e.key === 'c')) ||
        (e.metaKey && (e.key === 's' || e.key === 'p' || e.key === 'a' || e.key === 'c')) ||
        e.key === 'PrintScreen'
      ) {
        e.preventDefault();
        return false;
      }
    };

    // Add security event listeners
    document.addEventListener('contextmenu', disableContextMenu);
    document.addEventListener('keydown', disableKeyShortcuts);

    // Disable text selection
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('contextmenu', disableContextMenu);
      document.removeEventListener('keydown', disableKeyShortcuts);
      document.body.style.userSelect = '';
    };
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg">Loading PDF...</p>
          <p className="text-sm text-gray-300 mt-2">Page {currentPage} of {pageCount}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center text-white max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-red-400 mb-4">Error Loading PDF</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => router.push("/dashboard/resources")}
            className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors"
          >
            Back to Resources
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900 text-white">
      {/* Top Header */}
      <div className="absolute top-0 left-0 right-0 z-50 bg-gray-800 p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push("/dashboard/resources")}
            className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg transition-all"
          >
            <FiArrowLeft className="w-5 h-5" />
            <span className="text-sm">Back</span>
          </button>
          
          <div className="flex-1 text-center mx-4">
            <h1 className="text-lg font-semibold truncate">{resourceTitle}</h1>
            <p className="text-xs text-gray-300">📱 Mobile View</p>
          </div>
          
          <div className="text-sm text-gray-300">
            {pageCount} pages
          </div>
        </div>
      </div>

      {/* PDF Content Area */}
      <div className="relative w-full h-full pt-20 pb-16 bg-white">
        {currentPageUrl && (
          <>
            {/* PDF iframe */}
            <iframe
              src={`${currentPageUrl}#toolbar=0&navpanes=0&scrollbar=1&zoom=page-width`}
              className="w-full h-full border-0"
              title={`${resourceTitle} - Page ${currentPage}`}
              style={{ 
                WebkitUserSelect: 'none',
                userSelect: 'none',
                background: 'white'
              }}
            />
            
            {/* Mobile Watermarks */}
            <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute transform rotate-[-45deg] font-bold select-none"
                  style={{
                    left: `${(i % 3) * 33 + 10}%`,
                    top: `${Math.floor(i / 3) * 25 + 10}%`,
                    color: i % 2 === 0 ? '#3b82f6' : '#ef4444',
                    opacity: 0.1,
                    whiteSpace: 'nowrap',
                    fontSize: i % 2 === 0 ? '1.2rem' : '0.7rem',
                    fontWeight: 'bold'
                  }}
                >
                  {i % 2 === 0 ? (
                    'CrackTET'
                  ) : (
                    <div className="text-center leading-tight">
                      <div>{userName}</div>
                      <div style={{ fontSize: '0.5rem', marginTop: '1px' }}>{userEmail}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="absolute bottom-0 left-0 right-0 z-50 bg-gray-800 p-4">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={prevPage}
            disabled={currentPage <= 1}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:opacity-50 px-4 py-2 rounded-lg transition-all"
          >
            <FiChevronLeft className="w-5 h-5" />
            <span className="text-sm">Previous</span>
          </button>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-300">Page</span>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={currentPage}
                onChange={(e) => {
                  const page = Math.max(1, Math.min(pageCount, parseInt(e.target.value) || 1));
                  setCurrentPage(page);
                }}
                className="w-16 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-center text-white text-sm"
                min="1"
                max={pageCount}
              />
              <span className="text-sm text-gray-300">/ {pageCount}</span>
            </div>
          </div>

          <button
            onClick={nextPage}
            disabled={currentPage >= pageCount}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:opacity-50 px-4 py-2 rounded-lg transition-all"
          >
            <span className="text-sm">Next</span>
            <FiChevronRight className="w-5 h-5" />
          </button>
        </div>
        
        <div className="text-center">
          <p className="text-red-400 text-xs">
            🔒 Protected Content • {userName} • Screenshots Disabled
          </p>
        </div>
      </div>
    </div>
  );
}