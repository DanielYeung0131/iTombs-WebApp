// app/api/admin/posts/route.ts
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { request } from "http";

export async function GET(req: Request) {
  try {
    // Simulate user_id lookup from auth cookie/session (replace with real session logic)
    const userId = new URL(req.url).searchParams.get("user");

    const [rows] = await db.execute(
      "SELECT id, title, paragraph, time, likes FROM Post WHERE user_id = ? ORDER BY time DESC",
      [userId]
    );

    return NextResponse.json({ posts: rows });
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
