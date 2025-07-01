"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, password }),
    });

    const data = await res.json();
    if (res.ok) {
      // redirect to admin dashboard on success
      console.log("Login successful:", data);
      let user = data.user_id; // Assuming you set user.id in the response
      let url = `/admin/dashboard?user=${encodeURIComponent(user)}`;
      router.push(url);
    } else {
      setError(data.message || "Login failed");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div>
        <div className="mb-8 flex flex-col items-center">
          <div className="flex items-center space-x-3 mb-2">
            <img src="/favicon.ico" alt="iTombs Logo" className="w-20 h-20" />
            <h1 className="text-5xl font-bold">iTombs</h1>
          </div>
        </div>
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded shadow-md w-80"
        >
          <h2 className="text-2xl font-bold mb-4 text-center">Login</h2>

          {error && <p className="text-red-500 mb-3">{error}</p>}

          <div className="mb-4">
            <label className="block mb-1 font-semibold">User ID</label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block mb-1 font-semibold">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
