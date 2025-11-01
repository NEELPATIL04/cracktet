"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiArrowLeft } from "react-icons/fi";

interface CustomMobilePDFViewerProps {
  pdfUrl: string;
  resourceTitle: string;
  userName: string;
  userEmail: string;
  userMobile: string;
  pageCount: number;
}

export default function CustomMobilePDFViewer({
  pdfUrl,
  resourceTitle,
  userName,
  userEmail,
  userMobile,
  pageCount,
}: CustomMobilePDFViewerProps) {
  const router = useRouter();

  console.log("📱 CustomMobilePDFViewer: Rendering custom viewer", { resourceTitle });

  // Screenshot protection and security measures
  useEffect(() => {
    // Disable right-click context menu
    const disableRightClick = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // Disable key combinations (Ctrl+S, Ctrl+P, etc.)
    const disableKeyShortcuts = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && (e.key === 's' || e.key === 'p' || e.key === 'a')) ||
        (e.metaKey && (e.key === 's' || e.key === 'p' || e.key === 'a')) ||
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.shiftKey && e.key === 'C') ||
        (e.ctrlKey && e.key === 'u') ||
        e.key === 'PrintScreen'
      ) {
        e.preventDefault();
        return false;
      }
    };

    // Blur content when page loses focus
    const handleVisibilityChange = () => {
      const pdfContainer = document.getElementById('custom-pdf-container');
      if (document.hidden && pdfContainer) {
        pdfContainer.style.filter = 'blur(10px)';
      } else if (pdfContainer) {
        pdfContainer.style.filter = 'none';
      }
    };

    // Disable text selection
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';

    // Add event listeners
    document.addEventListener('contextmenu', disableRightClick);
    document.addEventListener('keydown', disableKeyShortcuts);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      document.removeEventListener('contextmenu', disableRightClick);
      document.removeEventListener('keydown', disableKeyShortcuts);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
    };
  }, []);

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

  return (
    <div 
      id="custom-pdf-container"
      className="relative w-full h-screen bg-gray-900 text-white overflow-hidden"
      style={{
        WebkitUserSelect: 'none',
        userSelect: 'none',
        WebkitTouchCallout: 'none',
        WebkitUserDrag: 'none',
        KhtmlUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none'
      }}
    >
      {/* Header with Back Button and Title */}
      <div className="absolute top-0 left-0 right-0 z-50 bg-gray-800 p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push("/dashboard/resources")}
            className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg transition-all"
            title="Back to Resources"
          >
            <FiArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>
          
          <h1 className="text-lg font-semibold text-center flex-1 mx-4 truncate">
            {resourceTitle}
          </h1>
          
          <div className="text-sm text-gray-300">
            {pageCount} pages
          </div>
        </div>
      </div>

      {/* PDF Content Area */}
      <div className="relative w-full h-full pt-20 pb-20 bg-white">
        {/* Simple iframe with better mobile support */}
        <iframe
          src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1&zoom=page-width`}
          className="w-full h-full border-0"
          title={`${resourceTitle}`}
          style={{ 
            WebkitUserSelect: 'none',
            userSelect: 'none',
            background: 'white'
          }}
          allow="fullscreen"
        />
        
        {/* Heavy Watermark Overlay */}
        <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
          {/* Dense watermark grid */}
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="absolute transform rotate-[-45deg] font-bold select-none"
              style={{
                left: `${(i % 8) * 12.5 + 5}%`,
                top: `${Math.floor(i / 8) * 20 + 5}%`,
                color: i % 2 === 0 ? '#0d599c' : '#dc2626',
                opacity: 0.2,
                whiteSpace: 'nowrap',
                fontSize: i % 2 === 0 ? '1.5rem' : '0.8rem',
                fontWeight: 'bold',
                textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
              }}
            >
              {i % 2 === 0 ? (
                'CrackTET'
              ) : (
                <div className="text-center leading-tight">
                  <div>{userName}</div>
                  <div style={{ fontSize: '0.6rem', marginTop: '1px' }}>{userEmail}</div>
                  <div style={{ fontSize: '0.6rem' }}>{userMobile}</div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Additional Corner Watermarks */}
        <div className="absolute top-4 right-4 text-blue-600 font-bold text-xl opacity-30 z-40 rotate-[-15deg]">
          CrackTET
        </div>
        <div className="absolute bottom-4 left-4 text-red-600 font-bold text-sm opacity-40 z-40 rotate-[15deg]">
          {userName}
        </div>
      </div>

      {/* Bottom Protection Notice */}
      <div className="absolute bottom-0 left-0 right-0 z-50 bg-gray-800 p-3">
        <div className="text-center">
          <p className="text-red-400 text-xs">
            🔒 Protected Content - Screenshots prohibited • {userName} • {userEmail}
          </p>
          <p className="text-gray-400 text-xs mt-1">
            Scroll to navigate through {pageCount} pages
          </p>
        </div>
      </div>
    </div>
  );
}