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
              className="relative w-80 h-80"
            >
              <Image
                src="/images/logo.png"
                alt="CrackTET Logo"
                fill
                className="object-contain"
                priority
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative h-[500px] w-full overflow-hidden bg-gradient-to-br from-[#8CC63F] to-[#6FA030]">

        {/* Hero Content */}
        {showContent && (
          <div className="relative z-10 h-full flex items-center justify-center text-white">
            <div className="text-center px-4 max-w-4xl mx-auto">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-5xl md:text-6xl font-bold mb-4 text-white"
              >
                {t.home.hero.title}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-xl md:text-2xl mb-8 text-white"
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
                  className="inline-block bg-primary text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-primary-dark transition-colors shadow-lg"
                >
                  {t.navbar.register}
                </Link>
              </motion.div>
            </div>
          </div>
        )}
      </section>

      {/* About TET Exam Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {t.home.aboutTET.title}
            </h2>
            <p className="text-xl text-primary font-semibold">
              {t.home.aboutTET.subtitle}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {t.home.aboutTET.points.map((point, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex items-start space-x-4 p-4 rounded-lg hover:bg-secondary-gray transition-colors"
              >
                <FaCheckCircle className="text-primary text-2xl flex-shrink-0 mt-1" />
                <p className="text-gray-700 leading-relaxed">{point}</p>
              </motion.div>
            ))}
          </div>

          {/* TET Exam Icons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12"
          >
            <div className="text-center p-6 bg-[#00A9E0] rounded-lg shadow-lg">
              <FaPenFancy className="text-5xl text-white mx-auto mb-3" />
              <p className="font-semibold text-white">150 MCQs</p>
            </div>
            <div className="text-center p-6 bg-[#F4B41A] rounded-lg shadow-lg">
              <FaClock className="text-5xl text-white mx-auto mb-3" />
              <p className="font-semibold text-white">2.5 Hours</p>
            </div>
            <div className="text-center p-6 bg-[#8CC63F] rounded-lg shadow-lg">
              <FaClipboardList className="text-5xl text-white mx-auto mb-3" />
              <p className="font-semibold text-white">2 Papers</p>
            </div>
            <div className="text-center p-6 bg-[#00A9E0] rounded-lg shadow-lg">
              <FaCertificate className="text-5xl text-white mx-auto mb-3" />
              <p className="font-semibold text-white">Lifetime Valid</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* What is CrackTET Section */}
      <section className="py-16 bg-secondary-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {t.home.whatIsCrackTET.title}
            </h2>
            <p className="text-lg text-gray-700 max-w-3xl mx-auto">
              {t.home.whatIsCrackTET.description}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {t.home.whatIsCrackTET.features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-white p-6 rounded-lg shadow-lg"
              >
                <div className="flex items-start space-x-3">
                  <FaCheckCircle className="text-[#8CC63F] text-xl flex-shrink-0 mt-1" />
                  <p className="text-gray-700">{feature}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose CrackTET Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {t.home.whyChoose.title}
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                  className={`${bgColor} text-white p-6 rounded-lg shadow-lg`}
                >
                    <Icon className="text-5xl mb-4 text-white" />
                  <h3 className="text-xl font-bold mb-2 text-white">{reason.title}</h3>
                  <p className="text-white">{reason.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-secondary-gray">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-bold mb-4 text-white"
          >
            Ready to Start Your TET Journey?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl mb-8 text-white"
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
              className="inline-block bg-white text-primary px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors shadow-lg"
            >
              Register Now
            </Link>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
