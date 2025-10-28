"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
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

const slides = [
  {
    image: "/images/slide1.jpg",
    title: "Master the TET Exam",
    description: "Comprehensive preparation for Maharashtra Teacher Eligibility Test",
  },
  {
    image: "/images/slide2.jpg",
    title: "Expert Study Materials",
    description: "Access quality resources curated by experienced educators",
  },
  {
    image: "/images/slide3.jpg",
    title: "Practice with Mock Tests",
    description: "Simulate real exam environment and boost your confidence",
  },
];

export default function Home() {
  const { t } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <main className="min-h-screen w-full overflow-x-hidden">
      {/* Hero Slideshow */}
      <section className="relative h-[500px] w-full overflow-hidden bg-secondary-gray">
        {/* Slideshow Background */}
        <div className="absolute inset-0">
          {slides.map((slide, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0 }}
              animate={{ opacity: currentSlide === index ? 0.3 : 0 }}
              transition={{ duration: 1 }}
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${slide.image})`,
                display: currentSlide === index ? "block" : "none",
              }}
            />
          ))}
        </div>

        {/* Hero Content */}
        <div className="relative z-10 h-full flex items-center justify-center text-white">
          <div className="text-center px-4 max-w-4xl mx-auto">
            <motion.h1
              key={currentSlide}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-5xl md:text-6xl font-bold mb-4 text-white"
            >
              {t.home.hero.title}
            </motion.h1>
            <motion.p
              key={`subtitle-${currentSlide}`}
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

        {/* Slide Indicators */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3 z-20">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                currentSlide === index ? "bg-white w-8" : "bg-white/50"
              }`}
            />
          ))}
        </div>
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
            <div className="text-center p-6 bg-secondary-gray rounded-lg">
              <FaPenFancy className="text-5xl text-primary mx-auto mb-3" />
              <p className="font-semibold">150 MCQs</p>
            </div>
            <div className="text-center p-6 bg-secondary-gray rounded-lg">
              <FaClock className="text-5xl text-primary mx-auto mb-3" />
              <p className="font-semibold">2.5 Hours</p>
            </div>
            <div className="text-center p-6 bg-secondary-gray rounded-lg">
              <FaClipboardList className="text-5xl text-primary mx-auto mb-3" />
              <p className="font-semibold">2 Papers</p>
            </div>
            <div className="text-center p-6 bg-secondary-gray rounded-lg">
              <FaCertificate className="text-5xl text-primary mx-auto mb-3" />
              <p className="font-semibold">Lifetime Valid</p>
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
                  <FaCheckCircle className="text-primary text-xl flex-shrink-0 mt-1" />
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

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className="bg-secondary-gray text-white p-6 rounded-lg shadow-lg border border-white/20"
                >
                  {/* <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  > */}
                    <Icon className="text-5xl mb-4 text-white" />
                  {/* </motion.div> */}
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
