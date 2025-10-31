"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { FiFile, FiMenu, FiX, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

interface User {
  id: number;
  name: string;
  email: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [navbarVisible, setNavbarVisible] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(true);

  // Check if we're on the PDF viewer page
  const isPDFViewerPage = pathname?.includes('/dashboard/resources/view/');

  // Get page title based on current route
  const getPageTitle = () => {
    if (pathname?.includes('/dashboard/resources/view/')) {
      return 'View Resource';
    } else if (pathname === '/dashboard/resources') {
      return 'Study Resources';
    }
    return 'Dashboard';
  };

  useEffect(() => {
    checkAuth();
  }, []);

  // Listen for fullscreen changes from PDF viewer
  useEffect(() => {
    const handleFullscreenChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && typeof customEvent.detail.isFullscreen === 'boolean') {
        const { isFullscreen } = customEvent.detail;
        console.log('Fullscreen state changed:', isFullscreen);
        setNavbarVisible(!isFullscreen);
        setSidebarVisible(!isFullscreen);
      }
    };

    window.addEventListener('fullscreenChange', handleFullscreenChange);
    return () => window.removeEventListener('fullscreenChange', handleFullscreenChange);
  }, []);

  // Reset navbar and sidebar visibility when navigating away from PDF viewer
  useEffect(() => {
    console.log('Path changed:', pathname, 'isPDFViewerPage:', isPDFViewerPage);
    if (!isPDFViewerPage) {
      console.log('Not on PDF viewer page, restoring UI elements');
      console.log('Setting navbarVisible and sidebarVisible to true');
      
      // Force immediate restoration
      setTimeout(() => {
        setNavbarVisible(true);
        setSidebarVisible(true);
        console.log('UI elements restored after timeout');
      }, 100);
    }
  }, [isPDFViewerPage, pathname]);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/user/verify");
      if (!response.ok) {
        router.push("/login");
        return;
      }
      const data = await response.json();
      if (data.authenticated) {
        setUser(data.user);
      } else {
        router.push("/login");
      }
    } catch (error) {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/user/logout", { method: "POST" });
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-gray">
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
            Loading...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  const isActive = (path: string) => pathname === path;
  const sidebarWidth = sidebarCollapsed ? "w-16" : "w-64"; // Expanded sidebar

  console.log('Layout render - navbarVisible:', navbarVisible, 'sidebarVisible:', sidebarVisible, 'isPDFViewerPage:', isPDFViewerPage);

  return (
    <div className="fixed inset-0 overflow-hidden bg-secondary-gray">
      {/* Top Navbar */}
      {navbarVisible && (
        <nav className="absolute top-0 left-0 right-0 h-16 bg-primary text-white shadow-lg z-30 flex items-center justify-between px-6">
        {/* Left side - Logo/Title */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          >
            {sidebarOpen ? (
              <FiX className="w-6 h-6" />
            ) : (
              <FiMenu className="w-6 h-6" />
            )}
          </button>
          <h1 className="text-xl font-bold">{getPageTitle()}</h1>
        </div>

        {/* Right side - User info */}
        <div className="hidden md:flex items-center space-x-3">
          <div className="text-right">
            <p className="text-sm font-medium">{user?.name}</p>
            <p className="text-xs text-white text-opacity-80">{user?.email}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-white bg-opacity-20 flex items-center justify-center font-bold">
            {user?.name?.charAt(0) || "U"}
          </div>
        </div>
        </nav>
      )}

      {/* Sidebar - Hidden on mobile for PDF viewer */}
      {sidebarVisible && (
        <aside
          className={`absolute top-0 left-0 bottom-0 ${sidebarWidth} bg-white shadow-lg transform transition-all duration-300 z-[60] flex flex-col ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } ${isPDFViewerPage ? 'hidden lg:flex' : 'lg:translate-x-0'}`}
        >
        {/* Sidebar Header */}
        <div className="p-6 border-b border-gray-100">
          {!sidebarCollapsed ? (
            <>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">My Dashboard</h2>
              <p className="text-gray-500">Welcome, {user?.name}</p>
            </>
          ) : (
            <div className="flex justify-center">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                {user?.name?.charAt(0) || "U"}
              </div>
            </div>
          )}
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-6">
          <Link
            href="/dashboard/resources"
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3'} px-4 py-4 rounded-lg transition-colors group ${
              pathname?.includes('/dashboard/resources')
                ? "bg-blue-50 text-blue-600 border-l-4 border-blue-600"
                : "hover:bg-gray-50 text-gray-600"
            }`}
            title="Resources"
          >
            <FiFile className="w-5 h-5" />
            {!sidebarCollapsed && <span className="font-medium text-lg">Resources</span>}
          </Link>
        </nav>

        {/* Logout Button - Bottom */}
        <div className="p-6 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-sm">
              {user?.name?.charAt(0) || "U"}
            </div>
            {!sidebarCollapsed && (
              <div className="flex items-center space-x-2">
                <span className="font-medium">Logout</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
            )}
          </button>
        </div>
        </aside>
      )}

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="absolute inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className={`absolute ${navbarVisible ? 'top-16' : 'top-0'} ${!sidebarVisible ? 'left-0' : (isPDFViewerPage ? 'left-0 lg:left-64' : (sidebarCollapsed ? 'left-16' : 'left-64'))} right-0 bottom-0 transition-all duration-300 overflow-hidden`}>
        <div className={`w-full h-full ${isPDFViewerPage ? '' : 'overflow-auto p-6'}`}>
          {children}
        </div>
      </main>
    </div>
  );
}
