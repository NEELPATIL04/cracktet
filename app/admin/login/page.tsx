"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaUserShield, FaLock, FaCheckCircle } from "react-icons/fa";

export default function AdminLogin() {
  const { t } = useLanguage();
  const router = useRouter();
  const [formData, setFormData] = useState({
    adminId: "",
    password: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.adminId.trim()) {
      newErrors.adminId = t.adminLogin.errors.adminIdRequired;
    }

    if (!formData.password) {
      newErrors.password = t.adminLogin.errors.passwordRequired;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ general: t.adminLogin.errors.invalidCredentials });
        return;
      }

      // Show success message
      setShowSuccess(true);

      // Redirect to admin dashboard after 1.5 seconds
      setTimeout(() => {
        router.push("/admin");
      }, 1500);
    } catch (error) {
      console.error("Login error:", error);
      setErrors({ general: "An error occurred. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        {/* Logo/Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg mb-4">
            <FaUserShield className="text-4xl text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {t.adminLogin.title}
          </h1>
          <p className="text-white/80">{t.adminLogin.subtitle}</p>
        </motion.div>

        {/* Login Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-white rounded-lg shadow-2xl p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Admin ID Field */}
            <div>
              <label
                htmlFor="adminId"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {t.adminLogin.form.adminId}
              </label>
              <div className="relative">
                <FaUserShield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  id="adminId"
                  name="adminId"
                  value={formData.adminId}
                  onChange={handleChange}
                  placeholder={t.adminLogin.form.adminIdPlaceholder}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                    errors.adminId ? "border-red-500" : "border-gray-300"
                  }`}
                />
              </div>
              {errors.adminId && (
                <p className="text-red-500 text-sm mt-1">{errors.adminId}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {t.adminLogin.form.password}
              </label>
              <div className="relative">
                <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={t.adminLogin.form.passwordPlaceholder}
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
              {isLoading ? "Logging in..." : t.adminLogin.form.submit}
            </motion.button>

            {errors.general && (
              <p className="text-red-500 text-sm text-center">{errors.general}</p>
            )}
          </form>
        </motion.div>

        {/* Info Box */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center"
        >
          <p className="text-white/90 text-sm">
            For security purposes, only authorized personnel can access this area.
          </p>
        </motion.div>
      </motion.div>

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
            <p className="text-gray-600 text-lg">{t.adminLogin.redirecting}</p>
          </motion.div>
        </motion.div>
      )}
    </main>
  );
}
