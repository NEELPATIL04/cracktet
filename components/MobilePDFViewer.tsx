"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiArrowLeft } from "react-icons/fi";

interface MobilePDFViewerProps {
  pdfUrl: string;
  resourceTitle: string;
  userName: string;
  userEmail: string;
  userMobile: string;
  pageCount: number;
}

export default function MobilePDFViewer({
  pdfUrl,
  resourceTitle,
  userName,
  userEmail,
  userMobile,
  pageCount,
}: MobilePDFViewerProps) {
  const router = useRouter();

  // Open PDF in new tab for mobile viewing
  useEffect(() => {
    console.log("📱 Mobile PDF: Opening PDF in new tab");
    
    // Open PDF in new tab so back button works properly
    window.open(pdfUrl, '_blank');
    
    // After opening PDF, redirect back to resources
    setTimeout(() => {
      router.push("/dashboard/resources");
    }, 1000);
  }, [pdfUrl, router]);

  return (
    <div className="relative w-full h-screen bg-white flex flex-col items-center justify-center">
      {/* Back Button */}
      <div className="absolute top-4 left-4 z-50">
        <button
          onClick={() => router.push("/dashboard/resources")}
          className="flex items-center space-x-2 bg-white hover:bg-gray-50 text-gray-800 px-4 py-2 rounded-lg shadow-lg border border-gray-200 transition-all"
          title="Back to Resources"
        >
          <FiArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back</span>
        </button>
      </div>

      {/* Loading/Redirect Message */}
      <div className="text-center p-8">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Opening PDF...</h2>
        <p className="text-gray-600 mb-4">Redirecting to mobile-optimized view</p>
        <button
          onClick={() => {
            window.open(pdfUrl, '_blank');
            router.push("/dashboard/resources");
          }}
          className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium"
        >
          Open PDF Manually
        </button>
      </div>
    </div>
  );
}