"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MdLanguage, MdMenu, MdClose } from "react-icons/md";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [language, setLanguage] = useState("en");
  const pathname = usePathname();

  const languages = [
    { code: "en", name: "English" },
    { code: "hi", name: "हिंदी" },
    { code: "mr", name: "मराठी" },
  ];

  const t = {
    en: { home: "Home", courses: "Courses", register: "Register", language: "Language" },
    hi: { home: "होम", courses: "कोर्स", register: "पंजीकरण", language: "भाषा" },
    mr: { home: "मुख्यपृष्ठ", courses: "अभ्यासक्रम", register: "नोंदणी", language: "भाषा" },
  };

  const translations = t[language as keyof typeof t] || t.en;

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
          <div className="hidden md:flex items-center space-x-6">
            <Link
              href="/"
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === "/"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-700 hover:text-blue-600"
              }`}
            >
              {translations.home}
            </Link>

            <Link
              href="#"
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === "/courses"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-700 hover:text-blue-600"
              }`}
            >
              {translations.courses}
            </Link>
            
            <Link href="/register">
              <motion.div
                animate={{
                  boxShadow: pathname === "/register" 
                    ? [
                        "0 0 5px #3b82f6",
                        "0 0 20px #3b82f6, 0 0 30px #60a5fa",
                        "0 0 5px #3b82f6"
                      ]
                    : [
                        "0 0 0px transparent",
                        "0 0 8px #e5e7eb",
                        "0 0 0px transparent"
                      ]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className={`px-6 py-2.5 rounded-md text-sm font-semibold transition-colors ${
                  pathname === "/register"
                    ? "text-white bg-blue-600 border-2 border-blue-600"
                    : "text-gray-700 hover:text-blue-600 border-2 border-gray-300 hover:border-blue-400 bg-white"
                }`}
              >
                {translations.register}
              </motion.div>
            </Link>

            {/* Language Toggle */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors border border-gray-300"
              >
                <MdLanguage className="text-xl" />
                <span>{translations.language}</span>
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
          <div className="md:hidden flex items-center space-x-3">
            <Link href="/register">
              <motion.div
                animate={{
                  boxShadow: [
                    "0 0 3px #3b82f6",
                    "0 0 15px #3b82f6, 0 0 20px #60a5fa",
                    "0 0 3px #3b82f6"
                  ]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className={`px-4 py-2 rounded-md text-xs font-semibold transition-colors ${
                  pathname === "/register"
                    ? "text-white bg-blue-600 border-2 border-blue-600"
                    : "text-blue-600 bg-white border-2 border-blue-500"
                }`}
              >
                {translations.register}
              </motion.div>
            </Link>

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
                  {translations.home}
                </Link>

                <Link
                  href="#"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block w-full text-left px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                    pathname === "/courses"
                      ? "bg-blue-50 text-blue-600 border-l-4 border-blue-600"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {translations.courses}
                </Link>

                <div className="px-4 pt-3 border-t border-gray-200">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                    {translations.language}
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
