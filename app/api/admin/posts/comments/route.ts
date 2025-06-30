import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const postId = searchParams.get("postId");

  if (!postId) {
    return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
  }

  try {
    const [rows] = await db.execute(
      "SELECT * FROM Comment WHERE post_id = ? ORDER BY id DESC",
      [parseInt(postId)]
    );

    return NextResponse.json({ comments: rows });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId, content } = body;

    if (!postId || !content) {
      return NextResponse.json(
        { error: "Post ID and content are required" },
        { status: 400 }
      );
    }

    const [result] = await db.execute(
      "INSERT INTO Comment (post_id, content) VALUES (?, ?)",
      [parseInt(postId), content]
    );

    // Get the newly created comment
    const [newComment] = await db.execute(
      "SELECT * FROM Comment WHERE id = ?",
      [(result as any).insertId]
    );

    return NextResponse.json({ comment: (newComment as any[])[0] });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
