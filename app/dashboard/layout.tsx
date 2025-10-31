"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { FiFile, FiLogOut, FiMenu, FiX, FiChevronLeft, FiChevronRight } from "react-icons/fi";
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
  const sidebarWidth = sidebarCollapsed ? "w-16" : "w-52"; // Reduced from w-64 to w-52

  return (
    <div className="h-screen overflow-hidden bg-secondary-gray">
      {/* Top Navbar - Hidden on PDF viewer */}
      {!isPDFViewerPage && (
        <nav className="fixed top-0 left-0 right-0 h-16 bg-primary text-white shadow-lg z-30 flex items-center justify-between px-6">
          {/* Left side - Mobile menu button */}
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

          {/* Center - Dynamic Title */}
          <div className="flex-1 text-center lg:text-left lg:pl-4">
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

      {/* Sidebar - Hidden on PDF viewer */}
      {!isPDFViewerPage && (
        <aside
          className={`fixed top-0 left-0 h-full ${sidebarWidth} bg-white shadow-lg transform transition-all duration-300 z-50 flex flex-col ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
        {/* Sidebar Header */}
        <div className="p-6 border-b border-gray-200">
          {!sidebarCollapsed ? (
            <>
              <h2 className="text-xl font-bold text-primary">My Dashboard</h2>
              <p className="text-sm text-gray-500 mt-1 truncate">Welcome, {user?.name}</p>
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
        <nav className="flex-1 p-4 space-y-2">
          <Link
            href="/dashboard/resources"
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3'} px-4 py-3 rounded-lg transition-colors ${
              isActive("/dashboard/resources")
                ? "bg-primary text-white"
                : "hover:bg-gray-100 text-gray-700"
            }`}
            title="Resources"
          >
            <FiFile className="w-5 h-5" />
            {!sidebarCollapsed && <span className="font-medium">Resources</span>}
          </Link>
        </nav>

        {/* Collapse Button (Desktop only) */}
        <div className="hidden lg:flex items-center justify-center p-2 border-t border-gray-200">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {sidebarCollapsed ? (
              <FiChevronRight className="w-5 h-5 text-gray-600" />
            ) : (
              <FiChevronLeft className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>

        {/* Logout Button at Bottom */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-center space-x-2'} px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200`}
            title="Logout"
          >
            <FiLogOut className="w-5 h-5" />
            {!sidebarCollapsed && <span className="font-medium">Logout</span>}
          </button>
        </div>
        </aside>
      )}

      {/* Overlay for mobile */}
      {!isPDFViewerPage && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content - Full screen on PDF viewer */}
      <main className={`fixed ${isPDFViewerPage ? 'inset-0' : `top-16 bottom-0 ${sidebarCollapsed ? 'left-16' : 'left-52'} right-0`} transition-all duration-300 overflow-hidden`}>
        <div className={`w-full h-full ${isPDFViewerPage ? '' : 'overflow-auto p-6'}`}>
          {children}
        </div>
      </main>
    </div>
  );
}
