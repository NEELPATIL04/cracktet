"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaBook,
  FaUsers,
  FaChartLine,
  FaGlobe,
  FaLightbulb,
  FaCheckCircle,
  FaPenFancy,
  FaCertificate,
  FaClipboardList,
  FaClock,
} from "react-icons/fa";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  const { t } = useLanguage();
  const [showLogo, setShowLogo] = useState(true);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Hide logo after 2 seconds and show content
    const logoTimer = setTimeout(() => {
      setShowLogo(false);
      setShowContent(true);
    }, 2000);

    return () => clearTimeout(logoTimer);
  }, []);

  return (
    <main className="min-h-screen w-full overflow-x-hidden">
      {/* Logo Animation */}
      <AnimatePresence>
        {showLogo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-white"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.2, opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="relative w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80"
            >
              <Image
                src="/images/circle-logo.jpeg"
                alt="CrackTET Logo"
                fill
                className="object-contain"
                priority
                quality={100}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative h-[400px] sm:h-[500px] md:h-[600px] w-full overflow-hidden bg-gradient-to-br from-[#8CC63F] to-[#6FA030]">
        {/* Hero Content */}
        {showContent && (
          <div className="relative z-10 h-full flex items-center justify-center text-white px-4">
            <div className="text-center max-w-4xl mx-auto">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-white"
              >
                {t.home.hero.title}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 md:mb-8 text-white"
              >
                {t.home.hero.subtitle}
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <Link
                  href="/register"
                  className="inline-block bg-primary text-white px-6 py-3 sm:px-8 sm:py-4 rounded-lg font-semibold text-base sm:text-lg hover:bg-primary-dark transition-colors shadow-lg"
                >
                  {t.navbar.register}
                </Link>
              </motion.div>
            </div>
          </div>
        )}
      </section>

      {/* About TET Exam Section */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 sm:mb-12"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t.home.aboutTET.title}
            </h2>
            <p className="text-lg sm:text-xl text-primary font-semibold">
              {t.home.aboutTET.subtitle}
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {t.home.aboutTET.points.map((point, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex items-start space-x-3 sm:space-x-4 p-3 sm:p-4 rounded-lg hover:bg-secondary-gray transition-colors"
              >
                <FaCheckCircle className="text-primary text-xl sm:text-2xl flex-shrink-0 mt-1" />
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">{point}</p>
              </motion.div>
            ))}
          </div>

          {/* TET Exam Icons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mt-8 sm:mt-12"
          >
            <div className="text-center p-4 sm:p-6 bg-[#00A9E0] rounded-lg shadow-lg">
              <FaPenFancy className="text-3xl sm:text-4xl md:text-5xl text-white mx-auto mb-2 sm:mb-3" />
              <p className="font-semibold text-white text-sm sm:text-base">150 MCQs</p>
            </div>
            <div className="text-center p-4 sm:p-6 bg-[#F4B41A] rounded-lg shadow-lg">
              <FaClock className="text-3xl sm:text-4xl md:text-5xl text-white mx-auto mb-2 sm:mb-3" />
              <p className="font-semibold text-white text-sm sm:text-base">2.5 Hours</p>
            </div>
            <div className="text-center p-4 sm:p-6 bg-[#8CC63F] rounded-lg shadow-lg">
              <FaClipboardList className="text-3xl sm:text-4xl md:text-5xl text-white mx-auto mb-2 sm:mb-3" />
              <p className="font-semibold text-white text-sm sm:text-base">2 Papers</p>
            </div>
            <div className="text-center p-4 sm:p-6 bg-[#00A9E0] rounded-lg shadow-lg">
              <FaCertificate className="text-3xl sm:text-4xl md:text-5xl text-white mx-auto mb-2 sm:mb-3" />
              <p className="font-semibold text-white text-sm sm:text-base">Lifetime Valid</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* What is CrackTET Section */}
      <section className="py-12 sm:py-16 bg-secondary-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 sm:mb-12"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What is CrackTET?
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-700 max-w-3xl mx-auto">
              {t.home.whatIsCrackTET.description}
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {t.home.whatIsCrackTET.features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-white p-4 sm:p-6 rounded-lg shadow-lg"
              >
                <div className="flex items-start space-x-2 sm:space-x-3">
                  <FaCheckCircle className="text-[#8CC63F] text-lg sm:text-xl flex-shrink-0 mt-1" />
                  <p className="text-sm sm:text-base text-gray-700">{feature}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose CrackTET Section */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 sm:mb-12"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose CrackTET?
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {t.home.whyChoose.reasons.map((reason, index) => {
              const icons = [
                FaBook,
                FaUsers,
                FaClipboardList,
                FaChartLine,
                FaGlobe,
                FaLightbulb,
              ];
              const Icon = icons[index % icons.length];

              // Alternate between logo colors
              const colors = [
                "bg-[#00A9E0]", // Blue
                "bg-[#F4B41A]", // Gold
                "bg-[#8CC63F]", // Green
              ];
              const bgColor = colors[index % colors.length];

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className={`${bgColor} text-white p-4 sm:p-6 rounded-lg shadow-lg`}
                >
                  <Icon className="text-3xl sm:text-4xl md:text-5xl mb-3 sm:mb-4 text-white" />
                  <h3 className="text-lg sm:text-xl font-bold mb-2 text-white">{reason.title}</h3>
                  <p className="text-sm sm:text-base text-white">{reason.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-12 sm:py-16 bg-gradient-to-br from-[#8CC63F] to-[#6FA030]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-white"
          >
            Ready to Start Your TET Journey?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 text-white"
          >
            Join thousands of aspiring teachers preparing for Maharashtra TET
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Link
              href="/register"
              className="inline-block bg-white text-primary px-6 py-3 sm:px-8 sm:py-4 rounded-lg font-semibold text-base sm:text-lg hover:bg-gray-100 transition-colors shadow-lg"
            >
              Register Now
            </Link>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
