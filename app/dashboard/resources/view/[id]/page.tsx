"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { FiArrowLeft } from "react-icons/fi";
import ProtectedPDFViewer from "@/components/ProtectedPDFViewer";

interface Resource {
  uuid: string;
  title: string;
  description: string;
  pageCount: number;
}

interface UserData {
  id: number;
  name: string;
  email: string;
  mobile: string;
}

export default function ViewResourcePage() {
  const params = useParams();
  const router = useRouter();
  const [resource, setResource] = useState<Resource | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchResource = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/resources/${id}`);

      if (response.status === 401) {
        console.log("❌ Unauthorized - redirecting to login");
        router.push("/login");
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to load resource");
      }

      const data = await response.json();
      console.log("✅ Resource loaded:", data.resource?.title);
      console.log("✅ User data received:", data.user?.email);

      setResource(data.resource);
      setUserData(data.user); // Set user data from API response

      // ✅ Log resource access
      await fetch("/api/resources/log-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resourceId: parseInt(id) }),
      }).catch(() => {});

    } catch (err) {
      console.error("❌ Error fetching resource:", err);
      setError(err instanceof Error ? err.message : "Failed to load resource");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    // ✅ Fetch resource directly - API will verify session via httpOnly cookie
    if (params.id) {
      fetchResource(params.id as string);
    }
  }, [params.id, fetchResource]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-900 text-lg font-semibold">Loading resource...</p>
          <p className="text-gray-600 text-sm mt-2">Please wait...</p>
        </div>
      </div>
    );
  }

  if (error || !resource || !userData) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center max-w-md px-6">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-3xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 mb-6">
            {error || "Resource not found or you don't have permission to view it"}
          </p>
          <div className="flex space-x-4 justify-center">
            <button
              onClick={() => router.back()}
              className="px-6 py-3 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              <FiArrowLeft className="inline mr-2" />
              Go Back
            </button>
            <button
              onClick={() => router.push("/dashboard/resources")}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium"
            >
              View All Resources
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProtectedPDFViewer
      pdfUrl={`/api/resources/${resource.uuid}/stream`}
      resourceTitle={resource.title}
      userName={userData.name}
      userEmail={userData.email}
      userMobile={userData.mobile}
      pageCount={resource.pageCount}
    />
  );
}
