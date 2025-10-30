"use client";

import { useEffect, useRef, useState } from "react";

interface ProtectedPDFViewerProps {
  pdfUrl: string;
  resourceTitle: string;
}

export default function ProtectedPDFViewer({
  pdfUrl,
  resourceTitle,
}: ProtectedPDFViewerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Disable right-click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // Disable specific keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent Ctrl+S, Ctrl+P, PrintScreen, Ctrl+Shift+I, F12
      if (
        (e.ctrlKey && (e.key === "s" || e.key === "p" || e.key === "S" || e.key === "P")) ||
        e.key === "PrintScreen" ||
        (e.ctrlKey && e.shiftKey && (e.key === "i" || e.key === "I")) ||
        e.key === "F12"
      ) {
        e.preventDefault();
        return false;
      }
    };

    // Disable drag and drop
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };

    // Disable text selection
    const handleSelectStart = (e: Event) => {
      e.preventDefault();
      return false;
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("dragstart", handleDragStart);
    document.addEventListener("selectstart", handleSelectStart);

    // Detect screenshot attempts (limited)
    const detectScreenshot = () => {
      if (document.hidden || document.visibilityState === "hidden") {
        console.warn("Potential screenshot attempt detected");
        // You could log this to your backend
      }
    };

    document.addEventListener("visibilitychange", detectScreenshot);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("dragstart", handleDragStart);
      document.removeEventListener("selectstart", handleSelectStart);
      document.removeEventListener("visibilitychange", detectScreenshot);
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      {/* Watermark overlay */}
      <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center opacity-10">
        <div className="transform rotate-[-45deg] text-6xl font-bold text-gray-500">
          {resourceTitle}
        </div>
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading PDF...</p>
          </div>
        </div>
      )}

      {/* PDF Viewer with protection */}
      <div
        className="relative w-full h-full select-none"
        style={{
          userSelect: "none",
          WebkitUserSelect: "none",
          MozUserSelect: "none",
          msUserSelect: "none",
        }}
      >
        {/* Transparent overlay to prevent interactions */}
        <div className="absolute inset-0 z-20 bg-transparent" />

        <iframe
          ref={iframeRef}
          src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
          className="w-full h-full border-0"
          onLoad={() => setLoading(false)}
          sandbox="allow-same-origin allow-scripts"
          style={{
            pointerEvents: "none",
            userSelect: "none",
          }}
          title={resourceTitle}
        />
      </div>

      {/* Bottom protection message */}
      <div className="absolute bottom-0 left-0 right-0 bg-red-600 text-white text-xs py-2 px-4 text-center z-30">
        ⚠️ This content is protected. Screenshots, downloads, and copying are disabled.
      </div>
    </div>
  );
}
