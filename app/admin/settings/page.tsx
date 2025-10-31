"use client";

import { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import { FiDollarSign, FiSave } from "react-icons/fi";

export default function AdminSettingsPage() {
  const [registrationFee, setRegistrationFee] = useState(2500);
  const [newFee, setNewFee] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

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
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const fee = parseFloat(newFee);
    if (isNaN(fee) || fee <= 0) {
      setMessage("Please enter a valid fee amount");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationFee: fee }),
      });

      if (response.ok) {
        setRegistrationFee(fee);
        setMessage("Settings saved successfully!");
        setTimeout(() => setMessage(""), 3000);
      } else {
        throw new Error("Failed to save settings");
      }
    } catch (error) {
      setMessage("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-3xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Settings
          </h1>
          <p className="text-gray-600">
            Manage application settings and configuration
          </p>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.includes("success")
                ? "bg-green-50 border border-green-200 text-green-600"
                : "bg-red-50 border border-red-200 text-red-600"
            }`}
          >
            <p className="text-sm">{message}</p>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="space-y-6">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 bg-secondary-gray rounded-lg">
                  <FiDollarSign className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Registration Fee
                  </h3>
                  <p className="text-sm text-gray-600">
                    Set the registration fee for new users
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Fee
                  </label>
                  <div className="px-4 py-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">
                      ₹{registrationFee}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Fee Amount (₹)
                  </label>
                  <div className="flex space-x-3">
                    <input
                      type="number"
                      value={newFee}
                      onChange={(e) => setNewFee(e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary bg-white text-gray-900"
                      placeholder="Enter new fee"
                      min="0"
                      step="0.01"
                    />
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center space-x-2 px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FiSave className="w-5 h-5" />
                      <span>{saving ? "Saving..." : "Save"}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-yellow-900 mb-2">
                  Important Notes:
                </h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Fee changes will affect new registrations only</li>
                  <li>• Existing users' payments will not be affected</li>
                  <li>• Users added directly by admin bypass this fee</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
