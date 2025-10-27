"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { FaGraduationCap } from "react-icons/fa";
import { MdLanguage } from "react-icons/md";
import { useState } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const { language, setLanguage, t } = useLanguage();
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  const languages = [
    { code: "en", name: "English" },
    { code: "hi", name: "हिंदी" },
    { code: "mr", name: "मराठी" },
  ];

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <FaGraduationCap className="text-3xl text-primary" />
            </motion.div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
              CrackTET
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-6">
            <Link
              href="/"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === "/"
                  ? "text-primary border-b-2 border-primary"
                  : "text-gray-700 hover:text-primary"
              }`}
            >
              {t.navbar.home}
            </Link>
            <Link
              href="/register"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === "/register"
                  ? "text-primary border-b-2 border-primary"
                  : "text-gray-700 hover:text-primary"
              }`}
            >
              {t.navbar.register}
            </Link>

            {/* Language Toggle */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary hover:bg-gray-100 transition-colors"
              >
                <MdLanguage className="text-xl" />
                <span>{language.toUpperCase()}</span>
              </motion.button>

              {showLanguageMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg border border-gray-200"
                >
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code as "en" | "hi" | "mr");
                        setShowLanguageMenu(false);
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 first:rounded-t-md last:rounded-b-md ${
                        language === lang.code
                          ? "bg-primary text-white hover:bg-primary-dark"
                          : "text-gray-700"
                      }`}
                    >
                      {lang.name}
                    </button>
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
