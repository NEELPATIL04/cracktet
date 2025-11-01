"use client";

import { useRouter } from "next/navigation";
import { FiArrowLeft, FiMonitor, FiSmartphone } from "react-icons/fi";

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

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4 z-50">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.push("/dashboard/resources")}
              className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg transition-all"
              title="Back to Resources"
            >
              <FiArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back</span>
            </button>
            <FiSmartphone className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold mb-2">Mobile PDF Viewer</h1>
          <p className="text-blue-100 text-sm">{resourceTitle}</p>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiMonitor className="w-8 h-8 text-orange-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Mobile PDF Viewing
            </h2>
            <h3 className="text-lg text-orange-600 font-medium mb-3">
              Coming Soon!
            </h3>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-gray-700 text-sm leading-relaxed">
              PDF viewing on mobile devices is currently under development. 
              For the best experience and full functionality, please use a desktop computer or laptop.
            </p>
          </div>

          {/* User Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800 text-xs text-center">
              📋 <strong>Document:</strong> {resourceTitle}<br/>
              👤 <strong>User:</strong> {userName}<br/>
              📧 <strong>Email:</strong> {userEmail}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => router.push("/dashboard/resources")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <FiArrowLeft className="w-4 h-4" />
              <span>Back to Resources</span>
            </button>
            
            <div className="text-center">
              <p className="text-gray-500 text-xs">
                💡 Try accessing from a desktop for immediate viewing
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}