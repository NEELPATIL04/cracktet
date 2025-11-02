"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaSpinner, FaExclamationTriangle, FaCheckCircle } from "react-icons/fa";
import AdminLayout from "../components/AdminLayout";

interface Violation {
  id: number;
  type: string;
  userEmail: string;
  userName: string;
  resourceTitle: string;
  violationNumber: number;
  timestamp: string;
  notified: boolean;
  createdAt: string;
}

export default function AdminNotifications() {
  const { t } = useLanguage();
  const router = useRouter();
  const [violations, setViolations] = useState<Violation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "unnotified" | "critical">("all");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/admin/verify");
      if (response.ok) {
        setIsAuthenticated(true);
        fetchViolations();
      } else {
        router.push("/admin/login");
      }
    } catch (error) {
      console.error("Auth check error:", error);
      router.push("/admin/login");
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const fetchViolations = async () => {
    try {
      const response = await fetch("/api/admin/violations");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch violations");
      }

      setViolations(data.violations);
    } catch (error) {
      console.error("Error fetching violations:", error);
      setError("Failed to load violations. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkNotified = async (violationId: number) => {
    try {
      const response = await fetch("/api/admin/violations/mark-notified", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ violationId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to mark as notified");
      }

      // Update local state
      setViolations((prevViolations) =>
        prevViolations.map((v) =>
          v.id === violationId ? { ...v, notified: true } : v
        )
      );
    } catch (error) {
      console.error("Mark notified error:", error);
      alert("Failed to mark as notified. Please try again.");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredViolations = violations.filter((v) => {
    if (filter === "all") return true;
    if (filter === "unnotified") return !v.notified;
    if (filter === "critical") return v.violationNumber >= 3;
    return true;
  });

  if (isCheckingAuth) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-primary mb-2">
          {t.adminNotifications.title}
        </h1>
        <p className="text-gray-600">{t.adminNotifications.subtitle}</p>
      </div>

      {/* Filter Buttons */}
      <div className="mb-6 flex flex-wrap gap-3">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === "all"
              ? "bg-primary text-white"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          {t.adminNotifications.filter.all}
        </button>
        <button
          onClick={() => setFilter("unnotified")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === "unnotified"
              ? "bg-primary text-white"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          {t.adminNotifications.filter.unnotified}
          {violations.filter((v) => !v.notified).length > 0 && (
            <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
              {violations.filter((v) => !v.notified).length}
            </span>
          )}
        </button>
        <button
          onClick={() => setFilter("critical")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === "critical"
              ? "bg-primary text-white"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          {t.adminNotifications.filter.critical}
          {violations.filter((v) => v.violationNumber >= 3).length > 0 && (
            <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
              {violations.filter((v) => v.violationNumber >= 3).length}
            </span>
          )}
        </button>
      </div>

      {isLoading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <FaSpinner className="text-5xl text-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">{t.adminNotifications.loading}</p>
        </motion.div>
      ) : error ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-red-50 border border-red-200 rounded-lg p-6 text-center"
        >
          <p className="text-red-600">{error}</p>
        </motion.div>
      ) : filteredViolations.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-lg shadow-lg p-12 text-center"
        >
          <FaCheckCircle className="text-6xl text-green-500 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">{t.adminNotifications.noViolations}</p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-xl shadow-md overflow-hidden"
        >
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-primary text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    {t.adminNotifications.table.id}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    {t.adminNotifications.table.user}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    {t.adminNotifications.table.email}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    {t.adminNotifications.table.resource}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    {t.adminNotifications.table.type}
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold">
                    {t.adminNotifications.table.violationNumber}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    {t.adminNotifications.table.timestamp}
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold">
                    {t.adminNotifications.table.notified}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredViolations.map((violation, index) => (
                  <motion.tr
                    key={violation.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className={`hover:bg-gray-50 transition-colors ${
                      violation.violationNumber >= 3 ? "bg-red-50" : ""
                    }`}
                  >
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {violation.id}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {violation.userName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {violation.userEmail}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {violation.resourceTitle}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        {violation.type.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                          violation.violationNumber >= 3
                            ? "bg-red-600 text-white"
                            : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        {violation.violationNumber >= 3 && (
                          <FaExclamationTriangle className="mr-1" />
                        )}
                        {violation.violationNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {formatDate(violation.timestamp)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {violation.notified ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <FaCheckCircle className="mr-1" />
                          Notified
                        </span>
                      ) : (
                        <button
                          onClick={() => handleMarkNotified(violation.id)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors"
                        >
                          {t.adminNotifications.markNotified}
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-200">
            {filteredViolations.map((violation, index) => (
              <motion.div
                key={violation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`p-6 hover:bg-gray-50 transition-colors ${
                  violation.violationNumber >= 3 ? "bg-red-50" : ""
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-lg text-gray-900">
                    {violation.userName}
                  </h3>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                      violation.violationNumber >= 3
                        ? "bg-red-600 text-white"
                        : "bg-orange-100 text-orange-800"
                    }`}
                  >
                    {violation.violationNumber >= 3 && (
                      <FaExclamationTriangle className="mr-1" />
                    )}
                    Strike {violation.violationNumber}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {t.adminNotifications.table.email}:
                    </span>
                    <span className="text-gray-900 font-medium">
                      {violation.userEmail}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {t.adminNotifications.table.resource}:
                    </span>
                    <span className="text-gray-900 font-medium">
                      {violation.resourceTitle}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {t.adminNotifications.table.type}:
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      {violation.type.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {t.adminNotifications.table.timestamp}:
                    </span>
                    <span className="text-gray-900 font-medium">
                      {formatDate(violation.timestamp)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">
                      {t.adminNotifications.table.notified}:
                    </span>
                    {violation.notified ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <FaCheckCircle className="mr-1" />
                        Notified
                      </span>
                    ) : (
                      <button
                        onClick={() => handleMarkNotified(violation.id)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors"
                      >
                        {t.adminNotifications.markNotified}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Summary */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex flex-wrap justify-between items-center gap-4 text-sm text-gray-600">
              <p>
                Total Violations:{" "}
                <span className="font-semibold text-primary">
                  {filteredViolations.length}
                </span>
              </p>
              <p>
                Critical (3+ strikes):{" "}
                <span className="font-semibold text-red-600">
                  {violations.filter((v) => v.violationNumber >= 3).length}
                </span>
              </p>
              <p>
                Unnotified:{" "}
                <span className="font-semibold text-orange-600">
                  {violations.filter((v) => !v.notified).length}
                </span>
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AdminLayout>
  );
}
