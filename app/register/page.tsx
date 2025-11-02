"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PaymentModal from "@/components/PaymentModal";
import {
  FaUser,
  FaMapMarkerAlt,
  FaHome,
  FaPhone,
  FaLock,
  FaBook,
  FaUsers,
  FaChartLine,
  FaGlobe,
  FaLightbulb,
  FaCheckCircle,
  FaEnvelope,
  FaEye,
  FaEyeSlash,
  FaRupeeSign,
} from "react-icons/fa";

export default function Register() {
  const { t } = useLanguage();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    district: "",
    address: "",
    mobile: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [registrationFee, setRegistrationFee] = useState(2500);
  const [showWelcomePopup, setShowWelcomePopup] = useState(true);
  const [popupLanguage, setPopupLanguage] = useState<'en' | 'mr'>('en');

  useEffect(() => {
    // Fetch registration fee from settings
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.registrationFee) {
          setRegistrationFee(data.registrationFee);
        }
      })
      .catch(console.error);
  }, []);

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

    if (!formData.email.trim()) {
      newErrors.email = t.register.errors.emailRequired;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t.register.errors.emailInvalid;
    }

    if (!formData.district) {
      newErrors.district = t.register.errors.districtRequired;
    }

    if (!formData.address.trim()) {
      newErrors.address = t.register.errors.addressRequired;
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

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t.register.errors.confirmPasswordRequired;
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t.register.errors.passwordMismatch;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // Check if email or mobile already exists before proceeding to payment
      const checkResponse = await fetch("/api/check-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          mobile: formData.mobile,
        }),
      });

      const checkData = await checkResponse.json();

      if (!checkResponse.ok) {
        if (checkData.field === "email") {
          setErrors({ email: t.register.errors.emailExists });
        } else if (checkData.field === "mobile") {
          setErrors({ mobile: t.register.errors.mobileExists });
        } else {
          setErrors({ general: checkData.error || "Validation failed" });
        }
        return;
      }

      // Proceed to payment modal without creating user
      setShowPaymentModal(true);
    } catch (error) {
      console.error("Validation error:", error);
      setErrors({ general: "An error occurred. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const welcomeContent = {
    en: {
      title: "For All TET Aspirants",
      points: [
        "As you stand on the very threshold of becoming a teacher We, on behalf of our institution, are conducting this special initiative to help you achieve complete success in the TET / TAIT examination.",
        "CRACKTET is a simple, easy-to-understand, and affordable coaching program designed especially for all aspirants.",
        ">> While preparing for the examination, you will be guided through everything you need to know about the TET / TAIT exams.",
        ">> Our key objective is to help you overcome exam-related fear and approach the test with complete confidence and composure.",
        "What will you get through our coaching ?",
        "■ In just 20 days, you will gain complete online knowledge and understanding of the TET / TAIT syllabus.",
        "■ You will get 15+ online practice question papers covering all five subjects of examination.",
        "■ Model answer sheets and additional online guidance related to the TET / TAIT syllabus will be provided.",
        "■ You will get one exclusive interactive video session on how to Face the TET / TAIT examination.",
        "■ Separate subject wise five expert-guided video sessions, will be included.",
        "■ This initiative is designed to make the TET / TAIT exam simple, clear, and easily manageable. Helping you become more capable, and confident. We are sure you will find this program truly beneficial.",
        "Hope you've understood everything clearly...",
        "Would you like to join our short-term yet highly effective and success-oriented initiative that offers rich, valuable guidance for the TET / TAIT examination and ensures outstanding results?"
      ]
    },
    mr: {
      title: "सर्व परीक्षार्थी उमेदवारांना...",
      points: [
        "आपण शिक्षक होण्याच्या अगदी उंबरठ्यावर असताना आपणास TET /TAIT या परीक्षेमध्ये परिपूर्ण यश मिळावे म्हणून आमच्या संस्थेच्या वतीने आम्ही हा खास उपक्रम राबवत आहोत.",
        "CRACKTET हा अतिशय महत्त्वाकांक्षी आणि सर्व परीक्षार्थी यांच्यासाठी अत्यंत सोपा सुटसुटीत कमी व सुलभ शुल्कात एक कोचिंग प्रकार आहे.",
        ">> परीक्षेला सामोरे जाताना TET /TAIT परीक्षेबाबत आपणांस सर्वकाही अवगत करून दिले जाईल.",
        ">> आपल्या मनातील भीती नाहीसी व्हावी व आपण अत्यंत आत्मविश्वास आणि संयमाने या परीक्षेकडे पाहावे हा आमच्या संस्थेचा महत्त्वाचा उद्देश आहे.",
        "आमच्या कोचिंगमधून आम्ही आपणांस काय देऊ...?",
        "■ TET /TAIT परीक्षेचे अवघ्या वीस दिवसात ऑनलाईन परिपूर्ण ज्ञान मिळेल.",
        "■ परीक्षेसाठी असणाऱ्या पाच विषयांच्या पंधरा प्लस सराव प्रश्नपत्रिका ऑनलाईन मिळतील.",
        "■ TET /TAIT सराव प्रश्नपत्रिकांचे उत्तरे व इतर सर्व अनुषंगिक ऑनलाईन मार्गदर्शन यामध्ये समाविष्ट राहील.",
        "■ TET /TAIT परीक्षेला सामोरे जाताना हा अतिशय महत्त्वाचा एक संवाद व्हिडिओ दिला जाईल.",
        "■ TET /TAIT परीक्षेसाठी असलेल्या पाच विषयांवर तज्ञ मार्गदर्शक यांचा प्रत्येकी एक असे वेगवेगळे पाच स्वतंत्र संवाद व्हिडिओ दिले जातील.",
        "■ TET /TAIT परीक्षा सोपी सुलभ व सहज व्हावी या परीक्षेबाबत सजगता व सक्षमता यावी असा हा उपक्रम निश्चित आपणास पसंत पडेल याची आम्हाला खात्री आहे.",
        "आपले आता सर्व लक्षात आलेच असेलतर मग...",
        "TET / TAIT परीक्षेसाठी अल्पकाळात भरघोस व अत्यंत उपयुक्त माहिती आणि हमखास यश मिळवून देणाऱ्या आमच्या उपक्रमात आपणास सहभागी व्हायचे आहे का ?"
      ]
    }
  };

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-secondary-gray py-12">
      {/* Welcome Popup */}
      {showWelcomePopup && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-3 md:p-4"
          onClick={() => setShowWelcomePopup(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ duration: 0.4, type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] md:max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with language toggle */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 bg-gradient-to-r from-[#8CC63F] to-[#6FA030] flex-shrink-0">
              <h2 className="text-lg md:text-2xl font-bold text-white">
                {welcomeContent[popupLanguage].title}
              </h2>
              <div className="flex items-center space-x-2 md:space-x-4">
                <div className="flex bg-white/20 rounded-lg p-0.5 md:p-1">
                  <button
                    onClick={() => setPopupLanguage('en')}
                    className={`px-2 md:px-3 py-1 rounded-md text-xs md:text-sm font-medium transition-all ${
                      popupLanguage === 'en'
                        ? 'bg-white text-[#8CC63F] shadow-md'
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => setPopupLanguage('mr')}
                    className={`px-2 md:px-3 py-1 rounded-md text-xs md:text-sm font-medium transition-all ${
                      popupLanguage === 'mr'
                        ? 'bg-white text-[#8CC63F] shadow-md'
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    मराठी
                  </button>
                </div>
                <button
                  onClick={() => setShowWelcomePopup(false)}
                  className="text-white hover:bg-white/20 rounded-lg p-1.5 md:p-2 transition-all hover:rotate-90 duration-300"
                >
                  <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 md:p-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                {welcomeContent[popupLanguage].points.map((point, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -50, y: 10 }}
                    animate={{ opacity: 1, x: 0, y: 0 }}
                    transition={{ 
                      duration: 0.6, 
                      delay: 0.5 + index * 0.3, 
                      ease: "easeOut" 
                    }}
                    className="text-gray-700 leading-relaxed font-sans text-sm md:text-base"
                  >
                    {point}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.3 }}
              className="flex items-center justify-center p-4 md:p-6 border-t border-gray-200 bg-gradient-to-b from-gray-50 to-white flex-shrink-0"
            >
              <button
                onClick={() => setShowWelcomePopup(false)}
                className="w-full md:w-auto bg-gradient-to-r from-[#8CC63F] to-[#6FA030] text-white px-6 md:px-8 py-3 md:py-4 rounded-xl font-semibold text-base md:text-lg hover:from-[#6FA030] hover:to-[#5A8A26] transition-all shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
              >
                {popupLanguage === 'en' ? 'Continue to Registration →' : 'नोंदणी सुरू करा →'}
              </button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-white mb-4">
            {t.register.title}
          </h1>
          <p className="text-xl text-white">{t.register.subtitle}</p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 lg:items-stretch">
          {/* Registration Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-lg shadow-lg p-8 flex flex-col"
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

              {/* Email Field */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {t.register.form.email}
                </label>
                <div className="relative">
                  <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder={t.register.form.emailPlaceholder}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                      errors.email ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
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

              {/* Address Field */}
              <div>
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {t.register.form.address}
                </label>
                <div className="relative">
                  <FaHome className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder={t.register.form.addressPlaceholder}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                      errors.address ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                </div>
                {errors.address && (
                  <p className="text-red-500 text-sm mt-1">{errors.address}</p>
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
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder={t.register.form.passwordPlaceholder}
                    className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                      errors.password ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {t.register.form.confirmPassword}
                </label>
                <div className="relative">
                  <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder={t.register.form.confirmPasswordPlaceholder}
                    className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                      errors.confirmPassword ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Registration Fee Info */}
              <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 font-medium">Registration Fee:</span>
                  <span className="text-xl font-bold text-primary flex items-center">
                    <FaRupeeSign className="mr-1" />
                    {registrationFee}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Payment will be processed after registration
                </p>
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
                {isLoading ? "Registering..." : `${t.register.form.submit} & Pay ₹${registrationFee}`}
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
            className="flex flex-col"
          >
            <div className="bg-gradient-to-br from-primary to-primary-dark text-white rounded-lg shadow-lg p-8 flex-1 flex flex-col h-full">
              <h2 className="text-3xl font-bold mb-6 text-white">
                {t.home.whyChoose.title}
              </h2>
              <div className="space-y-4 flex-1">
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
                      <Icon className="text-2xl flex-shrink-0 mt-1 text-white" />
                      <div>
                        <h3 className="font-semibold text-lg mb-1 text-white">
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

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        registrationData={formData}
        registrationFee={registrationFee}
        onSuccess={() => {
          setShowSuccess(true);
          setTimeout(() => {
            router.push("/");
          }, 2000);
        }}
      />

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