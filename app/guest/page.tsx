"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Post {
  id: number;
  title: string;
  paragraph: string;
  time: string;
  likes: number;
  has_image?: boolean;
  image_mime_type?: string;
  category?: string | null; // Make it explicitly nullable
}

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
  has_background?: boolean; // Add this field
  background_mime_type?: string; // Add this field
}

interface Comment {
  id: number;
  post_id: number;
  content: string;
}

export default function GuestView() {
  // Renamed AdminDashboard to GuestView
  const [userId, setUserId] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [error, setError] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Removed states related to post creation/editing/deletion
  // const [isEditMode, setIsEditMode] = useState(false);
  // const [editedPost, setEditedPost] = useState<Post | null>(null);
  // const [isUpdatingPost, setIsUpdatingPost] = useState(false);
  // const [isDeletingPost, setIsDeletingPost] = useState(false);
  // const [newPostImage, setNewPostImage] = useState<File | null>(null);
  // const [newPostImagePreview, setNewPostImagePreview] = useState<string>("");
  // const [editedPostImage, setEditedPostImage] = useState<File | null>(null);
  // const [editedPostImagePreview, setEditedPostImagePreview] = useState<string>("");
  // const [isUploadingBackground, setIsUploadingBackground] = useState(false);
  // const [backgroundUploadInput, setBackgroundUploadInput] = useState<HTMLInputElement | null>(null);
  // const [isAddPostModalOpen, setIsAddPostModalOpen] = useState(false);
  // const [newPost, setNewPost] = useState({ title: "", paragraph: "", category: "" });
  // const [isCreatingPost, setIsCreatingPost] = useState(false);

  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      setUserId(searchParams.get("user"));
    }
  }, []);

  useEffect(() => {
    const fetchPosts = async () => {
      if (!userId) {
        setError("User ID is required");
        return;
      }

      try {
        const res = await fetch(`/api/admin/posts?user=${parseInt(userId)}`);
        if (!res.ok) throw new Error("Failed to fetch posts");
        const data = await res.json();
        setPosts(data.posts);
      } catch (err: any) {
        setError(err.message || "Unknown error");
      }
    };

    if (userId) fetchPosts();
  }, [userId]);

  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) {
        setError("User ID is required");
        return;
      }

      try {
        const res = await fetch(`/api/admin/users?user=${parseInt(userId)}`);
        if (!res.ok) throw new Error("Failed to fetch user");
        const data = await res.json();
        console.log("Fetched user data:", data.user);
        const user = data.user;
        if (user.birthday) {
          user.birthday = user.birthday.split("T")[0];
        }
        if (user.dateOfDeath) {
          user.dateOfDeath = user.dateOfDeath.split("T")[0];
        }
        setUser(user);
      } catch (err: any) {
        setError(err.message || "Unknown error");
      }
    };

    if (userId) fetchUser();
  }, [userId]);

  const getImageUrl = (postId: number, hasImage: boolean) => {
    return hasImage
      ? `/api/admin/posts/images?postId=${postId}`
      : "/placeholder-icon.jpg";
  };

  const getUserIconUrl = (userId: number, hasIcon: boolean) => {
    return hasIcon
      ? `/api/admin/users/icon?userId=${userId}`
      : "/placeholder-icon.jpg";
  };

  const getUserBackgroundUrl = (userId: number, hasBackground: boolean) => {
    return hasBackground
      ? `/api/admin/users/background?userId=${userId}`
      : null;
  };

  // Removed handleBackgroundUpload and related states/functions
  // const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { /* ... */ };
  // const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => { /* ... */ };
  // const removeImage = (isEdit = false) => { /* ... */ };
  // const handleCreatePost = async (e: React.FormEvent) => { /* ... */ };
  // const handleEditPost = () => { /* ... */ };
  // const handleCancelEdit = () => { /* ... */ };
  // const handleSaveEdit = async () => { /* ... */ };
  // const handleDeletePost = async () => { /* ... */ };

  const fetchComments = async (postId: number) => {
    setIsLoadingComments(true);
    try {
      const res = await fetch(`/api/admin/posts/comments?postId=${postId}`);
      if (!res.ok) throw new Error("Failed to fetch comments");
      const data = await res.json();
      setComments(data.comments);
    } catch (err: any) {
      console.error("Error fetching comments:", err);
      setComments([]);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPost || !newComment.trim()) return;

    setIsSubmittingComment(true);
    try {
      const res = await fetch("/api/admin/posts/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId: selectedPost.id,
          content: newComment.trim(),
        }),
      });

      if (!res.ok) throw new Error("Failed to submit comment");

      const data = await res.json();
      setComments((prev) => [data.comment, ...prev]);
      setNewComment("");
    } catch (err: any) {
      console.error("Error submitting comment:", err);
      alert("Failed to submit comment. Please try again.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handlePostClick = (post: Post) => {
    setSelectedPost(post);
    setIsModalOpen(true);
    fetchComments(post.id);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPost(null);
    setComments([]);
    setNewComment("");
    // Removed edit mode related state resets
    // setIsEditMode(false);
    // setEditedPost(null);
    // setEditedPostImage(null);
    // setEditedPostImagePreview("");
  };

  // Removed closeAddPostModal and related states/functions
  // const closeAddPostModal = () => { /* ... */ };

  const handleLogout = () => {
    router.push("/");
  };

  const tabs = ["Timeline", "Bio", "Media", "Family Tree"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-blue-50 p-4">
      {/* Profile Header */}
      <div
        className="max-w-2xl mx-auto p-6 rounded-xl shadow-lg text-center relative overflow-hidden"
        style={
          user?.has_background
            ? {
                backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.9)), url(${getUserBackgroundUrl(
                  user.id,
                  user.has_background
                )})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
              }
            : { background: "white" }
        }
      >
        {/* Background Upload Button - Removed */}
        {/* <div className="absolute top-4 right-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleBackgroundUpload}
            className="hidden"
            ref={(input) => setBackgroundUploadInput(input)}
            id="background-upload"
            disabled={isUploadingBackground}
          />
          <label
            htmlFor="background-upload"
            className={`cursor-pointer bg-white/80 hover:bg-white/90 p-2 rounded-full shadow-md transition-all duration-200 flex items-center justify-center ${
              isUploadingBackground
                ? "opacity-50 cursor-not-allowed"
                : "hover:scale-105"
            }`}
            title="Upload background image"
          >
            {isUploadingBackground ? (
              <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5 text-gray-600"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                />
              </svg>
            )}
          </label>
        </div> */}

        <img
          src={
            user?.has_icon
              ? getUserIconUrl(user.id, user.has_icon)
              : "/placeholder-icon.jpg"
          }
          alt={user?.name ? `${user.name}'s User Icon` : "User Icon"}
          className="w-32 h-32 rounded-full mx-auto border-4 border-blue-200 shadow-md object-cover transition-transform duration-300 hover:scale-105 hover:shadow-xl ring-2 ring-blue-100 ring-offset-2"
        />

        <h1 className="text-3xl font-extrabold mt-5 text-gray-800 tracking-tight">
          {user?.name}
        </h1>
        <p className="text-gray-600 text-lg mt-1 font-medium">
          {user?.birthday} &mdash;{" "}
          {user?.dateOfDeath ? user.dateOfDeath : "Present"}
        </p>
        <p className="italic text-sm text-gray-500 mt-2">
          {user?.gender} &bull; {user?.address}
        </p>

        {/* Action Buttons - "Settings" button removed */}
        <div className="flex justify-center gap-4 mt-4">
          <a
            className="border px-4 py-2 rounded-full text-sm text-yellow-700 border-yellow-500 hover:bg-yellow-200 hover:border-yellow-600 shadow-md transition-all duration-200 ease-in-out transform hover:scale-105 flex items-center justify-center"
            href="/near-me"
            target="_blank"
            rel="noopener noreferrer"
          >
            👥 Other Profiles
          </a>
          <button
            className="border px-4 py-2 rounded-full text-sm text-yellow-700 border-yellow-500 hover:bg-yellow-200 hover:border-yellow-600 shadow-md transition-all duration-200 ease-in-out transform hover:scale-105"
            onClick={() => {
              if (user?.id) {
                const url = `https://itombs.vercel.app/guest?user=${user.id}`; // Changed to /guest
                navigator.clipboard.writeText(url).then(() => {
                  alert("Share link copied to clipboard!");
                });
              }
            }}
          >
            🔄 Share
          </button>
          {/* <button
            className="border px-4 py-2 rounded-full text-sm text-yellow-700 border-yellow-500 hover:bg-yellow-200 hover:border-yellow-600 shadow-md transition-all duration-200 ease-in-out transform hover:scale-105"
            onClick={() =>
              router.push("/admin/settings" + (userId ? `?user=${userId}` : ""))
            }
          >
            📝 Settings
          </button> */}
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-2xl mx-auto mt-8">
        <div className="flex justify-center gap-2 bg-gradient-to-r from-yellow-100 via-white to-blue-100 rounded-xl shadow-lg p-2 mb-6">
          {tabs.map((tab, idx) => (
            <button
              key={tab}
              onClick={() => setActiveTab(idx)}
              className={`flex-1 py-2 mx-1 rounded-lg font-semibold transition-all duration-200
              ${
                idx === activeTab
                  ? "bg-gradient-to-r from-yellow-300 via-yellow-100 to-yellow-200 text-yellow-800 shadow-lg scale-105"
                  : "bg-transparent text-gray-600 hover:bg-yellow-50 hover:text-yellow-700"
              }
              focus:outline-none focus:ring-2 focus:ring-yellow-400`}
              style={{
                borderBottom:
                  idx === activeTab
                    ? "3px solid #F59E42"
                    : "3px solid transparent",
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Add Post Button - Removed */}
      {/* {activeTab === 0 && (
        <div className="max-w-2xl mx-auto mt-4">
          <button
            onClick={() => setIsAddPostModalOpen(true)}
            className="w-full bg-yellow-500 text-white py-3 px-4 rounded-lg hover:bg-yellow-600 transition-colors font-semibold shadow-md"
          >
            + Add New Post
          </button>
        </div>
      )} */}

      {/* Media Posts - Only show when Timeline tab is active */}
      {activeTab === 0 && (
        <div className="max-w-4xl mx-auto mt-6 px-4">
          {error && <p className="text-red-500 mb-4">{error}</p>}
          {posts.length === 0 ? (
            <p className="text-gray-500 text-center">No posts available.</p>
          ) : (
            <div className="relative">
              {/* Timeline line - positioned more left of center */}
              {/* Timeline vertical line with glow and subtle shadow */}
              <div
                className="absolute inset-y-0 left-6 md:left-[26%] w-2 md:w-2.5 bg-gradient-to-b from-blue-400 via-purple-400 to-pink-400 rounded-full shadow-lg z-10"
                style={{
                  filter:
                    "drop-shadow(0 0 8px #a5b4fc) drop-shadow(0 0 16px #f472b6)",
                  opacity: 0.6,
                }}
              >
                {/* Decorative animated pulse */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-5 bg-blue-400/40 rounded-full blur-md animate-pulse"></div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-5 bg-pink-400/40 rounded-full blur-md animate-pulse"></div>
              </div>

              {posts.map((post) => (
                <div key={post.id} className="relative mb-12 last:mb-0">
                  {/* Timeline dot - positioned to match the line */}
                  <div className="absolute left-6.5 md:left-[26.3%] -translate-x-1/2 w-7 h-7 bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 border-4 border-white rounded-full shadow-xl z-20 flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
                    <div className="w-3 h-3 bg-white rounded-full shadow-inner"></div>
                  </div>

                  {/* Responsive layout */}
                  <div className="flex md:justify-start md:even:justify-end">
                    <div className="w-full md:w-[32%] pl-12 md:pl-0 md:odd:pl-8 md:even:pr-8 md:odd:mr-[30%] md:even:ml-[30%]">
                      <div className="group">
                        <div
                          className="bg-white rounded-lg shadow hover:shadow-lg cursor-pointer transform transition-all duration-300 overflow-hidden border border-gray-100 mx-auto md:mx-0"
                          style={{
                            // width: "clamp(280px, 25vw, 400px)",
                            minWidth: "310px",
                            maxWidth: "460px",
                          }}
                          onClick={() => handlePostClick(post)}
                        >
                          {/* Date badge - responsive positioning */}
                          <div className="absolute top-2 left-12.5 md:left-[calc(27%+1rem)] bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-1.5 rounded-full text-xs font-semibold shadow z-10 group-hover:opacity-100 opacity-80 transition-opacity duration-200">
                            {new Date(post.time).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </div>

                          {/* Image */}
                          <div className="relative overflow-hidden rounded-lg shadow-inner group">
                            <img
                              src={getImageUrl(
                                post.id,
                                post.has_image || false
                              )}
                              alt={post.title}
                              className="w-full h-36 md:h-32 object-cover group-hover:scale-110 transition-transform duration-300 ease-in-out brightness-95 group-hover:brightness-100"
                              style={{
                                filter:
                                  "drop-shadow(0 2px 12px rgba(59,130,246,0.10))",
                              }}
                            />
                            {/* Gradient overlay for better text readability and visual appeal */}
                            <div className="absolute inset-0 bg-gradient-to-t from-blue-200/40 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                            {/* Decorative border and icon */}
                            <div className="absolute top-2 right-2 bg-white/80 rounded-full px-2 py-1 flex items-center gap-1 shadow text-blue-600 text-xs font-semibold z-10">
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M15.232 5.232l3.536 3.536M9 13h3l8-8a2.828 2.828 0 10-4-4l-8 8v3z"
                                />
                              </svg>
                              {post.has_image ? "Photo" : "No Image"}
                            </div>
                          </div>

                          {/* Content */}
                          <div className="p-5 md:p-4 bg-gradient-to-br from-white via-blue-50 to-yellow-50 rounded-lg shadow-inner transition-all duration-300 group-hover:bg-blue-50/60">
                            <h3 className="text-xl md:text-lg font-extrabold text-blue-800 mb-2 md:mb-1 group-hover:text-blue-600 transition-colors duration-200 line-clamp-2 md:line-clamp-1 drop-shadow-sm">
                              {post.title}
                            </h3>
                            <p className="text-gray-700 text-base md:text-sm leading-relaxed mb-3 md:mb-2 line-clamp-3 md:line-clamp-2 font-serif">
                              {post.paragraph}
                            </p>

                            {post.category && (
                              <div className="mt-2">
                                <span className="inline-block bg-gradient-to-r from-blue-200 via-blue-100 to-yellow-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold shadow-sm border border-blue-100">
                                  #{post.category}
                                </span>
                              </div>
                            )}

                            {/* Footer */}
                            <div className="flex items-center justify-between mt-4">
                              <div className="flex items-center gap-2 text-pink-500">
                                <span className="text-xl md:text-base">❤️</span>
                                <span className="font-bold text-base md:text-sm">
                                  {post.likes}
                                </span>
                                <span className="text-gray-400 text-xs md:text-xs font-medium">
                                  Likes
                                </span>
                              </div>
                              <div className="text-xs md:text-xs text-blue-500 font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1">
                                <span>View</span>
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M9 5l7 7-7 7"
                                  />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Content for other tabs */}
      {activeTab === 1 && (
        <div className="max-w-2xl mx-auto mt-6 bg-gradient-to-br from-yellow-50 via-white to-blue-50 p-8 rounded-2xl shadow-xl flex flex-col items-center">
          <div className="flex flex-col items-center mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-3xl">📝</span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-yellow-700 tracking-tight drop-shadow">
                Biography
              </h2>
            </div>
            <div className="w-24 h-1 bg-gradient-to-r from-yellow-300 via-yellow-200 to-blue-200 rounded-full mb-2"></div>
          </div>
          <div className="w-full max-w-xl mx-auto text-center">
            {user?.intro && user.intro.trim() ? (
              <blockquote className="relative bg-white/80 p-6 rounded-xl shadow-inner border border-yellow-100 text-gray-800 text-lg md:text-xl leading-relaxed whitespace-pre-line font-serif italic">
                <svg
                  className="absolute -top-4 left-4 w-8 h-8 text-yellow-300 opacity-60"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M7.17 6A5.001 5.001 0 002 11c0 2.21 1.79 4 4 4a1 1 0 010 2c-3.31 0-6-2.69-6-6a7 7 0 017-7 1 1 0 010 2zm10 0A5.001 5.001 0 0012 11c0 2.21 1.79 4 4 4a1 1 0 010 2c-3.31 0-6-2.69-6-6a7 7 0 017-7 1 1 0 010 2z" />
                </svg>
                {user.intro}
                <svg
                  className="absolute -bottom-4 right-4 w-8 h-8 text-yellow-300 opacity-60 rotate-180"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M7.17 6A5.001 5.001 0 002 11c0 2.21 1.79 4 4 4a1 1 0 010 2c-3.31 0-6-2.69-6-6a7 7 0 017-7 1 1 0 010 2zm10 0A5.001 5.001 0 0012 11c0 2.21 1.79 4 4 4a1 1 0 010 2c-3.31 0-6-2.69-6-6a7 7 0 017-7 1 1 0 010 2z" />
                </svg>
              </blockquote>
            ) : (
              <div className="flex flex-col items-center">
                <span className="text-5xl text-gray-300 mb-2">😶</span>
                <span className="italic text-gray-400 text-lg">
                  No biography provided yet.
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 2 && (
        <div className="max-w-3xl mx-auto mt-8 bg-gradient-to-br from-pink-50 via-white to-yellow-50 p-8 rounded-2xl shadow-2xl">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
            <div>
              <h2 className="text-3xl font-extrabold mb-1 text-pink-700 tracking-tight drop-shadow">
                Media Gallery
              </h2>
              <p className="text-gray-500 text-base italic">
                Click any image to view details.
              </p>
            </div>
            <a
              href={
                user ? `/guest/netflix?userid=${user.id}` : "/guest/netflix"
              }
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 via-pink-500 to-yellow-400 text-white rounded-full shadow-lg hover:from-red-600 hover:to-yellow-500 transition-all font-semibold text-base border-2 border-pink-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-pink-400"
              style={{
                boxShadow: "0 2px 12px 0 rgba(236,72,153,0.12)",
                letterSpacing: "0.01em",
              }}
            >
              <span className="text-lg">🎬</span>
              <span>Netflix Page</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {posts
              .filter((post) => post.has_image)
              .map((post) => (
                <div
                  key={post.id}
                  className="relative group cursor-pointer rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300 bg-white"
                  onClick={() => handlePostClick(post)}
                >
                  <img
                    src={getImageUrl(post.id, post.has_image || false)}
                    alt={post.title}
                    className="h-56 w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute bottom-0 left-0 right-0 px-4 py-3 bg-white/80 backdrop-blur-sm">
                    <h3 className="text-lg font-bold text-pink-700 truncate">
                      {post.title}
                    </h3>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500">
                        {new Date(post.time).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      {post.category && (
                        <span className="inline-block bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full text-xs font-medium ml-2">
                          {post.category}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="absolute top-2 right-2 bg-white/80 rounded-full px-3 py-1 flex items-center gap-1 shadow text-pink-600 text-xs font-semibold">
                    <span>❤️</span>
                    <span>{post.likes}</span>
                  </div>
                </div>
              ))}
          </div>
          {posts.filter((post) => post.has_image).length === 0 && (
            <div className="flex flex-col items-center mt-10">
              <span className="text-6xl text-gray-300 mb-2">🖼️</span>
              <p className="text-gray-500 text-lg italic">
                No media content available.
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 3 && (
        <div className="max-w-3xl mx-auto mt-10 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-10 rounded-3xl shadow-2xl flex flex-col items-center">
          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl animate-bounce-slow">🌳</span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-emerald-700 tracking-tight drop-shadow">
                Family Tree
              </h2>
            </div>
            <div className="w-28 h-1 bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 rounded-full mb-3"></div>
            <p className="text-gray-600 text-center max-w-lg text-lg md:text-xl font-medium">
              Discover the legacy and connections of your family. Visualize
              relationships and explore your ancestry in a beautiful interactive
              tree.
            </p>
          </div>
          {/* Illustration */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <svg
                width="180"
                height="100"
                viewBox="0 0 180 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="mx-auto"
              >
                <ellipse cx="90" cy="90" rx="70" ry="10" fill="#D1FAE5" />
                <path
                  d="M90 90 Q90 60 60 60 Q30 60 30 30 Q30 10 60 10 Q90 10 90 30 Q90 10 120 10 Q150 10 150 30 Q150 60 120 60 Q90 60 90 90"
                  stroke="#34D399"
                  strokeWidth="4"
                  fill="#A7F3D0"
                />
                <circle
                  cx="60"
                  cy="30"
                  r="12"
                  fill="#6EE7B7"
                  stroke="#059669"
                  strokeWidth="2"
                />
                <circle
                  cx="120"
                  cy="30"
                  r="12"
                  fill="#6EE7B7"
                  stroke="#059669"
                  strokeWidth="2"
                />
                <circle
                  cx="90"
                  cy="30"
                  r="14"
                  fill="#34D399"
                  stroke="#059669"
                  strokeWidth="2"
                />
                <circle
                  cx="90"
                  cy="60"
                  r="10"
                  fill="#99F6E4"
                  stroke="#0891B2"
                  strokeWidth="2"
                />
              </svg>
            </div>
          </div>
          {/* CTA Button */}
          <div className="flex justify-center">
            <a
              href={user ? `/guest/tree?userid=${user.id}` : "#"}
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 text-white rounded-full shadow-xl hover:from-emerald-500 hover:to-cyan-600 transition-all font-semibold text-xl gap-3 border-2 border-emerald-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              <span className="text-3xl">🌳</span>
              <span>View Family Tree</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 ml-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </a>
          </div>
        </div>
      )}

      {/* Add Post Modal - Removed */}
      {/* {isAddPostModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-20">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  Add New Post
                </h2>
                <button
                  onClick={closeAddPostModal}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleCreatePost} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Post Image (Optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, false)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                  {newPostImagePreview && (
                    <div className="mt-2 relative">
                      <img
                        src={newPostImagePreview}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(false)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Post Title *
                  </label>
                  <input
                    type="text"
                    value={newPost.title}
                    onChange={(e) =>
                      setNewPost((prev) => ({ ...prev, title: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    placeholder="Enter post title..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Post Content *
                  </label>
                  <textarea
                    value={newPost.paragraph}
                    onChange={(e) =>
                      setNewPost((prev) => ({
                        ...prev,
                        paragraph: e.target.value,
                      }))
                    }
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    placeholder="Write your post content here..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category (Optional)
                  </label>
                  <input
                    type="text"
                    value={newPost.category}
                    onChange={(e) =>
                      setNewPost((prev) => ({
                        ...prev,
                        category: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    placeholder="Enter category (e.g., family, work, travel)..."
                  />
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                  <button
                    type="button"
                    onClick={closeAddPostModal}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                    disabled={isCreatingPost}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={
                      isCreatingPost ||
                      !newPost.title.trim() ||
                      !newPost.paragraph.trim()
                    }
                  >
                    {isCreatingPost ? "Creating..." : "Create Post"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )} */}

      {/* Post Detail Modal */}
      {isModalOpen && selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-20">
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100 opacity-100">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-4 border-b pb-3">
                <h2 className="text-3xl font-extrabold text-gray-900">
                  Post Details
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700 text-4xl font-light leading-none transition-transform duration-200 hover:rotate-90"
                  aria-label="Close modal"
                >
                  &times;
                </button>
              </div>

              {/* Post Content - Simplified for view-only */}
              <div className="space-y-6 py-4">
                {/* Post Image Section */}
                <div className="relative">
                  <img
                    src={getImageUrl(
                      selectedPost.id,
                      selectedPost.has_image || false
                    )}
                    alt={selectedPost.title}
                    className="w-full h-72 object-cover rounded-lg shadow-md"
                  />
                  {selectedPost.category && (
                    <span className="absolute top-3 left-3 bg-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                      {selectedPost.category}
                    </span>
                  )}
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Title
                  </label>
                  <p className="text-gray-900 font-bold text-2xl">
                    {selectedPost.title}
                  </p>
                </div>

                {/* Date Posted */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Date Posted
                  </label>
                  <p className="text-gray-700 text-sm">
                    {new Date(selectedPost.time).toLocaleString()}
                  </p>
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Content
                  </label>
                  <p className="text-gray-800 leading-relaxed text-base">
                    {selectedPost.paragraph}
                  </p>
                </div>

                {/* Likes */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Likes
                  </label>
                  <button
                    className={`flex items-center gap-2 text-xl font-medium focus:outline-none transition-all duration-200 ${
                      selectedPost.likes > 0
                        ? "text-pink-600 animate-pulse"
                        : "text-gray-400"
                    } hover:scale-105 transform`}
                    type="button"
                    onClick={() => {
                      setSelectedPost((prev) =>
                        prev
                          ? {
                              ...prev,
                              likes: prev.likes + 1,
                            }
                          : prev
                      );
                      setPosts((prevPosts) =>
                        prevPosts.map((post) =>
                          post.id === selectedPost.id
                            ? { ...post, likes: post.likes + 1 }
                            : post
                        )
                      );
                      fetch(`/api/admin/posts/likes`, {
                        method: "PUT",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          id: selectedPost.id,
                        }),
                      }).catch((err) => {
                        console.error("Error updating likes:", err);
                      });
                    }}
                    aria-label={`Like this post, current likes: ${selectedPost.likes}`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill={selectedPost.likes > 0 ? "currentColor" : "none"}
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      className="w-7 h-7"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 21.364l-7.682-7.682a4.5 4.5 0 010-6.364z"
                      />
                    </svg>
                    <span className="text-lg">{selectedPost.likes}</span>
                  </button>
                </div>

                {/* Comment Section - Remains active */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Comments
                  </label>

                  {/* Comments List */}
                  <div className="space-y-3 mb-4 p-3 bg-gray-50 rounded-lg max-h-60 overflow-y-auto border border-gray-200">
                    {isLoadingComments ? (
                      <div className="text-gray-500 text-sm text-center py-4">
                        Loading comments...
                      </div>
                    ) : comments.length === 0 ? (
                      <div className="text-gray-500 text-sm text-center py-4">
                        No comments yet. Be the first to comment!
                      </div>
                    ) : (
                      comments.map((comment) => (
                        <div
                          key={comment.id}
                          className="bg-white rounded-md p-3 shadow-sm border border-gray-100"
                        >
                          <p className="text-gray-800 text-sm">
                            {comment.content}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add Comment Form */}
                  <form onSubmit={submitComment} className="flex gap-3">
                    <input
                      type="text"
                      className="flex-1 border border-gray-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all duration-200"
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      disabled={isSubmittingComment}
                      aria-label="New comment content"
                    />
                    <button
                      type="submit"
                      className="bg-yellow-500 text-white px-5 py-2 rounded-md hover:bg-yellow-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                      disabled={isSubmittingComment || !newComment.trim()}
                    >
                      {isSubmittingComment ? "Posting..." : "Post"}
                    </button>
                  </form>
                </div>
              </div>

              {/* Modal Actions - Only "Close" button remains */}
              <div className="flex justify-end gap-4 mt-6 pt-5 border-t border-gray-200">
                <button
                  onClick={closeModal}
                  className="px-6 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors duration-200 font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logout button removed - Guests don't "log out" from a view-only page */}
      {/* <div className="flex justify-center mt-10">
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div> */}
    </div>
  );
}
