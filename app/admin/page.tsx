"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaUsers, FaSpinner, FaSignOutAlt } from "react-icons/fa";

interface User {
  id: number;
  name: string;
  district: string;
  mobile: string;
  createdAt: string;
}

export default function Admin() {
  const { t } = useLanguage();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/admin/verify");
      if (response.ok) {
        setIsAuthenticated(true);
        fetchUsers();
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

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch users");
      }

      setUsers(data.users);
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("Failed to load users. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      router.push("/admin/login");
    } catch (error) {
      console.error("Logout error:", error);
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

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen w-full overflow-x-hidden bg-secondary-gray flex items-center justify-center">
        <FaSpinner className="text-5xl text-primary animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-secondary-gray py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Header with Logout */}
        <div className="flex justify-between items-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center flex-1"
          >
            <div className="flex items-center justify-center space-x-3 mb-4">
              <FaUsers className="text-5xl text-primary" />
              <h1 className="text-4xl font-bold text-gray-900">
                {t.admin.title}
              </h1>
            </div>
            <p className="text-xl text-gray-600">{t.admin.subtitle}</p>
          </motion.div>

          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-lg"
          >
            <FaSignOutAlt />
            <span>Logout</span>
          </motion.button>
        </div>

        {isLoading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <FaSpinner className="text-5xl text-primary animate-spin mx-auto mb-4" />
            <p className="text-gray-600 text-lg">{t.admin.loading}</p>
          </motion.div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-50 border border-red-200 rounded-lg p-6 text-center"
          >
            <p className="text-red-600">{error}</p>
          </motion.div>
        ) : users.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-lg shadow-lg p-12 text-center"
          >
            <FaUsers className="text-6xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">{t.admin.noUsers}</p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-lg shadow-lg overflow-hidden"
          >
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-primary to-primary-dark text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      {t.admin.table.id}
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      {t.admin.table.name}
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      {t.admin.table.district}
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      {t.admin.table.mobile}
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      {t.admin.table.registeredAt}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user, index) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="hover:bg-secondary-gray transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {user.id}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {user.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {user.district}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {user.mobile}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {formatDate(user.createdAt)}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-200">
              {users.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="p-6 hover:bg-secondary-gray transition-colors"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-lg text-gray-900">
                      {user.name}
                    </h3>
                    <span className="bg-primary text-white px-3 py-1 rounded-full text-xs font-semibold">
                      ID: {user.id}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        {t.admin.table.district}:
                      </span>
                      <span className="text-gray-900 font-medium">
                        {user.district}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        {t.admin.table.mobile}:
                      </span>
                      <span className="text-gray-900 font-medium">
                        {user.mobile}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        {t.admin.table.registeredAt}:
                      </span>
                      <span className="text-gray-900 font-medium">
                        {formatDate(user.createdAt)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Summary */}
            <div className="bg-secondary-gray px-6 py-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 text-center">
                Total Registered Users: <span className="font-semibold text-primary">{users.length}</span>
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </main>
  );
}
