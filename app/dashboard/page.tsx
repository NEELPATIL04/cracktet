"use client";

import { useEffect, useState } from "react";
import { FiFile, FiCheckCircle, FiClock } from "react-icons/fi";

interface DashboardStats {
  totalResources: number;
  accessedResources: number;
  accountStatus: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalResources: 0,
    accessedResources: 0,
    accountStatus: "active",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch dashboard stats
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // TODO: Implement API to fetch stats
      setStats({
        totalResources: 12,
        accessedResources: 8,
        accountStatus: "active",
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome to your learning dashboard
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <FiFile className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {stats.totalResources}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Total Resources
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <FiCheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {stats.accessedResources}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Resources Accessed
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <FiClock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1 capitalize">
            {stats.accountStatus}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Account Status
          </p>
        </div>
      </div>

      {/* Welcome Message */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-8 text-white">
        <h2 className="text-2xl font-bold mb-4">Welcome to CrackTET!</h2>
        <p className="text-blue-100 mb-6">
          Access all your study materials, practice tests, and resources in one place.
          Start your preparation journey today!
        </p>
        <button
          onClick={() => (window.location.href = "/dashboard/resources")}
          className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
        >
          Browse Resources
        </button>
      </div>
    </div>
  );
}
