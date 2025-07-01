"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Post {
  id: number;
  title: string;
  paragraph: string;
  time: string;
  likes: number;
  has_image?: boolean; // Changed from image?: string
  image_mime_type?: string;
}

interface User {
  id: number;
  has_icon?: boolean; // Changed from image?: string
  icon_mime_type?: string;
  name: string;
  birthday: string;
  dateOfDeath: string;
  gender: string;
  address: string;
  intro: string;
}

interface Comment {
  id: number;
  post_id: number;
  content: string;
}

export default function AdminDashboard() {
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
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedPost, setEditedPost] = useState<Post | null>(null);
  const [isUpdatingPost, setIsUpdatingPost] = useState(false);
  const [isDeletingPost, setIsDeletingPost] = useState(false);
  const [newPostImage, setNewPostImage] = useState<File | null>(null);
  const [newPostImagePreview, setNewPostImagePreview] = useState<string>("");
  const [editedPostImage, setEditedPostImage] = useState<File | null>(null);
  const [editedPostImagePreview, setEditedPostImagePreview] =
    useState<string>("");

  // Add Post Modal States
  const [isAddPostModalOpen, setIsAddPostModalOpen] = useState(false);
  const [newPost, setNewPost] = useState({ title: "", paragraph: "" });
  const [isCreatingPost, setIsCreatingPost] = useState(false);

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

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    isEdit = false
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (isEdit) {
        setEditedPostImage(file);
        const reader = new FileReader();
        reader.onload = () =>
          setEditedPostImagePreview(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        setNewPostImage(file);
        const reader = new FileReader();
        reader.onload = () => setNewPostImagePreview(reader.result as string);
        reader.readAsDataURL(file);
      }
    }
  };

  const removeImage = (isEdit = false) => {
    if (isEdit) {
      setEditedPostImage(null);
      setEditedPostImagePreview("");
    } else {
      setNewPostImage(null);
      setNewPostImagePreview("");
    }
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

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.title.trim() || !newPost.paragraph.trim() || !userId) return;

    setIsCreatingPost(true);
    try {
      const formData = new FormData();
      formData.append("userId", userId);
      formData.append("title", newPost.title.trim());
      formData.append("paragraph", newPost.paragraph.trim());

      if (newPostImage) {
        formData.append("image", newPostImage);
      }

      const res = await fetch("/api/admin/posts", {
        method: "POST",
        body: formData, // Changed from JSON to FormData
      });

      if (!res.ok) throw new Error("Failed to create post");

      const data = await res.json();

      // Add the new post to the beginning of the posts array
      setPosts((prevPosts) => [data.post, ...prevPosts]);

      // Reset form and close modal
      setNewPost({ title: "", paragraph: "" });
      setNewPostImage(null);
      setNewPostImagePreview("");
      setIsAddPostModalOpen(false);

      alert("Post created successfully!");
    } catch (err: any) {
      console.error("Error creating post:", err);
      alert("Failed to create post. Please try again.");
    } finally {
      setIsCreatingPost(false);
    }
  };

  const handleEditPost = () => {
    if (selectedPost) {
      setEditedPost({ ...selectedPost });
      setEditedPostImagePreview("");
      setIsEditMode(true);
    }
  };
  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditedPost(null);
  };

  const handleSaveEdit = async () => {
    if (!editedPost) return;

    setIsUpdatingPost(true);
    try {
      const formData = new FormData();
      formData.append("id", editedPost.id.toString());
      formData.append("title", editedPost.title);
      formData.append("paragraph", editedPost.paragraph);

      if (editedPostImage) {
        formData.append("image", editedPostImage);
      }

      const res = await fetch(`/api/admin/posts`, {
        method: "PUT",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to update post");

      const data = await res.json();

      // Update the posts array
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === editedPost.id ? { ...post, ...data.post } : post
        )
      );

      // Update the selected post with the new data
      setSelectedPost((prev) => (prev ? { ...prev, ...data.post } : prev));

      setIsEditMode(false);
      setEditedPost(null);
      setEditedPostImage(null);
      setEditedPostImagePreview("");
      alert("Post updated successfully!");
    } catch (err: any) {
      console.error("Error updating post:", err);
      alert("Failed to update post. Please try again.");
    } finally {
      setIsUpdatingPost(false);
    }
  };

  const handleDeletePost = async () => {
    if (!selectedPost) return;

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this post? This action cannot be undone."
    );

    if (!confirmDelete) return;

    setIsDeletingPost(true);
    try {
      const res = await fetch(`/api/admin/posts`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId: selectedPost.id,
        }),
      });

      if (!res.ok) throw new Error("Failed to delete post");

      // Remove the post from the posts array
      setPosts((prevPosts) =>
        prevPosts.filter((post) => post.id !== selectedPost.id)
      );

      closeModal();
      alert("Post deleted successfully!");
    } catch (err: any) {
      console.error("Error deleting post:", err);
      alert("Failed to delete post. Please try again.");
    } finally {
      setIsDeletingPost(false);
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
    setIsEditMode(false);
    setEditedPost(null);
    setEditedPostImage(null);
    setEditedPostImagePreview("");
  };

  const closeAddPostModal = () => {
    setIsAddPostModalOpen(false);
    setNewPost({ title: "", paragraph: "" });
    setNewPostImage(null);
    setNewPostImagePreview("");
  };

  const handleLogout = () => {
    router.push("/");
  };

  const tabs = ["Timeline", "Bio", "Media", "Family Tree"];

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* Profile Header */}
      <div className="bg-white max-w-2xl mx-auto p-6 rounded-xl shadow-lg text-center relative">
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

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mt-4">
          <button className="border px-4 py-2 rounded-full text-sm text-yellow-600 border-yellow-500 hover:bg-yellow-100">
            ♡ Favorite
          </button>
          <button
            className="border px-4 py-2 rounded-full text-sm text-yellow-600 border-yellow-500 hover:bg-yellow-100"
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
          <button
            className="border px-4 py-2 rounded-full text-sm text-yellow-600 border-yellow-500 hover:bg-yellow-100"
            onClick={() =>
              router.push("/admin/settings" + (userId ? `?user=${userId}` : ""))
            }
          >
            📝 Settings
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

      {/* Add Post Button - Only show when Timeline tab is active */}
      {activeTab === 0 && (
        <div className="max-w-2xl mx-auto mt-4">
          <button
            onClick={() => setIsAddPostModalOpen(true)}
            className="w-full bg-yellow-500 text-white py-3 px-4 rounded-lg hover:bg-yellow-600 transition-colors font-semibold shadow-md"
          >
            + Add New Post
          </button>
        </div>
      )}

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

              {posts.map((post, index) => (
                <div key={post.id} className="relative mb-12 last:mb-0">
                  {/* Timeline dot - positioned to match the line */}
                  <div className="absolute left-6 md:left-[26.25%] -translate-x-1/2 w-4 h-4 bg-white border-4 border-blue-500 rounded-full shadow-lg z-10"></div>

                  {/* Responsive layout */}
                  <div className="flex md:justify-start md:even:justify-end">
                    <div className="w-full md:w-[32%] pl-12 md:pl-0 md:odd:pl-8 md:even:pr-8 md:odd:mr-[30%] md:even:ml-[30%]">
                      <div className="group">
                        <div
                          className="bg-white rounded-lg shadow hover:shadow-lg cursor-pointer transform hover:-translate-y-1 transition-all duration-300 overflow-hidden border border-gray-100 mx-auto md:mx-0"
                          style={{
                            // width: "clamp(280px, 25vw, 400px)",
                            minWidth: "360px",
                            maxWidth: "460px",
                          }}
                          onClick={() => handlePostClick(post)}
                        >
                          {/* Date badge - responsive positioning */}
                          <div className="absolute top-2 left-10 md:left-[calc(26%+1rem)] bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow z-10 group-hover:opacity-0">
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
                    className="rounded-md h-40 w-full object-cover hover:opacity-90 transition-opacity"
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

      {/* Add Post Modal */}
      {isAddPostModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-20">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
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

              {/* Add Post Form */}
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

                {/* Modal Actions */}
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
      )}

      {/* Post Detail Modal */}
      {isModalOpen && selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-20">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  {isEditMode ? "Edit Post" : "Post Details"}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              {/* Post Content */}
              <div className="space-y-3">
                {isEditMode ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Post Image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, true)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 mb-2"
                    />
                    {(editedPostImagePreview || selectedPost.has_image) && (
                      <div className="relative">
                        <img
                          src={
                            editedPostImagePreview ||
                            getImageUrl(
                              selectedPost.id,
                              selectedPost.has_image || false
                            )
                          }
                          alt={selectedPost.title}
                          className="w-full h-64 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(true)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <img
                    src={getImageUrl(
                      selectedPost.id,
                      selectedPost.has_image || false
                    )}
                    alt={selectedPost.title}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                )}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={editedPost?.title || ""}
                        onChange={(e) =>
                          setEditedPost((prev) =>
                            prev ? { ...prev, title: e.target.value } : null
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      />
                    ) : (
                      <p className="text-gray-900 font-semibold text-lg">
                        {selectedPost.title}
                      </p>
                    )}
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
                    {isEditMode ? (
                      <textarea
                        value={editedPost?.paragraph || ""}
                        onChange={(e) =>
                          setEditedPost((prev) =>
                            prev ? { ...prev, paragraph: e.target.value } : null
                          )
                        }
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      />
                    ) : (
                      <p className="text-gray-900 leading-relaxed">
                        {selectedPost.paragraph}
                      </p>
                    )}
                  </div>

                  {!isEditMode && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Likes
                      </label>
                      <button
                        className={`flex items-center gap-1 text-lg font-medium focus:outline-none transition-colors ${
                          selectedPost.likes > 0
                            ? "text-pink-500"
                            : "text-gray-400"
                        } hover:scale-110`}
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
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill={
                            selectedPost.likes > 0 ? "currentColor" : "none"
                          }
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
                      </button>
                    </div>
                  )}

                  {!isEditMode && (
                    <div>
                      {/* Comment Section */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Comments
                        </label>

                        {/* Comments List */}
                        <div className="space-y-2 mb-2 max-h-60 overflow-y-auto">
                          {isLoadingComments ? (
                            <div className="text-gray-500 text-sm">
                              Loading comments...
                            </div>
                          ) : comments.length === 0 ? (
                            <div className="text-gray-500 text-sm">
                              No comments yet. Be the first to comment!
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

                        {/* Add Comment Form */}
                        <form
                          className="flex gap-2 mt-2"
                          onSubmit={submitComment}
                        >
                          <input
                            type="text"
                            className="flex-1 border rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                            placeholder="Add a comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            disabled={isSubmittingComment}
                          />
                          <button
                            type="submit"
                            className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isSubmittingComment || !newComment.trim()}
                          >
                            {isSubmittingComment ? "Posting..." : "Post"}
                          </button>
                        </form>
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Actions */}
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                  {isEditMode ? (
                    <>
                      <button
                        onClick={handleCancelEdit}
                        className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                        disabled={isUpdatingPost}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isUpdatingPost}
                      >
                        {isUpdatingPost ? "Saving..." : "Save Changes"}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={closeModal}
                        className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                      >
                        Close
                      </button>
                      <button
                        onClick={handleDeletePost}
                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isDeletingPost}
                      >
                        {isDeletingPost ? "Deleting..." : "Delete Post"}
                      </button>
                      <button
                        onClick={handleEditPost}
                        className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                      >
                        Edit Post
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logout */}
      <div className="flex justify-center mt-10">
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
