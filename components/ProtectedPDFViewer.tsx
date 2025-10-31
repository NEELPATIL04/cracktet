"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiZoomIn, FiZoomOut, FiMaximize, FiMinimize, FiX } from "react-icons/fi";
import { useLanguage } from "@/contexts/LanguageContext";

interface ProtectedPDFViewerProps {
  pdfUrl: string;
  resourceTitle: string;
  userName: string;
  userEmail: string;
  userMobile: string;
}

export default function ProtectedPDFViewer({
  pdfUrl,
  resourceTitle,
  userName,
  userEmail,
  userMobile,
}: ProtectedPDFViewerProps) {
  console.log("🚀 ProtectedPDFViewer mounted with:", { pdfUrl, resourceTitle, userName, userEmail, userMobile });

  const router = useRouter();
  const { t } = useLanguage();
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const [isBlurred, setIsBlurred] = useState(false);
  const [devToolsOpen, setDevToolsOpen] = useState(false);
  const [devToolsShownOnce, setDevToolsShownOnce] = useState(false);
  const [scale, setScale] = useState(100);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showViolationPopup, setShowViolationPopup] = useState(false);
  const [violationCount, setViolationCount] = useState(0);
  const [showWarningPopup, setShowWarningPopup] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [showInitialWarning, setShowInitialWarning] = useState(true);
  const [pdfReady, setPdfReady] = useState(false);

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
        setPdfReady(true);
        setLoading(false);
      } catch (err) {
        console.error("❌ Error loading PDF:", err);
        setError(err instanceof Error ? err.message : "Failed to load PDF");
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
      // Skip detection in fullscreen mode to prevent false positives
      if (isFullscreen) {
        return;
      }
      
      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;

      if (widthThreshold || heightThreshold) {
        if (!devToolsShownOnce) {
          setDevToolsOpen(true);
          setDevToolsShownOnce(true);
          setTimeout(() => setDevToolsOpen(false), 5000); // Hide after 5 seconds
        }
        console.clear();
      }
    };

    const interval = setInterval(detectDevTools, 1000);
    return () => clearInterval(interval);
  }, [resourceTitle, isFullscreen]);

  // ✅ Enhanced screenshot protection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Block all screenshot shortcuts
      const screenshotKeys = [
        e.key === "PrintScreen",
        // Windows Snipping Tool (Win+Shift+S)
        (e.key === "s" || e.key === "S") && e.shiftKey && e.metaKey,
        (e.key === "s" || e.key === "S") && e.shiftKey && e.ctrlKey,
        // Mac screenshot shortcuts
        e.metaKey && e.shiftKey && e.key === "3",
        e.metaKey && e.shiftKey && e.key === "4",
        e.metaKey && e.shiftKey && e.key === "5",
        e.key === "F13", // Mac Print Screen equivalent
      ];

      if (screenshotKeys.some(condition => condition)) {
        e.preventDefault();
        e.stopPropagation();

        const newCount = violationCount + 1;
        setViolationCount(newCount);
        setShowViolationPopup(true);
        setIsBlurred(true);

        // Log violation to API
        fetch('/api/log-violation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'screenshot_attempt',
            userEmail,
            userName,
            resourceTitle,
            violationNumber: newCount,
            timestamp: new Date().toISOString()
          })
        }).catch(err => console.error('Failed to log violation:', err));

        navigator.clipboard.writeText("Screenshot is disabled - Violation recorded");

        // Check if 3 strikes reached
        if (newCount >= 3) {
          setTimeout(() => {
            // Force logout
            fetch('/api/user/logout', { method: 'POST' })
              .then(() => {
                window.location.href = '/login?reason=violations';
              });
          }, 2000);
        } else {
          setTimeout(() => {
            setIsBlurred(false);
            setShowViolationPopup(false);
          }, 3000);
        }

        return false;
      }
    };

    document.addEventListener("keydown", handleKeyDown, { capture: true });

    return () => {
      document.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, [violationCount]);

  // ✅ Aggressive F12 blocker for fullscreen mode
  useEffect(() => {
    if (!isFullscreen) return;

    const blockF12 = (e: KeyboardEvent) => {
      if (e.key === "F12" || e.keyCode === 123) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        console.log("🚫 F12 blocked in fullscreen");
        setWarningMessage("Developer tools are disabled in fullscreen mode");
        setShowWarningPopup(true);
        setTimeout(() => setShowWarningPopup(false), 3000);
        return false;
      }
    };

    // Add multiple event listeners to catch F12
    document.addEventListener("keydown", blockF12, { capture: true, passive: false });
    window.addEventListener("keydown", blockF12, { capture: true, passive: false });
    document.body.addEventListener("keydown", blockF12, { capture: true, passive: false });

    return () => {
      document.removeEventListener("keydown", blockF12, { capture: true });
      window.removeEventListener("keydown", blockF12, { capture: true });
      document.body.removeEventListener("keydown", blockF12, { capture: true });
    };
  }, [isFullscreen]);

  // ✅ Aggressive right-click blocker for all resource routes (Mac compatible)
  useEffect(() => {

    const blockRightClick = (e: Event) => {
      console.log("🚫 Right-click detected, blocking...", e.type, e.target);
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      setWarningMessage("Right-click is disabled on protected content");
      setShowWarningPopup(true);
      setTimeout(() => setShowWarningPopup(false), 3000);
      return false;
    };

    const blockMouseDown = (e: MouseEvent) => {
      console.log("🔍 Mouse down detected:", e.button, "Ctrl:", e.ctrlKey, "Meta:", e.metaKey);
      // Block right-click (button 2) and Ctrl+click (Mac right-click)
      if (e.button === 2 || (e.button === 0 && e.ctrlKey)) {
        console.log("🚫 Right-click mousedown blocked on resource page");
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        setWarningMessage("Right-click is disabled on protected content");
        setShowWarningPopup(true);
        setTimeout(() => setShowWarningPopup(false), 3000);
        return false;
      }
    };

    const blockMouseUp = (e: MouseEvent) => {
      // Block right-click (button 2) and Ctrl+click (Mac right-click)
      if (e.button === 2 || (e.button === 0 && e.ctrlKey)) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }
    };

    // Add multiple event listeners to catch all right-click variations
    document.addEventListener("contextmenu", blockRightClick, { capture: true, passive: false });
    window.addEventListener("contextmenu", blockRightClick, { capture: true, passive: false });
    document.body.addEventListener("contextmenu", blockRightClick, { capture: true, passive: false });
    
    // Mac-specific: block mousedown/mouseup with right button or Ctrl+click
    document.addEventListener("mousedown", blockMouseDown, { capture: true, passive: false });
    document.addEventListener("mouseup", blockMouseUp, { capture: true, passive: false });
    window.addEventListener("mousedown", blockMouseDown, { capture: true, passive: false });
    window.addEventListener("mouseup", blockMouseUp, { capture: true, passive: false });
    
    // Also add to the PDF container if it exists
    if (pdfContainerRef.current) {
      const container = pdfContainerRef.current;
      container.addEventListener("contextmenu", blockRightClick, { capture: true, passive: false });
      container.addEventListener("mousedown", blockMouseDown, { capture: true, passive: false });
      container.addEventListener("mouseup", blockMouseUp, { capture: true, passive: false });
    }

    return () => {
      document.removeEventListener("contextmenu", blockRightClick, { capture: true });
      window.removeEventListener("contextmenu", blockRightClick, { capture: true });
      document.body.removeEventListener("contextmenu", blockRightClick, { capture: true });
      document.removeEventListener("mousedown", blockMouseDown, { capture: true });
      document.removeEventListener("mouseup", blockMouseUp, { capture: true });
      window.removeEventListener("mousedown", blockMouseDown, { capture: true });
      window.removeEventListener("mouseup", blockMouseUp, { capture: true });
      
      // Also remove from PDF container if it exists
      if (pdfContainerRef.current) {
        const container = pdfContainerRef.current;
        container.removeEventListener("contextmenu", blockRightClick, { capture: true });
        container.removeEventListener("mousedown", blockMouseDown, { capture: true });
        container.removeEventListener("mouseup", blockMouseUp, { capture: true });
      }
    };
  }, []); // Always active when component is mounted

  // ✅ Advanced screenshot detection for Mac and Windows
  useEffect(() => {
    let isDetecting = true;

    // Method 1: Detect common screenshot key combinations
    const detectScreenshotKeys = (e: KeyboardEvent) => {
      const screenshotCombinations = [
        // Windows screenshot keys
        e.key === "PrintScreen",
        e.key === "Print",
        e.altKey && e.key === "PrintScreen",
        e.metaKey && e.shiftKey && e.key === "S", // Win+Shift+S (Snipping Tool)
        
        // Mac screenshot keys
        e.metaKey && e.shiftKey && e.key === "3", // Cmd+Shift+3 (full screen)
        e.metaKey && e.shiftKey && e.key === "4", // Cmd+Shift+4 (selection)
        e.metaKey && e.shiftKey && e.key === "5", // Cmd+Shift+5 (screenshot app)
        e.key === "F13", // Mac Print Screen equivalent
        
        // Third-party screenshot tools
        e.ctrlKey && e.shiftKey && e.key === "A", // Some screenshot tools
        e.altKey && e.key === "a", // Some screenshot tools
      ];

      if (screenshotCombinations.some(condition => condition)) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        const newCount = violationCount + 1;
        setViolationCount(newCount);
        setShowViolationPopup(true);
        setIsBlurred(true);
        
        console.log("🚫 Screenshot attempt detected:", e.key, e.metaKey, e.shiftKey, e.altKey);
        
        // Log violation to API
        fetch("/api/resources/log-violation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "screenshot_attempt",
            details: `Key combination: ${e.key} (Meta: ${e.metaKey}, Shift: ${e.shiftKey}, Alt: ${e.altKey})`,
            timestamp: new Date().toISOString(),
          }),
        }).catch(() => {});

        if (newCount >= 3) {
          setTimeout(() => {
            alert("Too many violations detected. You will be logged out.");
            router.push("/login");
          }, 2000);
        } else {
          setTimeout(() => {
            setShowViolationPopup(false);
            setIsBlurred(false);
          }, 3000);
        }
        
        return false;
      }
    };

    // Method 2: Detect window focus/blur (screenshot tools often cause this)
    let lastBlurTime = 0;
    const detectWindowBlur = () => {
      const now = Date.now();
      if (now - lastBlurTime < 2000) return; // Debounce
      lastBlurTime = now;
      
      console.log("⚠️ Window lost focus - possible screenshot tool");
      setWarningMessage("Suspicious activity detected");
      setShowWarningPopup(true);
      setTimeout(() => setShowWarningPopup(false), 2000);
    };

    // Method 3: Detect clipboard access (screenshots often go to clipboard)
    const detectClipboardAccess = async () => {
      try {
        if (navigator.clipboard && navigator.clipboard.read) {
          // This will trigger permission request, alerting us to clipboard access
          await navigator.clipboard.read();
          console.log("⚠️ Clipboard access detected");
        }
      } catch (e) {
        // Expected - most screenshot tools will be blocked here
      }
    };

    // Method 4: Monitor for rapid page visibility changes
    let visibilityChangeCount = 0;
    const detectVisibilityChange = () => {
      visibilityChangeCount++;
      if (visibilityChangeCount > 3) {
        console.log("⚠️ Multiple visibility changes - possible screenshot tool");
        setWarningMessage("Suspicious activity detected");
        setShowWarningPopup(true);
        setTimeout(() => setShowWarningPopup(false), 2000);
        visibilityChangeCount = 0;
      }
      
      setTimeout(() => {
        if (visibilityChangeCount > 0) visibilityChangeCount--;
      }, 5000);
    };

    // Add event listeners
    document.addEventListener("keydown", detectScreenshotKeys, { capture: true, passive: false });
    window.addEventListener("blur", detectWindowBlur);
    document.addEventListener("visibilitychange", detectVisibilityChange);
    
    // Periodically check clipboard (this may trigger permission requests)
    const clipboardInterval = setInterval(() => {
      if (isDetecting) detectClipboardAccess();
    }, 10000);

    return () => {
      isDetecting = false;
      document.removeEventListener("keydown", detectScreenshotKeys, { capture: true });
      window.removeEventListener("blur", detectWindowBlur);
      document.removeEventListener("visibilitychange", detectVisibilityChange);
      clearInterval(clipboardInterval);
    };
  }, [violationCount, router]);

  // ✅ Enhanced protection against screenshots and downloads
  useEffect(() => {
    // Context menu is already handled by the aggressive blocker above

    const handleKeyDown = (e: KeyboardEvent) => {
      // Block F12 and developer tools shortcuts ESPECIALLY in fullscreen
      if (isFullscreen) {
        // In fullscreen, block ALL developer tools related keys
        const devToolsKeys = [
          e.key === "F12",
          e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "i"),
          e.ctrlKey && e.shiftKey && (e.key === "J" || e.key === "j"),
          e.ctrlKey && e.shiftKey && (e.key === "C" || e.key === "c"),
          e.metaKey && e.altKey && (e.key === "I" || e.key === "i"),
          e.metaKey && e.altKey && (e.key === "J" || e.key === "j"),
          e.metaKey && e.altKey && (e.key === "C" || e.key === "c"),
          e.ctrlKey && e.key === "u",
          e.ctrlKey && e.key === "U",
        ];
        
        if (devToolsKeys.some((condition) => condition)) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          setWarningMessage("Developer tools are disabled in fullscreen mode");
          setShowWarningPopup(true);
          setTimeout(() => setShowWarningPopup(false), 3000);
          return false;
        }
      }
      
      // ESC key to exit fullscreen
      if (e.key === "Escape" && isFullscreen) {
        toggleFullscreen();
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
        setWarningMessage(t.pdfViewer.warnings.actionDisabled);
        setShowWarningPopup(true);
        setTimeout(() => setShowWarningPopup(false), 2000);
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
      setWarningMessage(t.pdfViewer.warnings.copyDisabled);
      setShowWarningPopup(true);
      setTimeout(() => setShowWarningPopup(false), 2000);
      return false;
    };

    document.addEventListener("keydown", handleKeyDown, { capture: true });
    document.addEventListener("dragstart", handleDragStart);
    document.addEventListener("selectstart", handleSelectStart);
    document.addEventListener("copy", handleCopy);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("dragstart", handleDragStart);
      document.removeEventListener("selectstart", handleSelectStart);
      document.removeEventListener("copy", handleCopy);
    };
  }, [resourceTitle, isFullscreen, t]);

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
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Disabled - was causing unwanted blurring when touching PDF

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 10, 200));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 10, 50));

  const toggleFullscreen = () => {
    const newFullscreenState = !isFullscreen;
    console.log('Toggling fullscreen to:', newFullscreenState);
    setIsFullscreen(newFullscreenState);
    
    // Clear devtools warning when entering fullscreen
    if (newFullscreenState) {
      setDevToolsOpen(false);
    }
    
    // Notify parent to hide/show navbar
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('fullscreenChange', {
        detail: { isFullscreen: newFullscreenState },
        bubbles: true
      });
      console.log('Dispatching fullscreen event:', event.detail);
      window.dispatchEvent(event);
    }
  };

  // Add mouse wheel / touchpad zoom support (Ctrl+Scroll and pinch)
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Check for pinch gesture (ctrlKey is automatically set during pinch on most browsers)
      // or explicit Ctrl+Scroll
      if (e.ctrlKey) {
        e.preventDefault();

        // Determine zoom direction and amount based on wheel delta
        const delta = e.deltaY;
        const zoomSpeed = 5;

        if (delta < 0) {
          // Pinch out / Scroll up - zoom in
          setScale((prev) => Math.min(prev + zoomSpeed, 200));
        } else {
          // Pinch in / Scroll down - zoom out
          setScale((prev) => Math.max(prev - zoomSpeed, 50));
        }
      }
    };

    // Also handle touch gestures for mobile
    let initialDistance = 0;
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        initialDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );

        const delta = currentDistance - initialDistance;
        if (Math.abs(delta) > 10) {
          if (delta > 0) {
            // Pinch out - zoom in
            setScale((prev) => Math.min(prev + 3, 200));
          } else {
            // Pinch in - zoom out
            setScale((prev) => Math.max(prev - 3, 50));
          }
          initialDistance = currentDistance;
        }
      }
    };

    const pdfContainer = pdfContainerRef.current;
    if (pdfContainer) {
      pdfContainer.addEventListener('wheel', handleWheel, { passive: false });
      pdfContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
      pdfContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
    }

    return () => {
      if (pdfContainer) {
        pdfContainer.removeEventListener('wheel', handleWheel);
        pdfContainer.removeEventListener('touchstart', handleTouchStart);
        pdfContainer.removeEventListener('touchmove', handleTouchMove);
      }
    };
  }, []);

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
      {/* Initial Warning Popup - Shows for 4 seconds */}
      {showInitialWarning && pdfReady && (
        <div className="fixed inset-0 z-[200] bg-black bg-opacity-95 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full animate-fade-in">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-3xl font-bold text-red-600 mb-4">{t.pdfViewer.initialWarning.title}</h2>
            </div>

            <div className="space-y-4 text-left mb-6">
              <p className="text-lg font-semibold text-gray-800">
                🚫 {t.pdfViewer.initialWarning.subtitle}
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 pl-4">
                {t.pdfViewer.initialWarning.rules.map((rule, index) => (
                  <li key={index} className="text-base">{rule}</li>
                ))}
              </ul>

              <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 mt-4">
                <p className="text-red-800 font-bold text-center text-lg">
                  ⚠️ {t.pdfViewer.initialWarning.banWarning}
                  <br />
                  <span className="text-base">{t.pdfViewer.initialWarning.noRefund}</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowInitialWarning(false)}
              className="w-full bg-primary hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-lg text-lg transition-colors shadow-lg"
            >
              {t.pdfViewer.initialWarning.proceed}
            </button>
          </div>
        </div>
      )}

      {/* DevTools Warning - Non-blocking Toast */}
      {devToolsOpen && (
        <div className="fixed top-20 right-4 z-[100] bg-red-600 text-white rounded-lg shadow-2xl p-4 max-w-sm animate-slide-in">
          <div className="flex items-start space-x-3">
            <div className="text-2xl">⚠️</div>
            <div className="flex-1">
              <h3 className="font-bold mb-1">{t.pdfViewer.devTools.title}</h3>
              <p className="text-xs opacity-90">{t.pdfViewer.devTools.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Warning Popup - Generic */}
      {showWarningPopup && (
        <div className="fixed top-20 right-4 z-[100] bg-red-600 text-white rounded-lg shadow-2xl p-4 max-w-sm">
          <div className="flex items-start space-x-3">
            <div className="text-2xl">❌</div>
            <div className="flex-1">
              <p className="text-sm font-semibold">{warningMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Screenshot Violation Popup */}
      {showViolationPopup && (
        <div className="fixed inset-0 z-[95] bg-black bg-opacity-90 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
            <div className="flex justify-between items-start mb-4">
              <div className="text-5xl">🚫</div>
              {violationCount < 3 && (
                <button
                  onClick={() => setShowViolationPopup(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="w-6 h-6" />
                </button>
              )}
            </div>
            <h2 className="text-2xl font-bold text-red-600 mb-3">
              {violationCount >= 3 ? t.pdfViewer.violation.finalTitle : t.pdfViewer.violation.title}
            </h2>
            <p className="text-gray-700 mb-3">
              {t.pdfViewer.violation.detected}
            </p>
            <div className={`border rounded p-3 mb-3 ${violationCount >= 3 ? 'bg-red-100 border-red-400' : 'bg-red-50 border-red-200'}`}>
              <p className="text-sm text-red-700 font-semibold">
                {t.pdfViewer.violation.violationNumber.replace('{count}', violationCount.toString())}
              </p>
              <p className="text-xs text-red-600 mt-1">
                {violationCount >= 3
                  ? t.pdfViewer.violation.finalMessage
                  : t.pdfViewer.violation.warningsLeft.replace('{count}', (3 - violationCount).toString())
                }
              </p>
            </div>
            {violationCount >= 3 && (
              <div className="bg-black text-white p-4 rounded text-center font-bold">
                {t.pdfViewer.violation.loggingOut}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-3">
              {t.pdfViewer.violation.logged}
            </p>
          </div>
        </div>
      )}

      {/* Screenshot Block Overlay */}
      {isBlurred && (
        <div className="fixed inset-0 z-[90] bg-black flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🚫</div>
            <p className="text-2xl font-semibold text-white">Content Hidden</p>
            <p className="text-sm text-gray-300 mt-2">Protected content temporarily blocked</p>
          </div>
        </div>
      )}

      {/* Floating Toolbar - Fixed to bottom-right */}
      <div className="fixed bottom-4 right-4 z-30 bg-primary text-white rounded-md shadow-lg flex items-center gap-1 px-2 py-1.5">
        <button
          onClick={() => router.push("/dashboard/resources")}
          className="p-1.5 hover:bg-white/20 rounded"
          title="Back to Resources"
        >
          <FiArrowLeft className="w-5 h-5" />
        </button>
        <button
          onClick={handleZoomOut}
          disabled={scale <= 50}
          className="p-1.5 hover:bg-white/20 rounded disabled:opacity-50"
          title="Zoom Out (Ctrl+Scroll or Pinch)"
        >
          <FiZoomOut className="w-5 h-5" />
        </button>
        <span className="text-sm px-2 font-medium cursor-help" title="Use Ctrl+Scroll or pinch gesture to zoom">{scale}%</span>
        <button
          onClick={handleZoomIn}
          disabled={scale >= 200}
          className="p-1.5 hover:bg-white/20 rounded disabled:opacity-50"
          title="Zoom In (Ctrl+Scroll or Pinch)"
        >
          <FiZoomIn className="w-5 h-5" />
        </button>
        <button
          onClick={toggleFullscreen}
          className="p-1.5 hover:bg-white/20 rounded"
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          {isFullscreen ? <FiMinimize className="w-5 h-5" /> : <FiMaximize className="w-5 h-5" />}
        </button>
      </div>

      {/* PDF Container - Fixed window, zoomed content */}
      <div className="flex-1 relative bg-gray-50 overflow-auto">
        <div className="h-full flex items-start justify-center p-0 md:p-4">
          <div
            ref={pdfContainerRef}
            className="relative bg-white shadow-2xl h-full"
            style={{
              width: '100%',
              maxWidth: '100%',
              transform: `scale(${scale / 100})`,
              transformOrigin: 'top center',
              transition: 'transform 0.2s ease-out'
            }}
          >
            {/* Multiple Watermarks - Grid Pattern */}
            <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute transform rotate-[-45deg] font-bold select-none"
                  style={{
                    left: `${(i % 4) * 25 + 5}%`,
                    top: `${Math.floor(i / 4) * 18 + 5}%`,
                    color: i % 2 === 0 ? '#0d599c' : '#333',
                    opacity: 0.15,
                    whiteSpace: 'nowrap'
                  }}
                >
                  {i % 2 === 0 ? (
                    <div style={{ fontSize: '3rem' }}>CrackTET</div>
                  ) : (
                    <div className="text-center">
                      <div style={{ fontSize: '1.5rem' }}>{userName}</div>
                      <div style={{ fontSize: '0.9rem', marginTop: '4px' }}>{userEmail}</div>
                      <div style={{ fontSize: '0.9rem', marginTop: '2px' }}>{userMobile}</div>
                    </div>
                  )}
                </div>
              ))}
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
      </div>

    </div>
  );
}
