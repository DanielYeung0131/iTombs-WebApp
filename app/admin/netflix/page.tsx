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
  category?: string | null;
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
}

interface Comment {
  id: number;
  post_id: number;
  content: string;
}

export default function NetflixStylePosts() {
  const [userId, setUserId] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState("");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [hoveredPost, setHoveredPost] = useState<number | null>(null);

  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      setUserId(searchParams.get("userid"));
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
        setUser(data.user);
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

  const submitComment = async () => {
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
  };

  const handleLike = async (post: Post) => {
    try {
      const newLikes = post.likes + 1;
      setSelectedPost((prev) => (prev ? { ...prev, likes: newLikes } : prev));
      setPosts((prevPosts) =>
        prevPosts.map((p) => (p.id === post.id ? { ...p, likes: newLikes } : p))
      );

      await fetch(`/api/admin/posts/likes`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: post.id }),
      });
    } catch (err) {
      console.error("Error updating likes:", err);
    }
  };

  // Group posts by category
  const groupedPosts = posts.reduce((acc, post) => {
    const category = post.category || "Uncategorized";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(post);
    return acc;
  }, {} as Record<string, Post[]>);

  // Add featured section with recent posts
  const recentPosts = posts.slice(0, 6);
  if (recentPosts.length > 0) {
    groupedPosts["Recently Added"] = recentPosts;
  }

  const categories = Object.keys(groupedPosts);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Netflix-style Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black via-black/80 to-transparent">
        <div className="flex items-center justify-between px-8 py-4">
          <div className="flex items-center space-x-8">
            <h1 className="text-red-600 font-bold text-2xl tracking-wider">
              iTOMBS
            </h1>
            <nav className="hidden md:flex space-x-6">
              <button
                onClick={() => router.push(`/admin/dashboard?user=${userId}`)}
                className="text-gray-300 hover:text-white transition-colors"
              >
                Dashboard
              </button>
              <span className="text-white font-semibold">Media</span>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-300">{user?.name}</span>
            <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      {recentPosts.length > 0 && (
        <section className="relative h-screen flex items-center">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${getImageUrl(
                recentPosts[0].id,
                recentPosts[0].has_image || false
              )})`,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent"></div>
          </div>

          <div className="relative z-10 px-8 max-w-2xl">
            <h1 className="text-5xl md:text-7xl font-bold mb-4 leading-tight">
              {recentPosts[0].title}
            </h1>
            <p className="text-lg md:text-xl mb-6 text-gray-200 line-clamp-3">
              {recentPosts[0].paragraph}
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => handlePostClick(recentPosts[0])}
                className="bg-white text-black px-8 py-3 rounded font-bold hover:bg-gray-200 transition-colors flex items-center space-x-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>View Details</span>
              </button>
              <button
                onClick={() => handleLike(recentPosts[0])}
                className="bg-gray-600/70 text-white px-6 py-3 rounded font-bold hover:bg-gray-500/70 transition-colors flex items-center space-x-2"
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
                    d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 21.364l-7.682-7.682a4.5 4.5 0 010-6.364z"
                  />
                </svg>
                <span>{recentPosts[0].likes}</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Content Sections */}
      <main className="relative z-10 bg-black pt-8">
        {error && (
          <div className="px-8 mb-8">
            <p className="text-red-500">{error}</p>
          </div>
        )}

        {categories.map((category) => (
          <section key={category} className="mb-12">
            <div className="px-8">
              <h2 className="text-2xl font-bold mb-6 text-white">{category}</h2>
              <div className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4">
                {groupedPosts[category].map((post) => (
                  <div
                    key={post.id}
                    className="relative flex-shrink-0 w-80 cursor-pointer group"
                    onMouseEnter={() => setHoveredPost(post.id)}
                    onMouseLeave={() => setHoveredPost(null)}
                    onClick={() => handlePostClick(post)}
                  >
                    <div className="relative overflow-hidden rounded-lg transition-transform duration-300 group-hover:scale-105">
                      <img
                        src={getImageUrl(post.id, post.has_image || false)}
                        alt={post.title}
                        className="w-full h-48 object-cover"
                      />

                      {/* Hover overlay */}
                      <div
                        className={`absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent transition-opacity duration-300 ${
                          hoveredPost === post.id ? "opacity-100" : "opacity-0"
                        }`}
                      >
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <h3 className="text-white font-bold text-lg mb-2 line-clamp-1">
                            {post.title}
                          </h3>
                          <p className="text-gray-300 text-sm line-clamp-2 mb-3">
                            {post.paragraph}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLike(post);
                                }}
                                className="bg-gray-600/70 hover:bg-gray-500/70 rounded-full p-2 transition-colors"
                              >
                                <svg
                                  className="w-4 h-4 text-red-500"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </button>
                              <span className="text-sm text-gray-300">
                                {post.likes}
                              </span>
                            </div>
                            <span className="text-xs text-gray-400">
                              {new Date(post.time).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Title below image (always visible) */}
                    <div className="mt-3">
                      <h3 className="text-white font-semibold text-base line-clamp-1">
                        {post.title}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        {new Date(post.time).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ))}

        {posts.length === 0 && !error && (
          <div className="px-8 py-16 text-center">
            <p className="text-gray-400 text-lg">No media content available.</p>
          </div>
        )}
      </main>

      {/* Post Detail Modal */}
      {isModalOpen && selectedPost && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="relative">
              {/* Modal Header with Image */}
              <div className="relative">
                <img
                  src={getImageUrl(
                    selectedPost.id,
                    selectedPost.has_image || false
                  )}
                  alt={selectedPost.title}
                  className="w-full h-96 object-cover rounded-t-lg"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent rounded-t-lg"></div>
                <button
                  onClick={closeModal}
                  className="absolute top-4 right-4 text-white hover:text-gray-300 text-3xl font-bold bg-black/50 rounded-full w-10 h-10 flex items-center justify-center"
                >
                  ×
                </button>

                {/* Content overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <h1 className="text-4xl font-bold text-white mb-4">
                    {selectedPost.title}
                  </h1>
                  <div className="flex items-center space-x-6 text-gray-300">
                    <button
                      onClick={() => handleLike(selectedPost)}
                      className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded transition-colors"
                    >
                      <svg
                        className="w-5 h-5 text-red-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>{selectedPost.likes}</span>
                    </button>
                    <span>
                      {new Date(selectedPost.time).toLocaleDateString()}
                    </span>
                    {selectedPost.category && (
                      <span className="bg-red-600 px-3 py-1 rounded text-sm">
                        {selectedPost.category}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-8">
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="md:col-span-2">
                    <p className="text-gray-300 text-lg leading-relaxed mb-6">
                      {selectedPost.paragraph}
                    </p>

                    {/* Comments Section */}
                    <div className="border-t border-gray-700 pt-6">
                      <h3 className="text-xl font-semibold text-white mb-4">
                        Comments
                      </h3>

                      {/* Add Comment Form */}
                      <div className="mb-6">
                        <div className="flex space-x-3">
                          <input
                            type="text"
                            className="flex-1 bg-gray-800 text-white border border-gray-600 rounded px-4 py-2 focus:outline-none focus:border-red-500"
                            placeholder="Add a comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            disabled={isSubmittingComment}
                            onKeyPress={(e) => {
                              if (
                                e.key === "Enter" &&
                                !isSubmittingComment &&
                                newComment.trim()
                              ) {
                                submitComment();
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={submitComment}
                            className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isSubmittingComment || !newComment.trim()}
                          >
                            {isSubmittingComment ? "Posting..." : "Post"}
                          </button>
                        </div>
                      </div>

                      {/* Comments List */}
                      <div className="space-y-4 max-h-60 overflow-y-auto">
                        {isLoadingComments ? (
                          <div className="text-gray-400">
                            Loading comments...
                          </div>
                        ) : comments.length === 0 ? (
                          <div className="text-gray-400">
                            No comments yet. Be the first to comment!
                          </div>
                        ) : (
                          comments.map((comment) => (
                            <div
                              key={comment.id}
                              className="bg-gray-800 rounded p-4"
                            >
                              <p className="text-gray-300">{comment.content}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-white font-semibold mb-2">Details</h4>
                      <div className="text-gray-400 text-sm space-y-1">
                        <p>
                          <span className="text-gray-300">Posted:</span>{" "}
                          {new Date(selectedPost.time).toLocaleString()}
                        </p>
                        {selectedPost.category && (
                          <p>
                            <span className="text-gray-300">Category:</span>{" "}
                            {selectedPost.category}
                          </p>
                        )}
                        <p>
                          <span className="text-gray-300">Likes:</span>{" "}
                          {selectedPost.likes}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
