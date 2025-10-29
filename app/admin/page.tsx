"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaUsers, FaSpinner, FaSignOutAlt, FaTrash, FaCog, FaRupeeSign } from "react-icons/fa";

interface User {
  id: number;
  name: string;
  email: string;
  district: string;
  address: string;
  mobile: string;
  createdAt: string;
  paymentStatus: string;
  paymentAmount: string | null;
  paymentCompletedAt: string | null;
}

export default function Admin() {
  const { t } = useLanguage();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [error, setError] = useState("");
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [registrationFee, setRegistrationFee] = useState(2500);
  const [newFee, setNewFee] = useState("");
  const [isUpdatingFee, setIsUpdatingFee] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSettings();
    }
  }, [isAuthenticated]);

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

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings");
      if (response.ok) {
        const data = await response.json();
        setRegistrationFee(data.registrationFee);
        setNewFee(data.registrationFee.toString());
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const handleUpdateFee = async () => {
    const fee = parseFloat(newFee);
    if (isNaN(fee) || fee <= 0) {
      alert("Please enter a valid fee amount");
      return;
    }

    setIsUpdatingFee(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationFee: fee }),
      });

      if (response.ok) {
        setRegistrationFee(fee);
        alert("Registration fee updated successfully!");
        setShowSettings(false);
      } else {
        throw new Error("Failed to update fee");
      }
    } catch (error) {
      console.error("Error updating fee:", error);
      alert("Failed to update registration fee");
    } finally {
      setIsUpdatingFee(false);
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

  const handleDeleteUser = async (userId: number) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return;
    }

    setDeletingUserId(userId);
    try {
      const response = await fetch("/api/users/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete user");
      }

      // Remove user from the list
      setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
      alert("User deleted successfully!");
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete user. Please try again.");
    } finally {
      setDeletingUserId(null);
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
        {/* Settings Modal */}
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-lg p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <FaCog className="mr-2" /> Admin Settings
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Registration Fee (₹)
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      value={newFee}
                      onChange={(e) => setNewFee(e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                      placeholder="Enter fee amount"
                    />
                    <button
                      onClick={handleUpdateFee}
                      disabled={isUpdatingFee}
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
                    >
                      {isUpdatingFee ? <FaSpinner className="animate-spin" /> : "Update"}
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Current fee: ₹{registrationFee}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="mt-6 w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}

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

          <div className="flex space-x-3">
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSettings(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-lg"
            >
              <FaCog />
              <span>Settings</span>
            </motion.button>
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
                      {t.admin.table.email}
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      {t.admin.table.district}
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      {t.admin.table.address}
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      {t.admin.table.mobile}
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Payment Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      {t.admin.table.registeredAt}
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold">
                      Actions
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
                      className="transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {user.id}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {user.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {user.district}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {user.address}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {user.mobile}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.paymentStatus === 'completed' ? 'bg-green-100 text-green-800' :
                          user.paymentStatus === 'failed' ? 'bg-red-100 text-red-800' :
                          user.paymentStatus === 'initiated' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {user.paymentStatus === 'completed' && <FaRupeeSign className="mr-1" />}
                          {user.paymentStatus || 'pending'}
                          {user.paymentAmount && user.paymentStatus === 'completed' && ` (₹${user.paymentAmount})`}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={deletingUserId === user.id}
                          className="inline-flex items-center px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deletingUserId === user.id ? (
                            <FaSpinner className="animate-spin" />
                          ) : (
                            <>
                              <FaTrash className="mr-2" />
                              Delete
                            </>
                          )}
                        </button>
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
                        {t.admin.table.email}:
                      </span>
                      <span className="text-gray-900 font-medium">
                        {user.email}
                      </span>
                    </div>
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
                        {t.admin.table.address}:
                      </span>
                      <span className="text-gray-900 font-medium">
                        {user.address}
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
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">
                        Payment:
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.paymentStatus === 'completed' ? 'bg-green-100 text-green-800' :
                        user.paymentStatus === 'failed' ? 'bg-red-100 text-red-800' :
                        user.paymentStatus === 'initiated' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.paymentStatus === 'completed' && <FaRupeeSign className="mr-1" />}
                        {user.paymentStatus || 'pending'}
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
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    disabled={deletingUserId === user.id}
                    className="mt-4 w-full inline-flex items-center justify-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deletingUserId === user.id ? (
                      <FaSpinner className="animate-spin" />
                    ) : (
                      <>
                        <FaTrash className="mr-2" />
                        Delete User
                      </>
                    )}
                  </button>
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
