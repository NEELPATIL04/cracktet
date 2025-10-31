"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaUsers, FaSpinner, FaTrash, FaRupeeSign, FaUserPlus } from "react-icons/fa";
import AdminLayout from "./components/AdminLayout";

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
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    district: "",
    address: "",
  });
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [addUserSuccess, setAddUserSuccess] = useState("");

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

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingUser(true);
    setAddUserSuccess("");
    setError("");

    try {
      const response = await fetch("/api/admin/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUserData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create user");
      }

      setAddUserSuccess("User created successfully!");
      setNewUserData({
        name: "",
        email: "",
        mobile: "",
        password: "",
        district: "",
        address: "",
      });

      // Refresh users list
      fetchUsers();

      // Close modal after 2 seconds
      setTimeout(() => {
        setShowAddUserModal(false);
        setAddUserSuccess("");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setIsAddingUser(false);
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
      {/* Add User Modal */}
      {showAddUserModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowAddUserModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-primary flex items-center">
                <FaUserPlus className="mr-3" /> Add New User
              </h3>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {addUserSuccess && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-600">{addUserSuccess}</p>
              </div>
            )}

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newUserData.name}
                    onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                    placeholder="Enter full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={newUserData.email}
                    onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                    placeholder="Enter email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    pattern="[0-9]{10}"
                    value={newUserData.mobile}
                    onChange={(e) => setNewUserData({ ...newUserData, mobile: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                    placeholder="10-digit mobile number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newUserData.password}
                    onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                    placeholder="Minimum 6 characters"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    District *
                  </label>
                  <input
                    type="text"
                    required
                    value={newUserData.district}
                    onChange={(e) => setNewUserData({ ...newUserData, district: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                    placeholder="Enter district"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={newUserData.address}
                    onChange={(e) => setNewUserData({ ...newUserData, address: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                    placeholder="Enter address"
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  type="submit"
                  disabled={isAddingUser}
                  className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  {isAddingUser ? (
                    <span className="flex items-center justify-center">
                      <FaSpinner className="animate-spin mr-2" />
                      Creating...
                    </span>
                  ) : (
                    "Create User"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>

            <p className="text-xs text-gray-500 mt-4">
              * User will be created with active status and completed payment status (no payment required).
            </p>
          </motion.div>
        </motion.div>
      )}

      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">
            {t.admin.title}
          </h1>
          <p className="text-gray-600">{t.admin.subtitle}</p>
        </div>
        <button
          onClick={() => setShowAddUserModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          <FaUserPlus />
          <span>Add User</span>
        </button>
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
          className="bg-white rounded-xl shadow-md overflow-hidden"
        >
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-primary text-white">
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
                    className="hover:bg-gray-50 transition-colors"
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
                        user.paymentStatus === 'admin_added' ? 'bg-blue-100 text-blue-800' :
                        user.paymentStatus === 'failed' ? 'bg-red-100 text-red-800' :
                        user.paymentStatus === 'initiated' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {(user.paymentStatus === 'completed' || user.paymentStatus === 'admin_added') && <FaRupeeSign className="mr-1" />}
                        {user.paymentStatus === 'admin_added' ? 'Admin Added' : (user.paymentStatus || 'pending')}
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
                        className="inline-flex items-center px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="p-6 hover:bg-gray-50 transition-colors"
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
                      user.paymentStatus === 'admin_added' ? 'bg-blue-100 text-blue-800' :
                      user.paymentStatus === 'failed' ? 'bg-red-100 text-red-800' :
                      user.paymentStatus === 'initiated' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {(user.paymentStatus === 'completed' || user.paymentStatus === 'admin_added') && <FaRupeeSign className="mr-1" />}
                      {user.paymentStatus === 'admin_added' ? 'Admin Added' : (user.paymentStatus || 'pending')}
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
                  className="mt-4 w-full inline-flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              Total Registered Users: <span className="font-semibold text-primary">{users.length}</span>
            </p>
          </div>
        </motion.div>
      )}
    </AdminLayout>
  );
}
