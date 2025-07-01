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
  has_background?: boolean;
  background_mime_type?: string;
}

interface Comment {
  id: number;
  post_id: number;
  content: string;
}

export default function GuestProfile() {
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

  const handlePostClick = (post: Post) => {
    setSelectedPost(post);
    setIsModalOpen(true);
    fetchComments(post.id);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPost(null);
    setComments([]);
  };

  const tabs = ["Timeline", "Bio", "Media", "Family Tree"];

  return (
    <div className="min-h-screen bg-gray-100 p-4">
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
        <img
          src={
            user?.has_icon
              ? getUserIconUrl(user.id, user.has_icon)
              : "/placeholder-icon.jpg"
          }
          alt="User Icon"
          className="w-24 h-24 rounded-full mx-auto border-4 border-white shadow-md object-cover"
        />

        <h1 className="text-2xl font-bold mt-2">{user?.name}</h1>
        <p className="text-gray-500">
          {user?.birthday} – {user?.dateOfDeath ? user.dateOfDeath : "Present"}
        </p>
        <p className="italic text-sm mt-2">
          {user?.gender} | {user?.address}
        </p>

        {/* Action Buttons - Guest version with limited actions */}
        <div className="flex justify-center gap-4 mt-4">
          <button className="border px-4 py-2 rounded-full text-sm text-yellow-600 border-yellow-500 hover:bg-yellow-100">
            ♡ Favorite
          </button>
          <button
            className="border px-4 py-2 rounded-full text-sm text-yellow-600 border-yellow-500 hover:bg-yellow-100"
            onClick={() => {
              if (user?.id) {
                const url = `${window.location.origin}/guest?user=${user.id}`;
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

      {/* Media Posts - Only show when Timeline tab is active */}
      {activeTab === 0 && (
        <div className="max-w-4xl mx-auto mt-6 px-4">
          {error && <p className="text-red-500 mb-4">{error}</p>}
          {posts.length === 0 ? (
            <p className="text-gray-500 text-center">No posts available.</p>
          ) : (
            <div className="relative">
              {/* Timeline line - positioned more left of center */}
              <div className="absolute inset-y-0 left-6 md:left-[26%] w-1 bg-gradient-to-b from-blue-400 via-purple-500 to-pink-500"></div>

              {posts.map((post) => (
                <div key={post.id} className="relative mb-12 last:mb-0">
                  {/* Timeline dot - positioned to match the line */}
                  <div className="absolute left-6 md:left-[26.25%] -translate-x-1/2 w-4 h-4 bg-white border-4 border-blue-500 rounded-full shadow-lg z-10"></div>

                  {/* Responsive layout */}
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
                          {/* Date badge - responsive positioning */}
                          <div className="absolute top-2 left-10 md:left-[calc(26%+1rem)] bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow z-10 group-hover:opacity-100 opacity-80 transition-opacity duration-200">
                            {new Date(post.time).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </div>

                          {/* Image */}
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

                          {/* Content */}
                          <div className="p-4 md:p-3">
                            <h3 className="text-lg md:text-base font-bold text-gray-800 mb-2 md:mb-1 group-hover:text-blue-600 transition-colors duration-200 line-clamp-2 md:line-clamp-1">
                              {post.title}
                            </h3>
                            <p className="text-gray-600 text-sm md:text-xs leading-relaxed mb-3 md:mb-2 line-clamp-3 md:line-clamp-2">
                              {post.paragraph}
                            </p>

                            {/* Footer */}
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

      {/* Content for other tabs */}
      {activeTab === 1 && (
        <div className="max-w-2xl mx-auto mt-6 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Bio</h2>
          <p className="text-gray-600">{user?.intro}</p>
        </div>
      )}

      {activeTab === 2 && (
        <div className="max-w-2xl mx-auto mt-6 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Media</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {posts
              .filter((post) => post.has_image)
              .map((post) => (
                <div key={post.id} className="cursor-pointer">
                  <img
                    src={getImageUrl(post.id, post.has_image || false)}
                    alt={post.title}
                    className="rounded-md h-60 w-full object-cover hover:opacity-90 transition-opacity duration-200"
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

      {activeTab === 3 && (
        <div className="max-w-2xl mx-auto mt-6 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Family Tree</h2>
          <p className="text-gray-600">Family tree will be displayed here.</p>
        </div>
      )}

      {/* Post Detail Modal - Read-only version */}
      {isModalOpen && selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-20">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
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

              {/* Post Content - Read-only */}
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Likes
                    </label>
                    <div className="flex items-center gap-1 text-lg font-medium text-pink-500">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
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

                  {/* Comments Section - Read-only */}
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

                {/* Modal Actions - Only close button for guests */}
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

      {/* Guest Footer - Optional back to home link */}
      <div className="flex justify-center mt-10">
        <button
          onClick={() => router.push("/")}
          className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}
