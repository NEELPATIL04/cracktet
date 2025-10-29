"use client";

import { useEffect, useState } from "react";
import { FaSpinner, FaTimes, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: number;
  userName: string;
  userMobile: string;
  registrationFee: number;
  onSuccess: () => void;
}

export default function PaymentModal({
  isOpen,
  onClose,
  userId,
  userName,
  userMobile,
  registrationFee,
  onSuccess,
}: PaymentModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "failed">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    // Load Razorpay SDK
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const initializePayment = async () => {
    setIsLoading(true);
    setError("");

    try {
      // Create order
      const orderResponse = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, mobile: userMobile, name: userName }),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.error || "Failed to create payment order");
      }

      const orderData = await orderResponse.json();

      // Configure Razorpay options
      const options = {
        key: orderData.keyId,
        amount: orderData.amount * 100, // Amount in paise
        currency: orderData.currency,
        name: "CrackTET Registration",
        description: "Registration Fee",
        order_id: orderData.orderId,
        prefill: {
          name: userName,
          contact: userMobile,
          email: orderData.user.email,
        },
        theme: {
          color: "#F37254",
        },
        handler: async function (response: any) {
          setPaymentStatus("processing");
          
          // Verify payment
          const verifyResponse = await fetch("/api/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          if (verifyResponse.ok) {
            setPaymentStatus("success");
            
            // Redirect to payment status page for polling
            setTimeout(() => {
              window.location.href = `/payment-status/${response.razorpay_order_id}`;
            }, 1500);
          } else {
            throw new Error("Payment verification failed");
          }
        },
        modal: {
          ondismiss: function () {
            setIsLoading(false);
          },
        },
      };

      // Open Razorpay checkout
      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", function (response: any) {
        setPaymentStatus("failed");
        setError(response.error.description || "Payment failed");
        setIsLoading(false);
      });

      razorpay.open();
    } catch (error: any) {
      console.error("Payment error:", error);
      setError(error.message || "Failed to initialize payment");
      setPaymentStatus("failed");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && paymentStatus === "idle") {
      initializePayment();
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-lg p-6 max-w-md w-full"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Complete Payment</h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
                disabled={paymentStatus === "processing"}
              >
                <FaTimes />
              </button>
            </div>

            <div className="text-center py-8">
              {paymentStatus === "idle" && isLoading && (
                <>
                  <FaSpinner className="text-5xl text-primary animate-spin mx-auto mb-4" />
                  <p className="text-gray-600">Initializing payment...</p>
                  <p className="text-2xl font-bold mt-2">₹{registrationFee}</p>
                </>
              )}

              {paymentStatus === "processing" && (
                <>
                  <FaSpinner className="text-5xl text-primary animate-spin mx-auto mb-4" />
                  <p className="text-gray-600">Processing payment...</p>
                </>
              )}

              {paymentStatus === "success" && (
                <>
                  <FaCheckCircle className="text-5xl text-green-500 mx-auto mb-4" />
                  <p className="text-green-600 font-semibold">Payment Successful!</p>
                  <p className="text-gray-600 mt-2">Registration completed successfully</p>
                </>
              )}

              {paymentStatus === "failed" && (
                <>
                  <FaExclamationCircle className="text-5xl text-red-500 mx-auto mb-4" />
                  <p className="text-red-600 font-semibold">Payment Failed</p>
                  <p className="text-gray-600 mt-2">{error}</p>
                  <button
                    onClick={() => {
                      setPaymentStatus("idle");
                      initializePayment();
                    }}
                    className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                  >
                    Retry Payment
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}