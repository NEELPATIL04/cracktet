"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiZoomIn, FiZoomOut, FiX } from "react-icons/fi";
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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages] = useState(0); // TODO: Implement total page detection
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [overlayBlack, setOverlayBlack] = useState(false);
  const [devToolsBlockedEntry, setDevToolsBlockedEntry] = useState(false);

  // Check for dev tools on component mount
  useEffect(() => {
    const checkInitialDevTools = () => {
      const threshold = 160;
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;
      const widthThreshold = widthDiff > threshold;
      const heightThreshold = heightDiff > threshold;

      console.log("🔍 Dev tools check:", {
        outerWidth: window.outerWidth,
        innerWidth: window.innerWidth,
        outerHeight: window.outerHeight,
        innerHeight: window.innerHeight,
        widthDiff,
        heightDiff,
        threshold,
        widthThreshold,
        heightThreshold
      });

      if (widthThreshold || heightThreshold) {
        console.log("🚫 Dev tools detected on PDF entry - blocking access");
        setDevToolsBlockedEntry(true);
        setError("Developer tools must be closed to access this content");
        setLoading(false);
        return true;
      }
      console.log("✅ No dev tools detected on entry");
      return false;
    };

    // Alternative detection method using console
    const checkConsoleDevTools = () => {
      const startTime = performance.now();
      console.log('%c', 'color: transparent;');
      const endTime = performance.now();
      const timeDiff = endTime - startTime;
      
      console.log("🔍 Console detection time:", timeDiff);
      
      if (timeDiff > 5) {
        console.log("🚫 Dev tools detected via console method - blocking access");
        setDevToolsBlockedEntry(true);
        setError("Developer tools must be closed to access this content");
        setLoading(false);
        return true;
      }
      return false;
    };

    // Wait a moment for window to settle, then check
    setTimeout(() => {
      // Try both detection methods
      if (checkInitialDevTools() || checkConsoleDevTools()) return;
      
      const checkInterval = setInterval(() => {
        if (checkInitialDevTools() || checkConsoleDevTools()) {
          clearInterval(checkInterval);
        }
      }, 200);

      // Clear interval after 5 seconds if no dev tools detected
      setTimeout(() => clearInterval(checkInterval), 5000);
    }, 500);

  }, []);

  // Load PDF as blob (only if dev tools not detected)
  useEffect(() => {
    if (devToolsBlockedEntry) return; // Don't load PDF if dev tools detected

    const loadPDF = async () => {
      try {
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
        const url = URL.createObjectURL(blob);

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
  }, [pdfUrl, devToolsBlockedEntry]);

  // ✅ Auto-enter browser fullscreen when PDF is ready (more reliable)
  useEffect(() => {
    const enterFullscreen = async () => {
      // Wait a small moment for DOM to be ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        } else if ((document.documentElement as any).webkitRequestFullscreen) {
          await (document.documentElement as any).webkitRequestFullscreen();
        } else if ((document.documentElement as any).msRequestFullscreen) {
          await (document.documentElement as any).msRequestFullscreen();
        }
      } catch (error) {
        // Show user a manual fullscreen button if auto-fullscreen fails
        setWarningMessage("Click the fullscreen button to enter fullscreen mode");
        setShowWarningPopup(true);
        setTimeout(() => setShowWarningPopup(false), 4000);
      }
    };

    // Only try to enter fullscreen when PDF is actually ready
    if (pdfReady && pdfBlobUrl && !showInitialWarning) {
      enterFullscreen();
    }
  }, [pdfReady, pdfBlobUrl, showInitialWarning]); // Triggered when PDF becomes ready

  // ✅ Keyboard navigation for pages and overlay control
  useEffect(() => {
    const handleKeyboardNav = (e: KeyboardEvent) => {
      // Navigation keys - don't blacken overlay
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        if (currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
        return;
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        setCurrentPage(currentPage + 1);
        return;
      } else if (e.key === 'Home') {
        e.preventDefault();
        setCurrentPage(1);
        return;
      } else if (e.key === 'End' && totalPages > 0) {
        e.preventDefault();
        setCurrentPage(totalPages);
        return;
      } else if (e.key === 'Escape') {
        // Allow escape for fullscreen exit
        return;
      }
      
      // Any other key press - make overlay black INSTANTLY
      e.preventDefault();
      e.stopPropagation();
      console.log("🔒 SCREEN TURNING BLACK INSTANTLY - Key pressed:", e.key);
      
      // Find the protective layer and make it black immediately via DOM manipulation
      const protectiveLayer = document.querySelector('.pdf-protective-layer') as HTMLElement;
      if (protectiveLayer) {
        protectiveLayer.style.backgroundColor = '#000000';
        protectiveLayer.style.transition = 'none'; // Remove transition for instant change
        console.log("🎨 Applied instant black background via DOM");
      }
      
      // Then update React state for UI consistency
      setOverlayBlack(true);
      setWarningMessage("Double-click anywhere to restore content");
      setShowWarningPopup(true);
      setIsBlurred(false);
    };

    if (pdfBlobUrl) {
      // Use capture phase to intercept before other handlers
      document.addEventListener('keydown', handleKeyboardNav, { capture: true });
    }

    return () => {
      document.removeEventListener('keydown', handleKeyboardNav, { capture: true });
    };
  }, [currentPage, pdfBlobUrl, totalPages]);

  // ✅ Listen for fullscreen changes from browser API
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
      
      // If user exits fullscreen, exit the PDF and go back
      if (!isCurrentlyFullscreen) {
        router.push("/dashboard/resources");
        return;
      }
      
      // Notify parent components
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('fullscreenChange', {
          detail: { isFullscreen: isCurrentlyFullscreen },
          bubbles: true
        });
        window.dispatchEvent(event);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, [router]);

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
      if (e.key === "F12" || e.code === "F12") {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
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
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      setWarningMessage("Right-click is disabled on protected content");
      setShowWarningPopup(true);
      setTimeout(() => setShowWarningPopup(false), 3000);
      return false;
    };

    const blockMouseDown = (e: MouseEvent) => {
      // Block right-click (button 2) and Ctrl+click (Mac right-click)
      if (e.button === 2 || (e.button === 0 && e.ctrlKey)) {
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

  // ✅ Global download blocker - prevents navigation to file-like links
  useEffect(() => {
    const blockDownloads = (e: Event) => {
      const target = e.target as HTMLElement;
      
      // Check if it's a link or has href
      if (target.tagName === 'A' || target.closest('a')) {
        const link = target.tagName === 'A' ? target as HTMLAnchorElement : target.closest('a') as HTMLAnchorElement;
        const href = link?.href || '';
        
        // Block file extensions commonly used for downloads
        const fileExtensions = [
          '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
          '.zip', '.rar', '.7z', '.tar', '.gz',
          '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg',
          '.mp3', '.mp4', '.avi', '.mov', '.wmv', '.flv',
          '.txt', '.csv', '.json', '.xml', '.html',
          '.exe', '.msi', '.dmg', '.deb', '.rpm',
          '.apk', '.ipa'
        ];
        
        // Check if URL contains file extensions or download patterns
        const hasFileExtension = fileExtensions.some(ext => href.toLowerCase().includes(ext));
        const hasDownloadPattern = href.toLowerCase().includes('download') || 
                                  href.toLowerCase().includes('attachment') ||
                                  href.toLowerCase().includes('export') ||
                                  href.toLowerCase().includes('stream');
        
        if (hasFileExtension || hasDownloadPattern) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          
          setWarningMessage("Downloads are disabled on protected content");
          setShowWarningPopup(true);
          setTimeout(() => setShowWarningPopup(false), 3000);
          
          // Log violation
          fetch("/api/resources/log-violation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "download_attempt",
              details: `Blocked download: ${href}`,
              timestamp: new Date().toISOString(),
            }),
          }).catch(() => {});
          
          return false;
        }
      }
      
      // Also block any programmatic download attempts
      if (target.hasAttribute && target.hasAttribute('download')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // Add listeners for various events that could trigger downloads
    document.addEventListener("click", blockDownloads, { capture: true, passive: false });
    document.addEventListener("auxclick", blockDownloads, { capture: true, passive: false }); // Middle click
    window.addEventListener("click", blockDownloads, { capture: true, passive: false });
    
    // Block programmatic navigation to file URLs
    const originalOpen = window.open;
    window.open = function(url?: string | URL, target?: string, features?: string) {
      if (url) {
        const urlStr = url.toString().toLowerCase();
        const fileExtensions = ['.pdf', '.doc', '.docx', '.zip', '.rar'];
        if (fileExtensions.some(ext => urlStr.includes(ext)) || urlStr.includes('download')) {
          setWarningMessage("Downloads are disabled on protected content");
          setShowWarningPopup(true);
          setTimeout(() => setShowWarningPopup(false), 3000);
          return null;
        }
      }
      return originalOpen.call(window, url, target, features);
    };
    
    // Block iframe navigation and other navigation attempts
    const blockNavigation = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IFRAME') {
        const iframe = target as HTMLIFrameElement;
        const src = iframe.src || '';
        const fileExtensions = ['.pdf', '.doc', '.docx', '.zip', '.rar'];
        if (fileExtensions.some(ext => src.toLowerCase().includes(ext)) && 
            !src.includes(pdfBlobUrl)) { // Allow our own PDF blob
          e.preventDefault();
          e.stopPropagation();
          setWarningMessage("Downloads are disabled on protected content");
          setShowWarningPopup(true);
          setTimeout(() => setShowWarningPopup(false), 3000);
        }
      }
    };
    
    // Listen for beforeunload to catch navigation attempts
    const blockUnload = (_e: BeforeUnloadEvent) => {
      // We'll allow normal navigation but could add checks here if needed
    };
    
    window.addEventListener('beforeunload', blockUnload);
    document.addEventListener('load', blockNavigation, { capture: true });

    // Block blob URL creation attempts (prevents saving PDFs as blobs)
    const originalCreateObjectURL = URL.createObjectURL;
    URL.createObjectURL = function(object: Blob | MediaSource) {
      // Allow our own PDF blob but block others during sensitive operations
      if (object instanceof Blob && object.type === 'application/pdf') {
        // We allow our own PDF loading but could add additional checks here
      }
      return originalCreateObjectURL.call(URL, object);
    };
    
    // Block clipboard operations that might save file data
    const blockClipboardWrite = async (e: ClipboardEvent) => {
      e.preventDefault();
      setWarningMessage("Copying content is disabled");
      setShowWarningPopup(true);
      setTimeout(() => setShowWarningPopup(false), 2000);
    };
    
    document.addEventListener("copy", blockClipboardWrite, { capture: true });
    document.addEventListener("cut", blockClipboardWrite, { capture: true });

    return () => {
      document.removeEventListener("click", blockDownloads, { capture: true });
      document.removeEventListener("auxclick", blockDownloads, { capture: true });
      window.removeEventListener("click", blockDownloads, { capture: true });
      document.removeEventListener("copy", blockClipboardWrite, { capture: true });
      document.removeEventListener("cut", blockClipboardWrite, { capture: true });
      window.removeEventListener('beforeunload', blockUnload);
      document.removeEventListener('load', blockNavigation, { capture: true });
      
      // Restore original functions
      window.open = originalOpen;
      URL.createObjectURL = originalCreateObjectURL;
    };
  }, [pdfBlobUrl]);

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
        // Exit fullscreen when ESC is pressed
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          (document as any).webkitExitFullscreen();
        } else if ((document as any).msExitFullscreen) {
          (document as any).msExitFullscreen();
        }
        return;
      }

      const forbiddenKeys = [
        // Save shortcuts (Ctrl+S, Cmd+S)
        e.ctrlKey && (e.key === "s" || e.key === "S"),
        e.metaKey && (e.key === "s" || e.key === "S"),
        
        // Print shortcuts (Ctrl+P, Cmd+P)
        e.ctrlKey && (e.key === "p" || e.key === "P"),
        e.metaKey && (e.key === "p" || e.key === "P"),
        
        // Copy shortcuts (Ctrl+C, Cmd+C)
        e.ctrlKey && (e.key === "c" || e.key === "C"),
        e.metaKey && (e.key === "c" || e.key === "C"),
        
        // Select all (Ctrl+A, Cmd+A)
        e.ctrlKey && (e.key === "a" || e.key === "A"),
        e.metaKey && (e.key === "a" || e.key === "A"),
        
        // Download shortcuts (Ctrl+J, Cmd+J for downloads page)
        e.ctrlKey && (e.key === "j" || e.key === "J"),
        e.metaKey && (e.key === "j" || e.key === "J"),
        
        // Save As shortcuts (Ctrl+Shift+S, Cmd+Shift+S)
        e.ctrlKey && e.shiftKey && (e.key === "s" || e.key === "S"),
        e.metaKey && e.shiftKey && (e.key === "s" || e.key === "S"),
        
        // Browser menu shortcuts that could lead to save
        e.altKey && (e.key === "f" || e.key === "F"), // Alt+F (File menu)
        e.altKey && (e.key === "e" || e.key === "E"), // Alt+E (Edit menu)
        
        // Screenshot shortcuts
        e.key === "PrintScreen",
        
        // Developer tools
        e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "i"),
        e.ctrlKey && e.shiftKey && (e.key === "J" || e.key === "j"),
        e.ctrlKey && e.shiftKey && (e.key === "C" || e.key === "c"),
        e.key === "F12",
        
        // View source (Ctrl+U, Cmd+Option+U)
        e.ctrlKey && (e.key === "u" || e.key === "U"),
        e.metaKey && e.altKey && (e.key === "u" || e.key === "U"),
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

  // ✅ Disable print media query and add protective layer styles
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
        pointer-events: none !important; /* Disable all iframe interactions */
        overflow: hidden !important; /* Disable scrolling */
      }
      /* Allow PDF container to size properly */
      .pdf-container {
        overflow: hidden !important;
        position: relative !important;
        width: 100% !important;
        height: 100% !important;
      }
      /* Protective layer styles */
      .pdf-protective-layer {
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        z-index: 9999999 !important;
        pointer-events: auto !important;
        user-select: none !important;
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        -webkit-touch-callout: none !important;
        -webkit-tap-highlight-color: transparent !important;
      }
      /* Prevent selection on PDF container */
      .pdf-container * {
        user-select: none !important;
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
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
          <div className="text-6xl mb-4">{devToolsBlockedEntry ? '🔒' : '⚠️'}</div>
          <h3 className="text-2xl font-bold text-red-600 mb-4">
            {devToolsBlockedEntry ? 'Access Blocked' : 'Failed to Load PDF'}
          </h3>
          <p className="text-gray-700 mb-4">{error}</p>
          {devToolsBlockedEntry ? (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 font-semibold">🛡️ Security Protection Active</p>
                <p className="text-red-700 text-sm mt-2">
                  Close all developer tools and browser extensions, then reload the page to access this content.
                </p>
              </div>
              <button
                onClick={() => {
                  setDevToolsBlockedEntry(false);
                  setError("");
                  setLoading(true);
                }}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                Check Again
              </button>
            </div>
          ) : (
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-[100]' : 'relative w-full h-full'} bg-white flex flex-col`}>
      {/* Prominent Back Button - Fixed at top left */}
      <div className="absolute top-4 left-4 z-40">
        <button
          onClick={async () => {
            // Exit fullscreen first if in fullscreen mode
            if (isFullscreen) {
              try {
                if (document.exitFullscreen) {
                  await document.exitFullscreen();
                } else if ((document as any).webkitExitFullscreen) {
                  await (document as any).webkitExitFullscreen();
                } else if ((document as any).msExitFullscreen) {
                  await (document as any).msExitFullscreen();
                }
                // Wait a moment for fullscreen to exit before navigating
                setTimeout(() => {
                  router.push("/dashboard/resources");
                }, 100);
              } catch (error) {
                // Navigate anyway if fullscreen exit fails
                router.push("/dashboard/resources");
              }
            } else {
              // Navigate directly if not in fullscreen
              router.push("/dashboard/resources");
            }
          }}
          className="flex items-center space-x-2 bg-white hover:bg-gray-50 text-gray-800 px-4 py-3 rounded-lg shadow-lg border border-gray-200 transition-all duration-200 hover:shadow-xl"
          title="Back to Resources"
        >
          <FiArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Resources</span>
        </button>
      </div>
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

      {/* Floating Toolbar - Fixed to bottom-right (Zoom controls only) */}
      <div className="fixed bottom-4 right-4 bg-primary text-white rounded-md shadow-lg flex items-center gap-1 px-2 py-1.5" style={{ zIndex: 99999999 }}>
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

            {/* PDF iframe with page navigation */}
            {pdfBlobUrl && (
              <div className="relative w-full h-full pdf-container">
                <iframe
                  ref={iframeRef}
                  src={`${pdfBlobUrl}#toolbar=0&navpanes=0&scrollbar=0&zoom=page-fit&page=${currentPage}`}
                  className="w-full h-full border-0"
                  title={resourceTitle}
                  style={{ 
                    overflow: 'hidden'
                  }}
                  key={`pdf-page-${currentPage}`} // Force re-render on page change
                />
                
                {/* Protective Layer - Transparent or Black based on keyboard activity */}
                <div 
                  className="pdf-protective-layer cursor-default"
                  style={{
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    msUserSelect: 'none',
                    MozUserSelect: 'none',
                    WebkitTouchCallout: 'none',
                    WebkitTapHighlightColor: 'transparent',
                    pointerEvents: 'auto', // Capture all pointer events
                    backgroundColor: (console.log("🎨 Background color:", overlayBlack ? '#000000' : 'transparent'), overlayBlack ? '#000000' : 'transparent'),
                    transition: 'background-color 0.3s ease'
                  } as React.CSSProperties}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setWarningMessage("Right-click is disabled on protected content");
                    setShowWarningPopup(true);
                    setTimeout(() => setShowWarningPopup(false), 3000);
                    return false;
                  }}
                  onMouseDown={(e: React.MouseEvent) => {
                    // Block all mouse down events on the PDF
                    if (e.button === 2 || (e.button === 0 && e.ctrlKey)) { // Right click or Ctrl+click
                      e.preventDefault();
                      e.stopPropagation();
                      setWarningMessage("Interactions are disabled on protected content");
                      setShowWarningPopup(true);
                      setTimeout(() => setShowWarningPopup(false), 2000);
                      return false;
                    }
                  }}
                  {...{
                    onSelectStart: (e: Event) => {
                      // Block text selection
                      e.preventDefault();
                      return false;
                    }
                  } as any}
                  onDragStart={(e) => {
                    // Block drag operations
                    e.preventDefault();
                    return false;
                  }}
                  onDoubleClick={(e) => {
                    e.preventDefault();
                    if (overlayBlack) {
                      // Double-click to restore content
                      console.log("⚪ DOUBLE-CLICK DETECTED - Restoring content");
                      
                      // Reset DOM styles first
                      const protectiveLayer = document.querySelector('.pdf-protective-layer') as HTMLElement;
                      if (protectiveLayer) {
                        protectiveLayer.style.backgroundColor = 'transparent';
                        protectiveLayer.style.transition = 'background-color 0.3s ease'; // Restore transition
                        console.log("🎨 Reset DOM background to transparent");
                      }
                      
                      // Then update React state
                      setOverlayBlack(false);
                      setShowWarningPopup(false);
                    }
                    return false;
                  }}
                  onTouchStart={(e) => {
                    // Block touch scrolling
                    e.preventDefault();
                    setWarningMessage("Use navigation buttons to change pages");
                    setShowWarningPopup(true);
                    setTimeout(() => setShowWarningPopup(false), 2000);
                  }}
                  onWheel={(e) => {
                    // Block wheel scrolling
                    e.preventDefault();
                    setWarningMessage("Use navigation buttons or arrow keys to navigate");
                    setShowWarningPopup(true);
                    setTimeout(() => setShowWarningPopup(false), 2000);
                  }}
                  onScroll={(e) => {
                    // Block scroll events
                    e.preventDefault();
                  }}
                  title="Protected Content - Interactions Disabled"
                >
                  {/* Overlay content - shows message when black */}
                  {overlayBlack ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-6xl mb-4">🚫</div>
                        <p className="text-white text-2xl font-bold mb-2">Content Hidden</p>
                        <p className="text-gray-300 text-lg">Unauthorized keyboard activity detected</p>
                        <p className="text-yellow-400 text-lg font-semibold mt-4">👆 Double-click anywhere to restore content</p>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center opacity-0 hover:opacity-5 transition-opacity duration-1000">
                      <div className="text-gray-400 text-sm font-medium bg-white bg-opacity-90 px-3 py-1 rounded">
                        Protected Content
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Navigation Buttons */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-white rounded-lg shadow-lg px-4 py-2 border border-gray-200" style={{ zIndex: 99999999 }}>
                  <button
                    onClick={() => {
                      if (currentPage > 1) {
                        setCurrentPage(currentPage - 1);
                      }
                    }}
                    disabled={currentPage <= 1}
                    className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    title="Previous Page"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <span>Page</span>
                    <input
                      type="number"
                      value={currentPage}
                      onChange={(e) => {
                        const page = Math.max(1, parseInt(e.target.value) || 1);
                        setCurrentPage(page);
                      }}
                      className="w-12 px-2 py-1 border border-gray-300 rounded text-center"
                      min="1"
                    />
                    <span>of {totalPages || '?'}</span>
                  </div>
                  
                  <button
                    onClick={() => {
                      setCurrentPage(currentPage + 1);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-all"
                    title="Next Page"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
