"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiZoomIn, FiZoomOut, FiMaximize, FiMinimize } from "react-icons/fi";

interface ProtectedPDFViewerProps {
  pdfUrl: string;
  resourceTitle: string;
  userName: string;
  userEmail: string;
}

export default function ProtectedPDFViewer({
  pdfUrl,
  resourceTitle,
  userName,
  userEmail,
}: ProtectedPDFViewerProps) {
  console.log("🚀 ProtectedPDFViewer mounted with:", { pdfUrl, resourceTitle, userName, userEmail });

  const router = useRouter();
  const [isBlurred, setIsBlurred] = useState(false);
  const [devToolsOpen, setDevToolsOpen] = useState(false);
  const [scale, setScale] = useState(100);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Load PDF as blob
  useEffect(() => {
    const loadPDF = async () => {
      try {
        console.log("📄 Fetching PDF from:", pdfUrl);
        const response = await fetch(pdfUrl);

        if (!response.ok) {
          // Try to get error details from response
          let errorMsg = `HTTP ${response.status}: ${response.statusText}`;
          try {
            const errorData = await response.json();
            errorMsg = errorData.error || errorMsg;
          } catch {
            // Response is not JSON, use status text
          }
          console.error("❌ Server error:", errorMsg);
          throw new Error(errorMsg);
        }

        const blob = await response.blob();
        console.log("✅ PDF blob received, size:", blob.size);

        const url = URL.createObjectURL(blob);
        console.log("✅ PDF loaded as blob URL:", url);

        setPdfBlobUrl(url);
        setLoading(false);
      } catch (err: any) {
        console.error("❌ Error loading PDF:", err);
        setError(err.message || "Failed to load PDF");
        setLoading(false);
      }
    };

    loadPDF();

    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [pdfUrl]);

  // ✅ Detect DevTools opening
  useEffect(() => {
    const detectDevTools = () => {
      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;

      if (widthThreshold || heightThreshold) {
        setDevToolsOpen(true);
        console.clear();
      } else {
        setDevToolsOpen(false);
      }
    };

    const interval = setInterval(detectDevTools, 1000);
    return () => clearInterval(interval);
  }, [resourceTitle]);

  // ✅ Screenshot protection - ONLY for PrintScreen key
  useEffect(() => {
    const handleKeyUp = (e: KeyboardEvent) => {
      // Detect PrintScreen key ONLY
      if (e.key === "PrintScreen") {
        navigator.clipboard.writeText("Screenshot is disabled on this content");
        setIsBlurred(true);
        setTimeout(() => setIsBlurred(false), 2000);
      }
    };

    document.addEventListener("keyup", handleKeyUp);

    return () => {
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, [resourceTitle]);

  // ✅ Enhanced protection against screenshots and downloads
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      alert("❌ Right-click is disabled on this content");
      return false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC key to exit fullscreen
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
        return;
      }

      const forbiddenKeys = [
        e.ctrlKey && e.key === "s",
        e.ctrlKey && e.key === "S",
        e.ctrlKey && e.key === "p",
        e.ctrlKey && e.key === "P",
        e.ctrlKey && e.key === "c",
        e.ctrlKey && e.key === "C",
        e.ctrlKey && e.key === "a",
        e.ctrlKey && e.key === "A",
        e.key === "PrintScreen",
        e.ctrlKey && e.shiftKey && e.key === "I",
        e.ctrlKey && e.shiftKey && e.key === "i",
        e.ctrlKey && e.shiftKey && e.key === "J",
        e.ctrlKey && e.shiftKey && e.key === "j",
        e.ctrlKey && e.shiftKey && e.key === "C",
        e.ctrlKey && e.shiftKey && e.key === "c",
        e.key === "F12",
        e.metaKey && e.key === "s",
        e.metaKey && e.key === "S",
        e.metaKey && e.key === "p",
        e.metaKey && e.key === "P",
      ];

      if (forbiddenKeys.some((condition) => condition)) {
        e.preventDefault();
        e.stopPropagation();
        alert("❌ This action is disabled for content protection");
        return false;
      }
    };

    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    const handleSelectStart = (e: Event) => {
      e.preventDefault();
      return false;
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      alert("❌ Copying is disabled on this content");
      return false;
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown, { capture: true });
    document.addEventListener("dragstart", handleDragStart);
    document.addEventListener("selectstart", handleSelectStart);
    document.addEventListener("copy", handleCopy);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("dragstart", handleDragStart);
      document.removeEventListener("selectstart", handleSelectStart);
      document.removeEventListener("copy", handleCopy);
    };
  }, [resourceTitle, isFullscreen]);

  // ✅ Disable print media query
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @media print {
        body { display: none !important; }
      }
      iframe {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Disabled - was causing unwanted blurring when touching PDF

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 10, 200));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 10, 50));
  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-900 text-lg font-semibold">Loading PDF...</p>
          <p className="text-gray-600 text-sm mt-2">Please wait...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center max-w-lg p-8">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-2xl font-bold text-red-600 mb-4">Failed to Load PDF</h3>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-[100]' : 'relative w-full h-full'} bg-white flex flex-col`}>
      {/* DevTools Warning */}
      {devToolsOpen && (
        <div className="fixed inset-0 z-[100] bg-white bg-opacity-95 flex items-center justify-center">
          <div className="text-center text-gray-900 p-8">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-3xl font-bold mb-4">Developer Tools Detected</h2>
            <p className="text-xl mb-4">Please close developer tools.</p>
          </div>
        </div>
      )}

      {/* Screenshot Block */}
      {isBlurred && (
        <div className="fixed inset-0 z-[90] bg-black flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-4">🚫</div>
            <p className="text-xl font-semibold text-white">Screenshot Blocked</p>
          </div>
        </div>
      )}

      {/* Floating Toolbar */}
      <div className="absolute top-4 right-4 z-30 bg-primary text-white rounded-md shadow-lg flex items-center gap-1 px-2 py-1.5">
        <button
          onClick={() => router.push("/dashboard/resources")}
          className="p-1.5 hover:bg-white/20 rounded"
        >
          <FiArrowLeft className="w-5 h-5" />
        </button>
        <button
          onClick={handleZoomOut}
          disabled={scale <= 50}
          className="p-1.5 hover:bg-white/20 rounded disabled:opacity-50"
        >
          <FiZoomOut className="w-5 h-5" />
        </button>
        <span className="text-sm px-2 font-medium">{scale}%</span>
        <button
          onClick={handleZoomIn}
          disabled={scale >= 200}
          className="p-1.5 hover:bg-white/20 rounded disabled:opacity-50"
        >
          <FiZoomIn className="w-5 h-5" />
        </button>
        <button
          onClick={toggleFullscreen}
          className="p-1.5 hover:bg-white/20 rounded"
        >
          {isFullscreen ? <FiMinimize className="w-5 h-5" /> : <FiMaximize className="w-5 h-5" />}
        </button>
      </div>

      {/* PDF Container - ONLY PDF's own scrollbar */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 overflow-hidden">
        <div
          className="relative bg-white shadow-2xl"
          style={{
            width: '850px',
            height: '100%',
            transform: `scale(${scale / 100})`,
            transformOrigin: 'center'
          }}
        >
          {/* Watermarks */}
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-evenly z-10">
            <div className="transform rotate-[-45deg] text-7xl font-bold text-primary opacity-[0.02]">CrackTET</div>
            <div className="transform rotate-[-45deg] text-4xl font-semibold text-gray-800 opacity-[0.03]">{userName}</div>
            <div className="transform rotate-[-45deg] text-7xl font-bold text-primary opacity-[0.02]">CrackTET</div>
          </div>

          {/* PDF iframe with its own scrollbar */}
          {pdfBlobUrl && (
            <iframe
              src={`${pdfBlobUrl}#toolbar=0&navpanes=0&scrollbar=1`}
              className="w-full h-full border-0"
              title={resourceTitle}
            />
          )}
        </div>
      </div>

      {/* Bottom Warning */}
      {!isFullscreen && (
        <div className="flex-shrink-0 bg-red-600 text-white text-xs py-1.5 px-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold">⚠️ PROTECTED CONTENT</span>
            <span className="opacity-75">Licensed to: {userName}</span>
          </div>
        </div>
      )}
    </div>
  );
}
