"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MdLanguage, MdMenu, MdClose } from "react-icons/md";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Navbar() {
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { t, language, setLanguage } = useLanguage();

  useEffect(() => {
    checkLoginStatus();
  }, [pathname]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && typeof customEvent.detail.isFullscreen === 'boolean') {
        setIsFullscreen(customEvent.detail.isFullscreen);
      }
    };

    window.addEventListener('fullscreenChange', handleFullscreenChange);
    return () => window.removeEventListener('fullscreenChange', handleFullscreenChange);
  }, []);

  const checkLoginStatus = async () => {
    try {
      const response = await fetch("/api/user/verify");
      setIsLoggedIn(response.ok);
    } catch (error) {
      setIsLoggedIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/user/logout", { method: "POST" });
      setIsLoggedIn(false);
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const languages = [
    { code: "en", name: "English" },
    { code: "hi", name: "हिंदी" },
    { code: "mr", name: "मराठी" },
  ];

  // Hide navbar when in fullscreen mode
  if (isFullscreen) {
    return null;
  }

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex justify-between items-center h-16 sm:h-20 md:h-24">
          {/* Logo Section */}
          <Link href="/" className="flex items-center space-x-1.5 sm:space-x-2 md:space-x-3">
            {/* Circular Logo */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
              className="relative flex-shrink-0 flex items-center justify-center -mt-1"
            >
              <div className="h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 rounded-full flex items-center justify-center bg-white overflow-hidden">
                <div className="relative h-full w-full">
                  <Image
                    src="/images/circle-logo.jpeg"
                    alt="CrackTET Logo"
                    fill
                    className="object-cover rounded-full"
                    priority
                    quality={100}
                    sizes="(max-width: 640px) 56px, (max-width: 768px) 64px, 80px"
                    style={{
                      imageRendering: '-webkit-optimize-contrast',
                    }}
                  />
                </div>
              </div>
            </motion.div>

            {/* Vertical Separator */}
            <div className="h-12 sm:h-14 md:h-16 w-0.5 bg-gray-800 self-center"></div>

            {/* Rectangular Logo */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
              className="flex items-center justify-center h-12 sm:h-14 md:h-16 relative self-center"
            >
              <div className="relative h-full w-[120px] sm:w-[140px] md:w-[180px]">
                <Image
                  src="/images/cracktet-logo.png"
                  alt="CrackTET"
                  fill
                  className="object-contain"
                  priority
                  quality={100}
                  sizes="(max-width: 640px) 120px, (max-width: 768px) 140px, 180px"
                />
              </div>
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            <Link
              href="/"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === "/"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-700 hover:text-blue-600"
              }`}
            >
              {t.navbar.home}
            </Link>

            {!isLoggedIn && (
              <>
                <Link href="/login" className="relative overflow-hidden">
                  <span className="relative inline-block px-4 py-2 text-sm font-bold text-blue-600">
                    {t.navbar.login}
                    <motion.span
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
                      animate={{
                        x: ['-200%', '200%']
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear",
                        repeatDelay: 0.5
                      }}
                      style={{
                        width: '100%',
                        height: '100%',
                        pointerEvents: 'none'
                      }}
                    />
                  </span>
                </Link>

                <Link href="/register" className="relative overflow-hidden">
                  <span className="relative inline-block px-4 py-2 text-sm font-bold text-blue-600">
                    {t.navbar.register}
                    <motion.span
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
                      animate={{
                        x: ['-200%', '200%']
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear",
                        repeatDelay: 0.5
                      }}
                      style={{
                        width: '100%',
                        height: '100%',
                        pointerEvents: 'none'
                      }}
                    />
                  </span>
                </Link>
              </>
            )}

            {isLoggedIn && (
              <>
                <Link href="/dashboard/resources" className="relative overflow-hidden">
                  <span className="relative inline-block px-4 py-2 text-sm font-bold text-blue-600">
                    {t.navbar.resources}
                    <motion.span
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
                      animate={{
                        x: ['-200%', '200%']
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear",
                        repeatDelay: 0.5
                      }}
                      style={{
                        width: '100%',
                        height: '100%',
                        pointerEvents: 'none'
                      }}
                    />
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  {t.navbar.logout}
                </button>
              </>
            )}

            {/* Language Toggle */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors border border-gray-300"
              >
                <MdLanguage className="text-xl" />
                <span>{t.navbar.language || "Language"}</span>
              </motion.button>

              <AnimatePresence>
                {showLanguageMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg border border-gray-200 overflow-hidden"
                  >
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code);
                          setShowLanguageMenu(false);
                        }}
                        className={`block w-full text-left px-4 py-3 text-sm transition-colors ${
                          language === lang.code
                            ? "bg-blue-600 text-white"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {lang.name}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Mobile Register & Menu Buttons */}
          <div className="md:hidden flex items-center space-x-2">
            {!isLoggedIn && (
              <>
                <Link href="/login" className="relative overflow-hidden">
                  <span className="relative inline-block px-3 py-1.5 text-xs font-bold text-blue-600">
                    {t.navbar.login}
                    <motion.span
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
                      animate={{
                        x: ['-200%', '200%']
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear",
                        repeatDelay: 0.5
                      }}
                      style={{
                        width: '100%',
                        height: '100%',
                        pointerEvents: 'none'
                      }}
                    />
                  </span>
                </Link>

                <Link href="/register" className="relative overflow-hidden">
                  <span className="relative inline-block px-3 py-1.5 text-xs font-bold text-blue-600">
                    {t.navbar.register}
                    <motion.span
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
                      animate={{
                        x: ['-200%', '200%']
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear",
                        repeatDelay: 0.5
                      }}
                      style={{
                        width: '100%',
                        height: '100%',
                        pointerEvents: 'none'
                      }}
                    />
                  </span>
                </Link>
              </>
            )}

            {isLoggedIn && (
              <>
                <Link href="/dashboard/resources" className="relative overflow-hidden">
                  <span className="relative inline-block px-3 py-1.5 text-xs font-bold text-blue-600">
                    {t.navbar.resources}
                    <motion.span
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
                      animate={{
                        x: ['-200%', '200%']
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear",
                        repeatDelay: 0.5
                      }}
                      style={{
                        width: '100%',
                        height: '100%',
                        pointerEvents: 'none'
                      }}
                    />
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  {t.navbar.logout}
                </button>
              </>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100"
            >
              {mobileMenuOpen ? (
                <MdClose className="text-2xl" />
              ) : (
                <MdMenu className="text-2xl" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden overflow-hidden border-t border-gray-200"
            >
              <div className="py-4 space-y-3">
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block w-full text-left px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                    pathname === "/"
                      ? "bg-blue-50 text-blue-600 border-l-4 border-blue-600"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {t.navbar.home}
                </Link>

     

                <div className="px-4 pt-3 border-t border-gray-200">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                    {t.navbar.language || "Language"}
                  </p>
                  <div className="space-y-2">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code);
                        }}
                        className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                          language === lang.code
                            ? "bg-blue-600 text-white"
                            : "text-gray-700 hover:bg-gray-50 border border-gray-200"
                        }`}
                      >
                        {lang.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
