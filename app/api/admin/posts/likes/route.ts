// app/api/admin/posts/[id]/route.ts
import { NextResponse, NextRequest } from "next/server";
import db from "@/lib/db";

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;
    const postId = id;

    // Update the post
    const [result] = await db.execute(
      "UPDATE Post SET likes = likes + 1 WHERE id = ?",
      [parseInt(postId)]
    );

    // Check if any rows were affected
    if ((result as any).affectedRows === 0) {
      return NextResponse.json(
        { error: "Post not found or no changes made" },
        { status: 404 }
      );
    }

    // Get the updated post
    const [updatedPost] = await db.execute("SELECT * FROM Post WHERE id = ?", [
      parseInt(postId),
    ]);

    return NextResponse.json({
      message: "Post updated successfully",
      post: (updatedPost as any[])[0],
    });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 }
    );
  }
}
