"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: number;
  has_icon?: boolean;
  icon_mime_type?: string;
  name: string;
  birthday: string;
  dateOfDeath: string;
  gender: string;
  address: string;
  intro: string;
  icon_file?: File | null; // Add this to track the current icon file
}

export default function AdminSettings() {
  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [editedUser, setEditedUser] = useState<User | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [iconPreview, setIconPreview] = useState<string>("");

  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      setUserId(searchParams.get("user"));
    }
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) {
        setError("User ID is required");
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch(`/api/admin/users?user=${parseInt(userId)}`);
        if (!res.ok) throw new Error("Failed to fetch user");
        const data = await res.json();

        console.log("Fetched user data:", data);

        // Handle different possible response structures
        let userData;
        if (
          data.user &&
          Array.isArray(data.user) &&
          data.user[0] &&
          Array.isArray(data.user[0]) &&
          data.user[0][0]
        ) {
          userData = data.user[0][0];
        } else if (data.user && Array.isArray(data.user) && data.user[0]) {
          userData = data.user[0];
        } else if (data.user) {
          userData = data.user;
        } else {
          throw new Error("Invalid user data structure");
        }

        // Format dates for input fields
        if (userData.birthday) {
          userData.birthday = userData.birthday.split("T")[0];
        }
        if (userData.dateOfDeath) {
          userData.dateOfDeath = userData.dateOfDeath.split("T")[0];
        }

        // Initialize icon_file as null
        userData.icon_file = null;

        setUser(userData);
        setEditedUser({ ...userData });

        // Set initial icon preview if user has an icon
        if (userData.has_icon) {
          setIconPreview(getUserIconUrl(parseInt(userId), true));
        }
      } catch (err: any) {
        setError(err.message || "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) fetchUser();
  }, [userId]);

  const getUserIconUrl = (userId: number, hasIcon: boolean) => {
    return hasIcon
      ? `/api/admin/users/icon?userId=${userId}`
      : "/placeholder-icon.jpg";
  };

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editedUser) {
      // Update editedUser with the new icon file
      setEditedUser({ ...editedUser, icon_file: file, has_icon: true });

      // Create preview
      const reader = new FileReader();
      reader.onload = () => setIconPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveIcon = () => {
    if (editedUser) {
      // Set icon_file to null and has_icon to false
      setEditedUser({ ...editedUser, icon_file: null, has_icon: false });
      setIconPreview("/placeholder-icon.jpg");
    }
  };

  const handleInputChange = (field: keyof User, value: string) => {
    if (editedUser) {
      setEditedUser({ ...editedUser, [field]: value });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editedUser || !userId) return;

    setIsSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const formData = new FormData();
      formData.append("userId", userId);
      formData.append("name", editedUser.name);
      formData.append("birthday", editedUser.birthday);
      formData.append("dateOfDeath", editedUser.dateOfDeath);
      formData.append("gender", editedUser.gender);
      formData.append("address", editedUser.address);
      formData.append("intro", editedUser.intro);

      // Simple icon handling - just send whatever is in editedUser
      if (editedUser.icon_file) {
        formData.append("icon", editedUser.icon_file);
      } else if (!editedUser.has_icon) {
        // If has_icon is false, we want to remove the icon
        formData.append("removeIcon", "true");
      }

      const res = await fetch("/api/admin/users", {
        method: "PUT",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to update user");

      const data = await res.json();

      // Update the user state with the new data
      const updatedUser = {
        ...editedUser,
        has_icon: data.user.has_icon,
        icon_file: null, // Clear the file after successful upload
      };

      setUser(updatedUser);
      setEditedUser(updatedUser);

      // Update icon preview if icon was uploaded/removed
      if (data.user.has_icon) {
        setIconPreview(getUserIconUrl(parseInt(userId), true));
      } else {
        setIconPreview("/placeholder-icon.jpg");
      }

      setSuccessMessage("Profile updated successfully!");

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setEditedUser({ ...user, icon_file: null });
      setIconPreview(
        user.has_icon
          ? getUserIconUrl(parseInt(userId || "0"), true)
          : "/placeholder-icon.jpg"
      );
      setError("");
      setSuccessMessage("");
    }
  };

  const handleBackToDashboard = () => {
    router.push(`/admin/dashboard${userId ? `?user=${userId}` : ""}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading user data...</p>
        </div>
      </div>
    );
  }

  if (!user || !editedUser) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-md">
          <p className="text-red-500 mb-4">{error || "User not found"}</p>
          <button
            onClick={() => router.push("/")}
            className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Edit Profile</h1>
            <button
              onClick={handleBackToDashboard}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Dashboard
            </button>
          </div>

          {/* Profile Icon Section */}
          <div className="text-center mb-6">
            <div className="relative inline-block">
              <img
                src={iconPreview || "/placeholder-icon.jpg"}
                alt="Profile Icon"
                className="w-24 h-24 rounded-full border-4 border-white shadow-md object-cover"
              />
              <label className="absolute bottom-0 right-0 bg-yellow-500 text-white rounded-full w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-yellow-600 transition-colors">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleIconUpload}
                  className="hidden"
                />
              </label>
            </div>
            <div className="mt-2 space-x-2">
              <label className="inline-flex items-center px-3 py-1 bg-yellow-500 text-white text-sm rounded cursor-pointer hover:bg-yellow-600 transition-colors">
                📷 Change Photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleIconUpload}
                  className="hidden"
                />
              </label>
              {editedUser.has_icon && (
                <button
                  type="button"
                  onClick={handleRemoveIcon}
                  className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
                >
                  🗑️ Remove
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Settings Form */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          {/* Success/Error Messages */}
          {successMessage && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              {successMessage}
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={editedUser.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                placeholder="Enter full name"
                required
              />
            </div>

            {/* Birthday */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Birthday *
              </label>
              <input
                type="date"
                value={editedUser.birthday}
                onChange={(e) => handleInputChange("birthday", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                required
              />
            </div>

            {/* Date of Death */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of Death
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={editedUser.dateOfDeath || ""}
                  onChange={(e) =>
                    handleInputChange(
                      "dateOfDeath",
                      e.target.value === "" ? "" : e.target.value
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                />
                {editedUser.dateOfDeath && (
                  <button
                    type="button"
                    onClick={() => handleInputChange("dateOfDeath", "")}
                    className="ml-2 px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors text-xs"
                  >
                    Clear
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Leave empty if still living
              </p>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender
              </label>
              <select
                value={editedUser.gender}
                onChange={(e) => handleInputChange("gender", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Non-binary">Non-binary</option>
                <option value="Prefer not to say">Prefer not to say</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <textarea
                value={editedUser.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                placeholder="Enter address"
              />
            </div>

            {/* Introduction */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Introduction / Bio
              </label>
              <textarea
                value={editedUser.intro}
                onChange={(e) => handleInputChange("intro", e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                placeholder="Write a brief introduction or biography"
              />
              <p className="text-xs text-gray-500 mt-1">
                This will be displayed on your profile
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 pt-6 border-t">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSaving}
              >
                {isSaving ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </div>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
