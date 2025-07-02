"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Interface for a Post object
interface Post {
  id: number;
  title: string;
  paragraph: string;
  time: string;
  likes: number;
  has_image?: boolean;
  image_mime_type?: string;
  category?: string | null;
}

// Interface for a User object
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
  has_background?: boolean;
  background_mime_type?: string;
}

// Interface for a Comment object
interface Comment {
  id: number;
  post_id: number;
  content: string;
}

// The main component for the view-only dashboard
export default function ViewOnlyDashboard() {
  const [userId, setUserId] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [error, setError] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  const router = useRouter();

  // Effect to get the user ID from the URL search parameters
  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      setUserId(searchParams.get("user"));
    }
  }, []);

  // Effect to fetch posts when the userId is available
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

  // Effect to fetch user data when the userId is available
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
        const user = data.user;
        // Format dates for display
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

  // Helper function to get the URL for a post's image
  const getImageUrl = (postId: number, hasImage: boolean) => {
    return hasImage
      ? `/api/admin/posts/images?postId=${postId}`
      : "/placeholder-icon.jpg";
  };

  // Helper function to get the URL for a user's icon
  const getUserIconUrl = (userId: number, hasIcon: boolean) => {
    return hasIcon
      ? `/api/admin/users/icon?userId=${userId}`
      : "/placeholder-icon.jpg";
  };

  // Helper function to get the URL for a user's background image
  const getUserBackgroundUrl = (userId: number, hasBackground: boolean) => {
    return hasBackground
      ? `/api/admin/users/background?userId=${userId}`
      : null;
  };

  // Fetches comments for a given post
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

  // Opens the post detail modal
  const handlePostClick = (post: Post) => {
    setSelectedPost(post);
    setIsModalOpen(true);
    fetchComments(post.id);
  };

  // Closes the post detail modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPost(null);
    setComments([]);
  };

  const tabs = ["Timeline", "Bio", "Media", "Family Tree"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-blue-50 p-4">
      {/* Profile Header */}
      <div
        className="max-w-2xl mx-auto p-6 rounded-xl shadow-lg text-center relative overflow-hidden"
        style={
          user?.has_background && user.id
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
        <img
          src={
            user?.has_icon && user.id
              ? getUserIconUrl(user.id, user.has_icon)
              : "/placeholder-icon.jpg"
          }
          alt={user?.name ? `${user.name}'s User Icon` : "User Icon"}
          className="w-32 h-32 rounded-full mx-auto border-4 border-blue-200 shadow-md object-cover ring-2 ring-blue-100 ring-offset-2"
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

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mt-4">
          <button className="border px-4 py-2 rounded-full text-sm text-yellow-700 border-yellow-500 hover:bg-yellow-200 hover:border-yellow-600 shadow-md transition-all duration-200 ease-in-out transform hover:scale-105">
            ♡ Favorite
          </button>
          <button
            className="border px-4 py-2 rounded-full text-sm text-yellow-700 border-yellow-500 hover:bg-yellow-200 hover:border-yellow-600 shadow-md transition-all duration-200 ease-in-out transform hover:scale-105"
            onClick={() => {
              if (user?.id) {
                const url = `https://itombs.vercel.app/guest?user=${user.id}`;
                navigator.clipboard.writeText(url).then(() => {
                  alert("Share link copied to clipboard!");
                });
              }
            }}
          >
            🔄 Share
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-2xl mx-auto mt-8">
        <div className="flex justify-between bg-white rounded-xl shadow p-2 mb-2">
          {tabs.map((tab, idx) => (
            <button
              key={tab}
              onClick={() => setActiveTab(idx)}
              className="flex-1 py-2 mx-1 rounded-lg transition-colors duration-150 
            text-gray-600 font-semibold hover:bg-yellow-100 hover:text-yellow-700 focus:outline-none"
              style={{
                borderBottom:
                  idx === activeTab
                    ? "3px solid #F59E42"
                    : "3px solid transparent",
                background: idx === activeTab ? "#FFF7E6" : "transparent",
                color: idx === activeTab ? "#F59E42" : undefined,
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Posts - Only show when Timeline tab is active */}
      {activeTab === 0 && (
        <div className="max-w-4xl mx-auto mt-6 px-4">
          {error && <p className="text-red-500 mb-4">{error}</p>}
          {posts.length === 0 ? (
            <p className="text-gray-500 text-center">No posts available.</p>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute inset-y-0 left-6 md:left-[26%] w-1 bg-gradient-to-b from-blue-400 via-purple-500 to-pink-500"></div>

              {posts.map((post) => (
                <div key={post.id} className="relative mb-12 last:mb-0">
                  {/* Timeline dot */}
                  <div className="absolute left-6 md:left-[26.25%] -translate-x-1/2 w-4 h-4 bg-white border-4 border-blue-500 rounded-full shadow-lg z-10"></div>

                  <div className="flex md:justify-start md:even:justify-end">
                    <div className="w-full md:w-[32%] pl-12 md:pl-0 md:odd:pl-8 md:even:pr-8 md:odd:mr-[30%] md:even:ml-[30%]">
                      <div className="group">
                        <div
                          className="bg-white rounded-lg shadow hover:shadow-lg cursor-pointer transform transition-all duration-300 overflow-hidden border border-gray-100 mx-auto md:mx-0"
                          style={{
                            minWidth: "310px",
                            maxWidth: "460px",
                          }}
                          onClick={() => handlePostClick(post)}
                        >
                          <div className="absolute top-2 left-10 md:left-[calc(26%+1rem)] bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow z-10 group-hover:opacity-100 opacity-80 transition-opacity duration-200">
                            {new Date(post.time).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </div>

                          <div className="relative overflow-hidden">
                            <img
                              src={getImageUrl(
                                post.id,
                                post.has_image || false
                              )}
                              alt={post.title}
                              className="w-full h-32 md:h-28 object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          </div>

                          <div className="p-4 md:p-3">
                            <h3 className="text-lg md:text-base font-bold text-gray-800 mb-2 md:mb-1 group-hover:text-blue-600 transition-colors duration-200 line-clamp-2 md:line-clamp-1">
                              {post.title}
                            </h3>
                            <p className="text-gray-600 text-sm md:text-xs leading-relaxed mb-3 md:mb-2 line-clamp-3 md:line-clamp-2">
                              {post.paragraph}
                            </p>

                            {post.category && (
                              <div className="mt-2">
                                <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                                  {post.category}
                                </span>
                              </div>
                            )}

                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2 md:space-x-1 text-pink-500">
                                <span className="text-lg md:text-base">❤️</span>
                                <span className="font-semibold text-base md:text-sm">
                                  {post.likes}
                                </span>
                                <span className="text-gray-400 text-sm md:text-xs">
                                  Likes
                                </span>
                              </div>
                              <div className="text-sm md:text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                View →
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

      {/* Bio Tab Content */}
      {activeTab === 1 && (
        <div className="max-w-2xl mx-auto mt-6 bg-white p-8 rounded-xl shadow flex flex-col items-center">
          <h2 className="text-2xl font-bold mb-2 text-yellow-600">Bio</h2>
          <div className="w-20 h-1 bg-yellow-300 rounded-full mb-6"></div>
          <div className="w-full text-center">
            <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-line">
              {user?.intro ? (
                user.intro
              ) : (
                <span className="italic text-gray-400">
                  No biography provided yet.
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Media Tab Content */}
      {activeTab === 2 && (
        <div className="max-w-2xl mx-auto mt-6 bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold mb-1 text-pink-600 tracking-tight">
                Media Gallery
              </h2>
              <p className="text-gray-500 text-sm mb-2 italic">
                Click any image to view details.
              </p>
            </div>
            <a
              href={
                user ? `/admin/netflix?userid=${user.id}` : "/admin/netflix"
              }
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-red-600 via-red-500 to-pink-500 text-white rounded-full shadow-lg hover:from-red-700 hover:to-pink-600 transition-all font-semibold text-sm border border-red-400 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-400"
              style={{
                boxShadow: "0 2px 8px 0 rgba(220,38,38,0.12)",
                letterSpacing: "0.01em",
              }}
            >
              <span className="text-base">🎬</span>
              <span>Netflix Page</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {posts
              .filter((post) => post.has_image)
              .map((post) => (
                <div key={post.id} className="cursor-pointer">
                  <img
                    src={getImageUrl(post.id, post.has_image || false)}
                    alt={post.title}
                    className="mt-3 rounded-md h-70 w-full object-cover hover:opacity-70 transition-opacity duration-200"
                    onClick={() => handlePostClick(post)}
                  />
                </div>
              ))}
          </div>
          {posts.filter((post) => post.has_image).length === 0 && (
            <p className="text-gray-600">No media content available.</p>
          )}
        </div>
      )}

      {/* Family Tree Tab Content */}
      {activeTab === 3 && (
        <div className="max-w-2xl mx-auto mt-6 bg-white p-6 rounded-lg shadow">
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">🌳</span>
              <h2 className="text-2xl font-bold text-emerald-700 tracking-tight">
                Family Tree
              </h2>
            </div>
            <div className="w-24 h-1 bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 rounded-full mb-2"></div>
            <p className="text-gray-600 text-center max-w-md">
              Explore the family lineage and connections. Click below to view
              the full family tree.
            </p>
          </div>
          <div className="flex justify-center">
            <a
              href={user ? `/guest/tree?userid=${user.id}` : "#"}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 text-white rounded-full shadow-lg hover:from-emerald-500 hover:to-cyan-600 transition-all font-semibold text-lg gap-2 border-2 border-emerald-300 hover:scale-105"
            >
              <span className="text-2xl">🌳</span>
              <span>View Family Tree</span>
            </a>
          </div>
        </div>
      )}

      {/* Post Detail Modal (View-Only) */}
      {isModalOpen && selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-20">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  Post Details
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              <div className="space-y-3">
                <img
                  src={getImageUrl(
                    selectedPost.id,
                    selectedPost.has_image || false
                  )}
                  alt={selectedPost.title}
                  className="w-full h-64 object-cover rounded-lg"
                />
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <p className="text-gray-900 font-semibold text-lg">
                      {selectedPost.title}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date Posted
                    </label>
                    <p className="text-gray-900">
                      {new Date(selectedPost.time).toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Content
                    </label>
                    <p className="text-gray-900 leading-relaxed">
                      {selectedPost.paragraph}
                    </p>
                  </div>

                  {selectedPost.category && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <span className="inline-block bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                        {selectedPost.category}
                      </span>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Likes
                    </label>
                    <div
                      className={`flex items-center gap-1 text-lg font-medium ${
                        selectedPost.likes > 0
                          ? "text-pink-500"
                          : "text-gray-400"
                      }`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill={selectedPost.likes > 0 ? "currentColor" : "none"}
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        className="w-6 h-6"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 21.364l-7.682-7.682a4.5 4.5 0 010-6.364z"
                        />
                      </svg>
                      <span className="text-base">{selectedPost.likes}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Comments
                    </label>
                    <div className="space-y-2 mb-2 max-h-60 overflow-y-auto">
                      {isLoadingComments ? (
                        <div className="text-gray-500 text-sm">
                          Loading comments...
                        </div>
                      ) : comments.length === 0 ? (
                        <div className="text-gray-500 text-sm">
                          No comments yet.
                        </div>
                      ) : (
                        comments.map((comment) => (
                          <div
                            key={comment.id}
                            className="bg-gray-100 rounded p-2"
                          >
                            <span className="text-gray-700">
                              {comment.content}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
