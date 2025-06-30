"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Post {
  id: number;
  title: string;
  paragraph: string;
  time: string;
  likes: number;
}

interface User {
  id: number;
  icon: string;
  name: string;
  birthday: string;
  dateOfDeath: string;
  gender: string;
  address: string;
  intro: string;
}

export default function AdminDashboard() {
  const [userId, setUserId] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [error, setError] = useState("");
  const [user, setUser] = useState<User | null>(null);
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
        console.log("Fetched user data:", data.user[0][0]);
        data.user[0][0].birthday = data.user[0][0].birthday.split("T")[0];
        data.user[0][0].dateOfDeath = data.user[0][0].dateOfDeath.split("T")[0];
        setUser(data.user[0][0]);
      } catch (err: any) {
        setError(err.message || "Unknown error");
      }
    };

    if (userId) fetchUser();
  }, [userId]);

  const handleLogout = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* Profile Header */}
      <div className="bg-white max-w-2xl mx-auto p-6 rounded-xl shadow-lg text-center relative">
        <img
          src={user?.icon || "/placeholder-icon.jpg"}
          alt="User Icon"
          className="w-24 h-24 rounded-full mx-auto border-4 border-white shadow-md object-cover"
        />

        <h1 className="text-2xl font-bold mt-2">{user?.name}</h1>
        <p className="text-gray-500">
          {user?.birthday} – {user?.dateOfDeath ? user.dateOfDeath : "Present"}
        </p>
        <p className="italic text-sm mt-2">{user?.intro}</p>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mt-4">
          <button className="border px-4 py-2 rounded-full text-sm text-yellow-600 border-yellow-500 hover:bg-yellow-100">
            ♡ Favorite
          </button>
          <button className="border px-4 py-2 rounded-full text-sm text-yellow-600 border-yellow-500 hover:bg-yellow-100">
            🔄 Share
          </button>
          <button className="border px-4 py-2 rounded-full text-sm text-yellow-600 border-yellow-500 hover:bg-yellow-100">
            ⋯
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-2xl mx-auto mt-6 border-b flex justify-around text-gray-600 font-medium">
        {["Timeline", "Bio", "Media", "Tributes"].map((tab) => (
          <button key={tab} className="py-2 hover:text-black">
            {tab}
          </button>
        ))}
      </div>

      {/* Media Posts */}
      <div className="max-w-2xl mx-auto mt-6">
        {/* <h2 className="text-xl font-semibold mb-4">Your Posts</h2> */}
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {posts.length === 0 ? (
          <p className="text-gray-500">No posts available.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {posts.map((post) => (
              <div key={post.id} className="bg-white p-4 rounded-lg shadow-md">
                <img
                  src="/placeholder-icon.jpg"
                  alt={post.title}
                  className="rounded-md h-40 w-full object-cover mb-2"
                />
                <h3 className="text-md font-semibold">{post.title}</h3>
                <p className="text-gray-500 text-sm mb-1">
                  {new Date(post.time).toLocaleDateString()}
                </p>
                <p className="text-sm">{post.paragraph}</p>
                <p className="text-blue-500 text-sm mt-2">
                  ❤️ {post.likes} Likes
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

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
