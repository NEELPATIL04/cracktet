"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaUser,
  FaMapMarkerAlt,
  FaPhone,
  FaLock,
  FaBook,
  FaUsers,
  FaChartLine,
  FaGlobe,
  FaLightbulb,
  FaCheckCircle,
} from "react-icons/fa";

export default function Register() {
  const { t } = useLanguage();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    district: "",
    mobile: "",
    password: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = t.register.errors.nameRequired;
    }

    if (!formData.district) {
      newErrors.district = t.register.errors.districtRequired;
    }

    if (!formData.mobile) {
      newErrors.mobile = t.register.errors.mobileRequired;
    } else if (!/^\d{10}$/.test(formData.mobile)) {
      newErrors.mobile = t.register.errors.mobileInvalid;
    }

    if (!formData.password) {
      newErrors.password = t.register.errors.passwordRequired;
    } else if (formData.password.length < 6) {
      newErrors.password = t.register.errors.passwordMinLength;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === "Mobile number already registered") {
          setErrors({ mobile: t.register.errors.mobileExists });
        } else {
          setErrors({ general: data.error || "Registration failed" });
        }
        return;
      }

      // Show success popup
      setShowSuccess(true);

      // Redirect to home after 2 seconds
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (error) {
      console.error("Registration error:", error);
      setErrors({ general: "An error occurred. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-secondary-gray py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {t.register.title}
          </h1>
          <p className="text-xl text-gray-600">{t.register.subtitle}</p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Registration Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-lg shadow-lg p-8"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Field */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {t.register.form.name}
                </label>
                <div className="relative">
                  <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder={t.register.form.namePlaceholder}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                      errors.name ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                </div>
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              {/* District Field */}
              <div>
                <label
                  htmlFor="district"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {t.register.form.district}
                </label>
                <div className="relative">
                  <FaMapMarkerAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
                  <select
                    id="district"
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary appearance-none bg-white ${
                      errors.district ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    <option value="">{t.register.form.districtPlaceholder}</option>
                    {t.register.districts.map((district) => (
                      <option key={district} value={district}>
                        {district}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.district && (
                  <p className="text-red-500 text-sm mt-1">{errors.district}</p>
                )}
              </div>

              {/* Mobile Field */}
              <div>
                <label
                  htmlFor="mobile"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {t.register.form.mobile}
                </label>
                <div className="relative">
                  <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    id="mobile"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    placeholder={t.register.form.mobilePlaceholder}
                    maxLength={10}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                      errors.mobile ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                </div>
                {errors.mobile && (
                  <p className="text-red-500 text-sm mt-1">{errors.mobile}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {t.register.form.password}
                </label>
                <div className="relative">
                  <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder={t.register.form.passwordPlaceholder}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                      errors.password ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                </div>
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                )}
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full bg-gradient-to-r from-primary to-primary-dark text-white py-3 rounded-lg font-semibold text-lg transition-all shadow-lg hover:shadow-xl ${
                  isLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isLoading ? "Registering..." : t.register.form.submit}
              </motion.button>

              {errors.general && (
                <p className="text-red-500 text-sm text-center">{errors.general}</p>
              )}
            </form>
          </motion.div>

          {/* Why Choose CrackTET Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-6"
          >
            <div className="bg-gradient-to-br from-primary to-primary-dark text-white rounded-lg shadow-lg p-8">
              <h2 className="text-3xl font-bold mb-6">
                {t.home.whyChoose.title}
              </h2>
              <div className="space-y-4">
                {t.home.whyChoose.reasons.map((reason, index) => {
                  const icons = [
                    FaBook,
                    FaUsers,
                    FaChartLine,
                    FaGlobe,
                    FaLightbulb,
                    FaCheckCircle,
                  ];
                  const Icon = icons[index % icons.length];

                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                      className="flex items-start space-x-4 p-4 bg-white/10 rounded-lg backdrop-blur-sm"
                    >
                      <Icon className="text-2xl flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-semibold text-lg mb-1">
                          {reason.title}
                        </h3>
                        <p className="text-white/90 text-sm">
                          {reason.description}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Success Popup */}
      {showSuccess && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-lg p-8 max-w-md mx-4 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
            >
              <FaCheckCircle className="text-6xl text-green-500 mx-auto mb-4" />
            </motion.div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {t.register.success}
            </h2>
            <p className="text-gray-600">{t.register.successMessage}</p>
          </motion.div>
        </motion.div>
      )}
    </main>
  );
}
