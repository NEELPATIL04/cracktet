"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FaSpinner, FaCheckCircle, FaExclamationCircle, FaClock } from "react-icons/fa";
import { motion } from "framer-motion";

interface PaymentStatusData {
  success: boolean;
  status: string;
  order: {
    id: string;
    amount: string;
    status: string;
    paymentId?: string;
    completedAt?: string;
    createdAt: string;
  };
  user: {
    id: number;
    name: string;
    email: string;
    mobile: string;
  };
}

export default function PaymentStatusPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;
  
  const [statusData, setStatusData] = useState<PaymentStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pollingCount, setPollingCount] = useState(0);

  const fetchPaymentStatus = async () => {
    try {
      const response = await fetch(`/api/payment/status/${orderId}`);
      const data = await response.json();
      
      if (response.ok) {
        setStatusData(data);
        setError("");
        
        // Stop polling if payment is completed or failed
        if (data.status === "completed" || data.status === "failed") {
          setLoading(false);
          return true; // Stop polling
        }
      } else {
        setError(data.error || "Failed to fetch payment status");
        setLoading(false);
        return true; // Stop polling on error
      }
    } catch (err) {
      setError("Failed to fetch payment status");
      setLoading(false);
      return true; // Stop polling on error
    }
    
    return false; // Continue polling
  };

  useEffect(() => {
    if (!orderId) {
      setError("Invalid order ID");
      setLoading(false);
      return;
    }

    // Initial fetch
    fetchPaymentStatus();

    // Set up polling every 3 seconds for pending payments
    const pollInterval = setInterval(async () => {
      setPollingCount(prev => prev + 1);
      const shouldStop = await fetchPaymentStatus();
      
      if (shouldStop || pollingCount >= 40) { // Stop after 2 minutes
        clearInterval(pollInterval);
        setLoading(false);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [orderId]);

  const getStatusIcon = () => {
    if (loading && !statusData) {
      return <FaSpinner className="text-6xl text-blue-500 animate-spin" />;
    }
    
    switch (statusData?.status) {
      case "completed":
        return <FaCheckCircle className="text-6xl text-green-500" />;
      case "failed":
        return <FaExclamationCircle className="text-6xl text-red-500" />;
      case "pending":
        return <FaClock className="text-6xl text-yellow-500" />;
      default:
        return <FaSpinner className="text-6xl text-blue-500 animate-spin" />;
    }
  };

  const getStatusMessage = () => {
    if (loading && !statusData) {
      return "Checking payment status...";
    }
    
    switch (statusData?.status) {
      case "completed":
        return "Payment Successful!";
      case "failed":
        return "Payment Failed";
      case "pending":
        return "Payment Pending";
      default:
        return "Checking payment status...";
    }
  };

  const getStatusDescription = () => {
    if (loading && !statusData) {
      return "Please wait while we verify your payment.";
    }
    
    switch (statusData?.status) {
      case "completed":
        return "Your registration has been completed successfully.";
      case "failed":
        return "Your payment could not be processed. Please try again.";
      case "pending":
        return "We are processing your payment. This may take a few moments.";
      default:
        return "Please wait while we verify your payment.";
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <FaExclamationCircle className="text-6xl text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center"
      >
        <div className="mb-6">
          {getStatusIcon()}
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          {getStatusMessage()}
        </h1>
        
        <p className="text-gray-600 mb-6">
          {getStatusDescription()}
        </p>

        {statusData && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-gray-800 mb-2">Order Details</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p><span className="font-medium">Order ID:</span> {statusData.order.id}</p>
              <p><span className="font-medium">Amount:</span> ₹{statusData.order.amount}</p>
              <p><span className="font-medium">Status:</span> {statusData.order.status}</p>
              {statusData.order.paymentId && (
                <p><span className="font-medium">Payment ID:</span> {statusData.order.paymentId}</p>
              )}
              {statusData.order.completedAt && (
                <p><span className="font-medium">Completed At:</span> {new Date(statusData.order.completedAt).toLocaleString()}</p>
              )}
            </div>
          </div>
        )}

        {statusData?.status === "pending" && loading && (
          <div className="text-sm text-gray-500 mb-4">
            <p>Checking status... ({pollingCount} attempts)</p>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((pollingCount / 40) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex gap-3">
          {statusData?.status === "completed" && (
            <button
              onClick={() => router.push("/")}
              className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              Continue
            </button>
          )}
          
          {statusData?.status === "failed" && (
            <button
              onClick={() => router.push("/register")}
              className="flex-1 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Try Again
            </button>
          )}
          
          <button
            onClick={() => router.push("/")}
            className="flex-1 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </motion.div>
    </div>
  );
}